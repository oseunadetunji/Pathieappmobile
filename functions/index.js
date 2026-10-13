const { onRequest, onCall, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentCreated, onDocumentWritten } = require('firebase-functions/v2/firestore');
const { defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
const admin = require('firebase-admin');
const crypto = require('crypto');
const Stripe = require('stripe');

admin.initializeApp();
const db = admin.firestore();

const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = defineSecret('STRIPE_WEBHOOK_SECRET');

// Must match SUBSCRIPTION_PRICING in the app (in dollars). One paid tier.
const PRICES = {
  family: { monthly: 9.99, annual: 101.9 },
};

exports.stripeWebhook = onRequest(
  { secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET], region: 'us-central1' },
  async (req, res) => {
    const stripe = new Stripe(STRIPE_SECRET_KEY.value());
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        req.headers['stripe-signature'],
        STRIPE_WEBHOOK_SECRET.value()
      );
    } catch (err) {
      logger.warn('Bad Stripe signature', err.message);
      return res.status(400).send('Invalid signature');
    }

    try {
      if (event.type === 'checkout.session.completed') {
        const s = event.data.object;
        const [uid, tier, cycle] = (s.client_reference_id || '').split('__');
        const expected = PRICES[tier] && PRICES[tier][cycle];
        if (!uid || !expected) {
          logger.error('Unrecognised client_reference_id', s.client_reference_id);
        } else if (s.payment_status !== 'paid') {
          logger.info('Checkout not paid yet', s.id);
        } else if (Math.abs(s.amount_subtotal - Math.round(expected * 100)) > 1) {
          // Guards against someone editing the link to claim a pricier tier
          logger.error('Amount mismatch', { id: s.id, tier, cycle, paid: s.amount_subtotal });
        } else {
          await db.doc(`subscriptions/${uid}`).set(
            {
              tier,
              billingCycle: cycle,
              status: 'active',
              stripeCustomerId: s.customer || null,
              stripeSubscriptionId: s.subscription || null,
              startDate: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
          logger.info('Subscription activated', { uid, tier, cycle });
        }
      } else if (
        event.type === 'customer.subscription.deleted' ||
        (event.type === 'customer.subscription.updated' &&
          !['active', 'trialing', 'past_due'].includes(event.data.object.status))
      ) {
        const sub = event.data.object;
        const snap = await db
          .collection('subscriptions')
          .where('stripeSubscriptionId', '==', sub.id)
          .get();
        for (const d of snap.docs) {
          await d.ref.set(
            { tier: 'free', status: 'canceled', updatedAt: admin.firestore.FieldValue.serverTimestamp() },
            { merge: true }
          );
        }
      }
      res.json({ received: true });
    } catch (err) {
      logger.error('Webhook handler failed', err);
      res.status(500).send('Handler error');
    }
  }
);

// Lets a signed-in customer open Stripe's hosted page to cancel or manage their plan.
const ALLOWED_RETURN_ORIGINS = [
  'https://app.pathieapp.com',
  'https://pathie-398b0.web.app',
  'https://pathie-398b0.firebaseapp.com',
  'http://localhost:19006',
  'http://localhost:8081',
];

exports.createPortalSession = onCall(
  { secrets: [STRIPE_SECRET_KEY], region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Please sign in first.');
    }
    const snap = await db.doc(`subscriptions/${request.auth.uid}`).get();
    const customerId = snap.exists ? snap.data().stripeCustomerId : null;
    if (!customerId) {
      throw new HttpsError('failed-precondition', 'No active subscription found for this account.');
    }
    const origin = request.data && request.data.returnOrigin;
    const returnUrl = ALLOWED_RETURN_ORIGINS.includes(origin)
      ? `${origin}/`
      : 'https://app.pathieapp.com/';
    try {
      const stripe = new Stripe(STRIPE_SECRET_KEY.value());
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });
      return { url: session.url };
    } catch (err) {
      logger.error('Portal session failed', err.message);
      throw new HttpsError('internal', 'Could not open the billing page. Please try again.');
    }
  }
);


// ---------------------------------------------------------------------------
// Free-tier limits, enforced server-side so they can't be bypassed from a browser.
// Keep in sync with SUBSCRIPTION_LIMITS in the app.
// IMPORTANT: FIRESTORE_REGION must match your Firestore database location
// (check: Firebase console > Firestore > Data tab > location).
// ---------------------------------------------------------------------------
const FIRESTORE_REGION = 'northamerica-northeast2';
const FREE_MAX_CHILDREN = 1;
const FREE_MAX_GOALS = 2;

async function isPaid(uid) {
  const snap = await db.doc(`subscriptions/${uid}`).get();
  const d = snap.exists ? snap.data() : null;
  return !!d && d.tier === 'family' && ['active', 'trialing', 'past_due'].includes(d.status || 'active');
}

// A free account cannot hold more than one child: remove any extra child doc at creation.
exports.enforceChildLimit = onDocumentCreated(
  { document: 'children/{childId}', region: FIRESTORE_REGION },
  async (event) => {
    const data = event.data && event.data.data();
    const uid = data && data.userId;
    if (!uid || (await isPaid(uid))) return;
    const snap = await db.collection('children').where('userId', '==', uid).get();
    if (snap.size <= FREE_MAX_CHILDREN) return;
    // Keep the oldest child(ren); delete this newcomer.
    const sorted = snap.docs.sort((a, b) => {
      const ta = a.createTime.toMillis(), tb = b.createTime.toMillis();
      return ta - tb;
    });
    const keep = new Set(sorted.slice(0, FREE_MAX_CHILDREN).map((d) => d.id));
    if (!keep.has(event.params.childId)) {
      logger.warn('Free child limit exceeded; removing', { uid, childId: event.params.childId });
      await db.doc(`children/${event.params.childId}`).delete();
    }
  }
);

// A free child cannot hold more than two goals: trim any increase beyond the limit.
exports.enforceGoalLimit = onDocumentWritten(
  { document: 'children/{childId}', region: FIRESTORE_REGION },
  async (event) => {
    const after = event.data && event.data.after && event.data.after.data();
    if (!after) return; // deleted
    const before = event.data.before && event.data.before.data();
    const goals = Array.isArray(after.goals) ? after.goals : [];
    if (goals.length <= FREE_MAX_GOALS) return;
    // Only block growth; leave pre-existing over-limit children untouched.
    const beforeLen = before && Array.isArray(before.goals) ? before.goals.length : 0;
    if (before && goals.length <= beforeLen) return;
    if (await isPaid(after.userId)) return;
    const trimmed = before && beforeLen > FREE_MAX_GOALS ? before.goals : goals.slice(0, FREE_MAX_GOALS);
    logger.warn('Free goal limit exceeded; trimming', { childId: event.params.childId });
    await event.data.after.ref.update({ goals: trimmed });
  }
);


// ---------------------------------------------------------------------------
// Free plan: 5 provider searches a month, counted here so users can't edit the counter.
// ---------------------------------------------------------------------------
const FREE_MAX_SEARCHES = 5;
const FREE_MAX_ACTIVE_ACTIVITIES = 10;

exports.recordProviderSearch = onCall({ region: 'us-central1' }, async (request) => {
  const uid = request.auth && request.auth.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in required');
  if (await isPaid(uid)) return { allowed: true, unlimited: true };

  const month = new Date().toISOString().slice(0, 7); // YYYY-MM (UTC)
  const ref = db.doc(`usage/${uid}`);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const d = snap.exists ? snap.data() : {};
    const used = d.searchMonth === month ? d.providerSearchesThisMonth || 0 : 0;
    if (used >= FREE_MAX_SEARCHES) return { allowed: false, used, limit: FREE_MAX_SEARCHES };
    tx.set(
      ref,
      { searchMonth: month, providerSearchesThisMonth: used + 1, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );
    return { allowed: true, used: used + 1, limit: FREE_MAX_SEARCHES };
  });
});

// Free accounts: at most 10 not-yet-completed scheduled activities. Remove overflow at creation.
exports.enforceActivityLimit = onDocumentCreated(
  { document: 'activities/{activityId}', region: FIRESTORE_REGION },
  async (event) => {
    const data = event.data && event.data.data();
    const uid = data && data.userId;
    if (!uid || (await isPaid(uid))) return;
    const snap = await db.collection('activities').where('userId', '==', uid).get();
    const active = snap.docs
      .filter((d) => d.data().completed !== true)
      .sort((a, b) => a.createTime.toMillis() - b.createTime.toMillis() || (a.id < b.id ? -1 : 1));
    const keep = new Set(active.slice(0, FREE_MAX_ACTIVE_ACTIVITIES).map((d) => d.id));
    if (active.length > FREE_MAX_ACTIVE_ACTIVITIES && !keep.has(event.params.activityId)) {
      logger.warn('Free activity limit exceeded; removing', { uid, id: event.params.activityId });
      await db.doc(`activities/${event.params.activityId}`).delete();
    }
  }
);


// ---------------------------------------------------------------------------
// Account deletion: set the Stripe subscription to cancel at period end and remove
// billing/usage records so a deleted account is never billed again.
// Fails (throws) if a live subscription cannot be cancelled, so the app aborts deletion.
// ---------------------------------------------------------------------------
exports.prepareAccountDeletion = onCall(
  { secrets: [STRIPE_SECRET_KEY], region: 'us-central1' },
  async (request) => {
    const uid = request.auth && request.auth.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'Please sign in first.');

    const ref = db.doc(`subscriptions/${uid}`);
    const snap = await ref.get();
    const subId = snap.exists ? snap.data().stripeSubscriptionId : null;

    if (subId) {
      try {
        const stripe = new Stripe(STRIPE_SECRET_KEY.value());
        await stripe.subscriptions.update(subId, { cancel_at_period_end: true });
        logger.info('Subscription set to cancel at period end for account deletion', { uid, subId });
      } catch (err) {
        // Already cancelled / not found is fine; anything else must block deletion.
        const gone = err && (err.code === 'resource_missing' || /No such subscription|already been canceled|canceled subscription/i.test(err.message || ''));
        if (!gone) {
          logger.error('Could not cancel subscription for deletion', { uid, msg: err.message });
          throw new HttpsError('internal', 'Could not cancel subscription.');
        }
      }
    }

    await ref.delete().catch(() => {});
    await db.doc(`usage/${uid}`).delete().catch(() => {});
    return { ok: true };
  }
);


// ---------------------------------------------------------------------------
// Email verification by 6-digit code (link-scanner proof), sent from our own domain via Resend.
// Setup: RESEND_API_KEY secret + pathieapp.com verified in Resend.
// ---------------------------------------------------------------------------
const RESEND_API_KEY = defineSecret('RESEND_API_KEY');
const CODE_TTL_MS = 15 * 60 * 1000;
const MAX_SENDS_PER_HOUR = 5;
const MIN_SEND_GAP_MS = 30 * 1000;
const MAX_ATTEMPTS = 5;
const hashCode = (code, uid) => crypto.createHash('sha256').update(`${code}:${uid}`).digest('hex');

exports.sendVerificationCode = onCall(
  { secrets: [RESEND_API_KEY], region: 'us-central1' },
  async (request) => {
    const uid = request.auth && request.auth.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'Please sign in first.');

    const user = await admin.auth().getUser(uid);
    if (user.emailVerified) return { verified: true };
    if (!user.email) throw new HttpsError('failed-precondition', 'No email on this account.');

    const ref = db.doc(`emailVerifications/${uid}`);
    const snap = await ref.get();
    const now = Date.now();
    const sends = ((snap.exists && snap.data().sends) || []).filter((t) => now - t < 60 * 60 * 1000);
    if (sends.length && now - sends[sends.length - 1] < MIN_SEND_GAP_MS) {
      throw new HttpsError('resource-exhausted', 'Please wait a few seconds before requesting another code.');
    }
    if (sends.length >= MAX_SENDS_PER_HOUR) {
      throw new HttpsError('resource-exhausted', 'Too many codes requested. Please try again in a while.');
    }

    const code = String(crypto.randomInt(100000, 1000000));
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY.value()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Pathie <noreply@pathieapp.com>',
        reply_to: 'support@pathieapp.com',
        to: [user.email],
        subject: `Your Pathie verification code: ${code}`,
        text: `Your Pathie verification code is ${code}.\n\nIt expires in 15 minutes. If you didn't create a Pathie account, you can ignore this email.`,
        html: `<div style="font-family:Arial,sans-serif;max-width:420px;margin:0 auto;padding:24px">
          <h2 style="color:#6B21A8;margin:0 0 12px">Verify your email</h2>
          <p style="color:#374151;font-size:15px">Enter this code in Pathie to verify your email address:</p>
          <p style="font-size:34px;font-weight:700;letter-spacing:8px;color:#111827;margin:16px 0">${code}</p>
          <p style="color:#6B7280;font-size:13px">It expires in 15 minutes. If you didn't create a Pathie account, you can ignore this email.</p>
        </div>`,
      }),
    });
    if (!res.ok) {
      logger.error('Resend failed', { status: res.status, body: (await res.text()).slice(0, 300) });
      throw new HttpsError('internal', 'Could not send the email. Please try again.');
    }

    await ref.set({ hash: hashCode(code, uid), expiresAt: now + CODE_TTL_MS, attempts: 0, sends: [...sends, now] });
    return { sent: true };
  }
);

exports.confirmVerificationCode = onCall({ region: 'us-central1' }, async (request) => {
  const uid = request.auth && request.auth.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Please sign in first.');
  const code = String((request.data && request.data.code) || '').trim();
  if (!/^\d{6}$/.test(code)) throw new HttpsError('invalid-argument', 'Enter the 6-digit code.');

  const ref = db.doc(`emailVerifications/${uid}`);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('failed-precondition', 'No code requested. Tap Resend code.');
  const d = snap.data();
  if (Date.now() > d.expiresAt) throw new HttpsError('deadline-exceeded', 'That code has expired. Tap Resend code.');
  if (d.attempts >= MAX_ATTEMPTS) throw new HttpsError('resource-exhausted', 'Too many wrong attempts. Tap Resend code for a new one.');

  const a = Buffer.from(hashCode(code, uid));
  const b = Buffer.from(d.hash);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    await ref.update({ attempts: admin.firestore.FieldValue.increment(1) });
    throw new HttpsError('invalid-argument', "That code isn't right. Check it and try again.");
  }

  await admin.auth().updateUser(uid, { emailVerified: true });
  await ref.delete();
  return { verified: true };
});
