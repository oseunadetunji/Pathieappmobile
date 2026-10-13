import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Linking, Platform, ActivityIndicator } from 'react-native';
import { httpsCallable } from 'firebase/functions';
import { useSubscription, SUBSCRIPTION_TIERS, SUBSCRIPTION_PRICING } from '../context/SubscriptionContext';
import { showAlert } from '../utils/crossAlert';
import { auth, functions } from '../../firebase';

// Stripe sandbox test mode. Set to false to use the live payment links below.
const STRIPE_TEST_MODE = false;
const TEST_LINKS = {
  family: {
    monthly: 'https://buy.stripe.com/test_4gMdR8a8V5SneIHcZx9k400', // sandbox 9.99/mo
    annual: null
  }
};

export default function PricingScreen({ navigation }) {
  const { subscription, tier } = useSubscription();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [openingPortal, setOpeningPortal] = useState(false);

  // Opens Stripe's hosted page where the customer can cancel or update billing
  const handleManageSubscription = async () => {
    setOpeningPortal(true);
    try {
      const returnOrigin = Platform.OS === 'web' ? window.location.origin : undefined;
      const call = httpsCallable(functions, 'createPortalSession');
      const result = await call({ returnOrigin });
      const url = result.data && result.data.url;
      if (!url) throw new Error('No billing link returned');
      if (Platform.OS === 'web') {
        window.location.href = url;
      } else {
        await Linking.openURL(url);
      }
    } catch (error) {
      showAlert('Could not open billing', (error && error.message) || 'Please try again in a moment.');
    } finally {
      setOpeningPortal(false);
    }
  };

  // Launch lineup: Free (1 child) + one paid plan.
  // Live Stripe payment links: 9.99/mo and 101.90/yr (CAD).
  const plans = [
    {
      id: SUBSCRIPTION_TIERS.FAMILY,
      name: 'Family',
      description: 'For 2+ children, or no limits for one',
      monthlyPrice: 9.99,
      annualPrice: 101.90,
      popular: true,
      features: [
        'Unlimited child profiles',
        'Unlimited goals per child',
        'Unlimited provider searches',
        'Unlimited scheduled activities',
        'Recurring schedules',
        'Advanced progress analytics',
        'Calendar export (Google/Apple)',
        'Priority support (24hr)',
      ],
      disabledFeatures: [],
      stripeLinks: {
        monthly: 'https://buy.stripe.com/fZuaEW80N6WrcAzgbJ9k407',
        annual: 'https://buy.stripe.com/4gMeVc5SF6Wrasrf7F9k408'
      }
    }
  ];

  const handleSelectPlan = async (plan) => {
    const baseLink = STRIPE_TEST_MODE
      ? (TEST_LINKS[plan.id] && TEST_LINKS[plan.id][billingCycle])
      : plan.stripeLinks[billingCycle];
    if (!baseLink) {
      showAlert('Coming soon', 'Subscriptions are opening shortly. Thanks for your patience!');
      return;
    }
    const uid = auth.currentUser?.uid;
    if (!uid) {
      showAlert('Sign in required', 'Please sign in before choosing a plan.');
      return;
    }
    // client_reference_id lets the Stripe webhook credit the right account
    const stripeUrl = `${baseLink}?client_reference_id=${uid}__${plan.id}__${billingCycle}`;
    
    showAlert(
      'Subscribe to ' + plan.name,
      `You'll be redirected to Stripe to complete your ${billingCycle} subscription for $${billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice}${billingCycle === 'monthly' ? '/mo' : '/yr'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue to Stripe',
          onPress: async () => {
            try {
              // Open Stripe checkout
              const supported = await Linking.canOpenURL(stripeUrl);
              if (supported) {
                await Linking.openURL(stripeUrl);
              } else {
                showAlert('Error', 'Unable to open payment page');
              }
            } catch (error) {
              showAlert('Error', 'Failed to open payment page');
            }
          }
        }
      ]
    );
  };


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Plan</Text>
        <Text style={styles.subtitle}>Simple pricing. Cancel anytime.</Text>
      </View>

      {/* Billing Toggle */}
      <View style={styles.billingToggle}>
        <TouchableOpacity
          style={[styles.toggleButton, billingCycle === 'monthly' && styles.toggleButtonActive]}
          onPress={() => setBillingCycle('monthly')}
        >
          <Text style={[styles.toggleText, billingCycle === 'monthly' && styles.toggleTextActive]}>
            Monthly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, billingCycle === 'annual' && styles.toggleButtonActive]}
          onPress={() => setBillingCycle('annual')}
        >
          <Text style={[styles.toggleText, billingCycle === 'annual' && styles.toggleTextActive]}>
            Annual
          </Text>
          <View style={styles.saveBadge}>
            <Text style={styles.saveBadgeText}>SAVE 15%</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {plans.map((plan) => (
          <View
            key={plan.id}
            style={[
              styles.planCard,
              plan.popular && styles.planCardPopular,
              tier === plan.id && styles.planCardCurrent
            ]}
          >
            {plan.popular && <View style={styles.popularBadge}><Text style={styles.popularText}>⭐ MOST POPULAR</Text></View>}
            {tier === plan.id && <View style={styles.currentBadge}><Text style={styles.currentText}>✓ CURRENT PLAN</Text></View>}

            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.planDescription}>{plan.description}</Text>

            <View style={styles.priceContainer}>
              <Text style={styles.price}>
                ${billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice}
              </Text>
              <Text style={styles.pricePeriod}>/{billingCycle === 'monthly' ? 'month' : 'year'}</Text>
            </View>

            <View style={styles.featuresContainer}>
              {plan.features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Text style={styles.featureIcon}>✓</Text>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
              {plan.disabledFeatures.map((feature, index) => (
                <View key={`disabled-${index}`} style={styles.featureRow}>
                  <Text style={styles.featureIconDisabled}>—</Text>
                  <Text style={styles.featureTextDisabled}>{feature}</Text>
                </View>
              ))}
            </View>

            {tier === plan.id ? (
              <View>
                <View style={styles.currentPlanButton}>
                  <Text style={styles.currentPlanText}>Current Plan</Text>
                </View>
                <TouchableOpacity
                  style={[styles.selectButton, { marginTop: 10 }]}
                  onPress={handleManageSubscription}
                  disabled={openingPortal}
                >
                  {openingPortal ? (
                    <ActivityIndicator />
                  ) : (
                    <Text style={styles.selectButtonText}>Manage or cancel subscription</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.selectButton, plan.popular && styles.selectButtonPopular]}
                onPress={() => handleSelectPlan(plan)}
              >
                <Text style={[styles.selectButtonText, plan.popular && styles.selectButtonTextPopular]}>
                  Select Plan →
                </Text>
              </TouchableOpacity>
            )}

          </View>
        ))}

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <Text style={styles.faqTitle}>Frequently Asked Questions</Text>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Can I change plans later?</Text>
            <Text style={styles.faqAnswer}>
              Yes! You can upgrade or downgrade anytime. Upgrades take effect immediately. Downgrades take effect at your next billing cycle.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>What happens if I exceed my limits on Starter?</Text>
            <Text style={styles.faqAnswer}>
              We'll notify you when approaching limits. You can upgrade to Family for unlimited access or wait until next month when limits reset.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Can I cancel anytime?</Text>
            <Text style={styles.faqAnswer}>
              Yes! Cancel anytime in Settings. No cancellation fees. You'll retain access until the end of your billing period.
            </Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: '#9333EA',
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#E9D5FF',
  },
  billingToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    padding: 20,
    backgroundColor: 'white',
  },
  toggleButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  toggleButtonActive: {
    backgroundColor: '#9333EA',
    borderColor: '#9333EA',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  toggleTextActive: {
    color: 'white',
  },
  saveBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  saveBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  planCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  planCardPopular: {
    borderColor: '#9333EA',
    borderWidth: 3,
  },
  planCardCurrent: {
    borderColor: '#10B981',
    borderWidth: 3,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    left: '50%',
    transform: [{ translateX: -60 }],
    backgroundColor: '#9333EA',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  popularText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  currentBadge: {
    position: 'absolute',
    top: -12,
    left: '50%',
    transform: [{ translateX: -60 }],
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  currentText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1F2937',
    marginTop: 8,
  },
  planDescription: {
    fontSize: 14,
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    marginBottom: 24,
  },
  price: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#9333EA',
  },
  pricePeriod: {
    fontSize: 16,
    color: '#6B7280',
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  featureIcon: {
    color: '#10B981',
    fontSize: 18,
    fontWeight: 'bold',
  },
  featureIconDisabled: {
    color: '#D1D5DB',
    fontSize: 18,
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
  },
  featureTextDisabled: {
    flex: 1,
    fontSize: 15,
    color: '#9CA3AF',
  },
  selectButton: {
    backgroundColor: '#E5E7EB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  selectButtonPopular: {
    backgroundColor: '#9333EA',
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
  },
  selectButtonTextPopular: {
    color: 'white',
  },
  currentPlanButton: {
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  currentPlanText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  guarantee: {
    textAlign: 'center',
    fontSize: 12,
    color: '#6B7280',
    marginTop: 12,
  },
  faqSection: {
    marginTop: 24,
    marginBottom: 24,
  },
  faqTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  faqItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  testNote: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  testNoteText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 20,
  },
});
