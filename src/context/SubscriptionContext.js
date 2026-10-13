import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { auth, db, functions } from '../../firebase';
import { doc, onSnapshot, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { showAlert } from '../utils/crossAlert';

// Subscription tier definitions
export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  FAMILY: 'family'
};

// Pricing information
export const SUBSCRIPTION_PRICING = {
  [SUBSCRIPTION_TIERS.FAMILY]: {
    monthly: 9.99,
    annual: 101.90,
    name: 'Family',
    description: 'Unlimited children, goals and activities',
    popular: true
  }
};

// Feature limits by tier
export const SUBSCRIPTION_LIMITS = {
  [SUBSCRIPTION_TIERS.FREE]: {
    maxChildren: 1,
    maxGoalsPerChild: 2,
    maxScheduledActivities: 10,
    maxProviderSearches: 5,
    canUseRecurringSchedules: false,
    canUseAdvancedAnalytics: false,
    canExportCalendar: false,
    canUseFamilySharing: false,
    canUseBulkScheduling: false,
    canUseAIRecommendations: false,
    canUseProviderComparison: false,
    canUseCostTracking: false,
    supportResponseTime: '7 days'
  },
  [SUBSCRIPTION_TIERS.FAMILY]: {
    maxChildren: Infinity,
    maxGoalsPerChild: Infinity,
    maxScheduledActivities: Infinity,
    maxProviderSearches: Infinity,
    canUseRecurringSchedules: true,
    canUseAdvancedAnalytics: true,
    canExportCalendar: true,
    canUseFamilySharing: true,
    canUseBulkScheduling: false,
    canUseAIRecommendations: false,
    canUseProviderComparison: false,
    canUseCostTracking: false,
    supportResponseTime: '24 hours'
  }
};

const SubscriptionContext = createContext();

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

export function SubscriptionProvider({ children }) {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState({
    childrenCount: 0,
    scheduledActivitiesCount: 0,
    providerSearchesThisMonth: 0
  });

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      setLoading(false);
      return;
    }

    // Listen to subscription changes
    const unsubscribeSubscription = onSnapshot(
      doc(db, 'subscriptions', userId),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
            setSubscription({
              tier: data.tier || SUBSCRIPTION_TIERS.FREE,
              status: data.status || 'active',
              billingCycle: data.billingCycle || 'monthly',
              startDate: data.startDate?.toDate(),
              expiresAt: data.expiresAt?.toDate(),
              stripeCustomerId: data.stripeCustomerId,
              stripeSubscriptionId: data.stripeSubscriptionId
            });
          } else {
            // No subscription document = free tier
            setSubscription({
              tier: SUBSCRIPTION_TIERS.FREE,
              status: 'active',
              billingCycle: null,
              startDate: null,
              expiresAt: null
            });
          }
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching subscription:', error);
          setLoading(false);
        }
      );

    // Listen to usage data
  const unsubscribeUsage = onSnapshot(
      doc(db, 'usage', userId),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
            setUsage({
              childrenCount: data.childrenCount || 0,
              scheduledActivitiesCount: data.scheduledActivitiesCount || 0,
              providerSearchesThisMonth: data.providerSearchesThisMonth || 0,
              lastResetDate: data.lastResetDate?.toDate()
            });
          }
        },
        (error) => {
          console.error('Error fetching usage:', error);
        }
      );

    return () => {
      unsubscribeSubscription();
      unsubscribeUsage();
    };
  }, []);

  // Get current tier limits
  const getLimits = () => {
    if (!subscription) return SUBSCRIPTION_LIMITS[SUBSCRIPTION_TIERS.FREE];
    return SUBSCRIPTION_LIMITS[subscription.tier] || SUBSCRIPTION_LIMITS[SUBSCRIPTION_TIERS.FREE];
  };

  // Check if user can perform an action
  const canAddChild = () => {
    const limits = getLimits();
    return usage.childrenCount < limits.maxChildren;
  };

  const canScheduleActivity = () => {
    const limits = getLimits();
    return usage.scheduledActivitiesCount < limits.maxScheduledActivities;
  };

  const canSearchProviders = () => {
    const limits = getLimits();
    return usage.providerSearchesThisMonth < limits.maxProviderSearches;
  };

  const hasFeature = (featureName) => {
    const limits = getLimits();
    return limits[featureName] === true;
  };

  // Increment usage counters
  const incrementUsage = async (metric) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      const usageRef = doc(db, 'usage', userId);
      const usageDoc = await getDoc(usageRef);
      
      if (!usageDoc.exists()) {
        // Create initial usage document
        await setDoc(usageRef, {
          childrenCount: metric === 'childrenCount' ? 1 : 0,
          scheduledActivitiesCount: metric === 'scheduledActivitiesCount' ? 1 : 0,
          providerSearchesThisMonth: metric === 'providerSearchesThisMonth' ? 1 : 0,
          lastResetDate: new Date(),
          updatedAt: new Date()
        });
      } else {
        // Increment existing counter
        const updates = {
          [metric]: (usageDoc.data()[metric] || 0) + 1,
          updatedAt: new Date()
        };
        await updateDoc(usageRef, updates);
      }
    } catch (error) {
      console.error('Error incrementing usage:', error);
    }
  };

  // Decrement usage counters (when items are deleted)
  const decrementUsage = async (metric) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      const usageRef = doc(db, 'usage', userId);
      const usageDoc = await getDoc(usageRef);
      
      if (usageDoc.exists()) {
        const currentValue = usageDoc.data()[metric] || 0;
        const updates = {
          [metric]: Math.max(0, currentValue - 1), // Don't go below 0
          updatedAt: new Date()
        };
        await updateDoc(usageRef, updates);
      }
    } catch (error) {
      console.error('Error decrementing usage:', error);
    }
  };

  // Get upgrade prompt message (launch lineup: Free + Family only)
  const getUpgradeMessage = (feature) => {
    const messages = {
      maxChildren: 'Free includes 1 child. Upgrade to Family ($9.99/mo) to add more children.',
      maxGoalsPerChild: 'Free includes 2 goals per child. Upgrade to Family ($9.99/mo) for unlimited goals.',
      maxScheduledActivities: 'Free includes 10 scheduled activities. Upgrade to Family ($9.99/mo) for unlimited, or complete or remove some to free up space.',
      maxProviderSearches: "You've used your 5 free activity searches this month. Upgrade to Family ($9.99/mo) for unlimited searches.",
      recurringSchedules: 'Recurring schedules are a Family feature. Upgrade to Family ($9.99/mo), or schedule a single session.',
      advancedAnalytics: 'Upgrade to Family ($9.99/mo) for advanced analytics',
    };

    return messages[feature] || 'Upgrade to Family to unlock this feature';
  };

  // ---- Limit gates (call these instead of navigating straight to AddGoal) ----
  const promptUpgrade = (feature, navigation) => {
    showAlert('Upgrade to Family', getUpgradeMessage(feature), [
      { text: 'Not now', style: 'cancel' },
      { text: 'See plans', onPress: () => navigation.navigate('Pricing') }
    ]);
  };

  // Verified email is required before creating a child profile (curbs throwaway accounts).
  // Verification is by a 6-digit code emailed from our own domain (a code can't be used up by link scanners).
  const [verifyOpen, setVerifyOpen] = useState(false);

  const ensureVerifiedEmail = async () => {
    const user = auth.currentUser;
    if (!user) return false;
    try { await user.reload(); } catch (e) { /* offline: fall through to current state */ }
    if (auth.currentUser?.emailVerified) return true;
    setVerifyOpen(true);
    return false;
  };

  // Counts real child documents (not the client-writable usage counter).
  const checkCanAddChild = async (navigation) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return false;
    if (!(await ensureVerifiedEmail())) return false;
    const max = getLimits().maxChildren;
    if (max !== Infinity) {
      try {
        const snap = await getDocs(query(collection(db, 'children'), where('userId', '==', userId)));
        if (snap.size >= max) {
          promptUpgrade('maxChildren', navigation);
          return false;
        }
      } catch (e) {
        console.error('Child limit check failed:', e);
      }
    }
    return true;
  };

  const checkCanAddGoal = (child, navigation) => {
    const max = getLimits().maxGoalsPerChild;
    if (max !== Infinity && (child?.goals?.length || 0) >= max) {
      promptUpgrade('maxGoalsPerChild', navigation);
      return false;
    }
    return true;
  };

  // Scheduled-activity cap (counts real upcoming/not-completed docs) + recurring is a Family feature.
  // Returns true if allowed; otherwise shows the upgrade prompt and returns false.
  const checkCanSchedule = async (newCount, recurrence, navigation) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return false;
    if (recurrence && recurrence !== 'once' && !hasFeature('canUseRecurringSchedules')) {
      promptUpgrade('recurringSchedules', navigation);
      return false;
    }
    const max = getLimits().maxScheduledActivities;
    if (max === Infinity) return true;
    try {
      const snap = await getDocs(query(collection(db, 'activities'), where('userId', '==', userId)));
      const active = snap.docs.filter((d) => d.data().completed !== true).length;
      if (active + newCount > max) {
        promptUpgrade('maxScheduledActivities', navigation);
        return false;
      }
    } catch (e) {
      console.error('Schedule limit check failed:', e);
    }
    return true;
  };

  // Provider-search cap: counted server-side (users can't edit the counter). Fails open on network errors.
  const checkAndRecordSearch = async (navigation) => {
    try {
      const res = await httpsCallable(functions, 'recordProviderSearch')();
      if (res.data && res.data.allowed === false) {
        promptUpgrade('maxProviderSearches', navigation);
        return false;
      }
    } catch (e) {
      console.error('Search limit check failed:', e);
    }
    return true;
  };

  const startAddChild = async (navigation) => {
    if (await checkCanAddChild(navigation)) navigation.navigate('AddGoal', { mode: 'newChild' });
  };

  const startAddGoal = (child, navigation) => {
    if (checkCanAddGoal(child, navigation)) navigation.navigate('AddGoal', { child, mode: 'addGoal' });
  };

  const value = {
    subscription,
    loading,
    usage,
    tier: subscription?.tier || SUBSCRIPTION_TIERS.FREE,
    isActive: subscription?.status === 'active',
    isFree: subscription?.tier === SUBSCRIPTION_TIERS.FREE,
    isFamily: subscription?.tier === SUBSCRIPTION_TIERS.FAMILY,
    limits: getLimits(),
    canAddChild,
    canScheduleActivity,
    canSearchProviders,
    hasFeature,
    incrementUsage,
    decrementUsage,
    getUpgradeMessage,
    promptUpgrade,
    checkCanAddChild,
    checkCanAddGoal,
    startAddChild,
    startAddGoal,
    checkCanSchedule,
    checkAndRecordSearch
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
      <VerifyEmailModal visible={verifyOpen} onClose={() => setVerifyOpen(false)} />
    </SubscriptionContext.Provider>
  );
}

function VerifyEmailModal({ visible, onClose }) {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const sentFor = useRef(false);

  const send = async () => {
    setBusy(true);
    setMessage('');
    try {
      const res = await httpsCallable(functions, 'sendVerificationCode')();
      if (res.data && res.data.verified) {
        await auth.currentUser?.reload();
        setDone(true);
      } else {
        setMessage(`We emailed a 6-digit code to ${auth.currentUser?.email}. It can take a minute; check your spam folder too.`);
      }
    } catch (e) {
      setMessage(e?.message?.replace(/^.*?:\s*/, '') || 'Could not send the code. Please try again.');
    }
    setBusy(false);
  };

  useEffect(() => {
    if (visible && !sentFor.current) { sentFor.current = true; setCode(''); setDone(false); send(); }
    if (!visible) sentFor.current = false;
  }, [visible]);

  const confirm = async () => {
    setBusy(true);
    setMessage('');
    try {
      await httpsCallable(functions, 'confirmVerificationCode')({ code });
      await auth.currentUser?.getIdToken(true);
      await auth.currentUser?.reload();
      setDone(true);
    } catch (e) {
      setMessage(e?.message?.replace(/^.*?:\s*/, '') || 'Could not verify. Please try again.');
    }
    setBusy(false);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={vs.backdrop}>
        <View style={vs.card}>
          <Text style={vs.title}>{done ? 'Email verified' : 'Verify your email'}</Text>
          {done ? (
            <>
              <Text style={vs.body}>You're all set. Tap Add Child again to continue.</Text>
              <TouchableOpacity style={vs.primary} onPress={onClose}><Text style={vs.primaryText}>Continue</Text></TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={vs.body}>Enter the 6-digit code we emailed to {auth.currentUser?.email}.</Text>
              <TextInput
                style={vs.input}
                value={code}
                onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                placeholder="123456"
                maxLength={6}
                autoFocus
              />
              {!!message && <Text style={vs.msg}>{message}</Text>}
              <TouchableOpacity
                style={[vs.primary, (busy || code.length !== 6) && vs.disabled]}
                disabled={busy || code.length !== 6}
                onPress={confirm}
              >
                <Text style={vs.primaryText}>{busy ? 'Please wait...' : 'Verify'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={vs.secondary} disabled={busy} onPress={send}>
                <Text style={vs.secondaryText}>Resend code</Text>
              </TouchableOpacity>
              <TouchableOpacity style={vs.secondary} onPress={onClose}>
                <Text style={vs.secondaryText}>Not now</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const vs = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
  body: { fontSize: 15, color: '#4B5563', marginBottom: 16, lineHeight: 21 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 14, fontSize: 24, letterSpacing: 8, textAlign: 'center', color: '#111827', marginBottom: 12 },
  msg: { fontSize: 13, color: '#6B7280', marginBottom: 12, lineHeight: 18 },
  primary: { backgroundColor: '#8B3CE0', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 8 },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.5 },
  secondary: { padding: 10, alignItems: 'center' },
  secondaryText: { color: '#6B21A8', fontSize: 15, fontWeight: '600' }
});
