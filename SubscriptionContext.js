import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../../firebase';

// Subscription tier definitions
export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  STARTER: 'starter',
  FAMILY: 'family',
  PREMIUM: 'premium'
};

// Pricing information
export const SUBSCRIPTION_PRICING = {
  [SUBSCRIPTION_TIERS.STARTER]: {
    monthly: 9.99,
    annual: 47.90,
    name: 'Starter',
    description: 'Perfect for 1 child'
  },
  [SUBSCRIPTION_TIERS.FAMILY]: {
    monthly: 19.99,
    annual: 95.90,
    name: 'Family',
    description: 'Perfect for 2+ children',
    popular: true
  },
  [SUBSCRIPTION_TIERS.PREMIUM]: {
    monthly: 29.99,
    annual: 191.90,
    name: 'Premium',
    description: 'Perfect for power users'
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
  [SUBSCRIPTION_TIERS.STARTER]: {
    maxChildren: 1,
    maxGoalsPerChild: Infinity,
    maxScheduledActivities: 30,
    maxProviderSearches: 20,
    canUseRecurringSchedules: false,
    canUseAdvancedAnalytics: false,
    canExportCalendar: false,
    canUseFamilySharing: false,
    canUseBulkScheduling: false,
    canUseAIRecommendations: false,
    canUseProviderComparison: false,
    canUseCostTracking: false,
    supportResponseTime: '48 hours'
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
  },
  [SUBSCRIPTION_TIERS.PREMIUM]: {
    maxChildren: Infinity,
    maxGoalsPerChild: Infinity,
    maxScheduledActivities: Infinity,
    maxProviderSearches: Infinity,
    canUseRecurringSchedules: true,
    canUseAdvancedAnalytics: true,
    canExportCalendar: true,
    canUseFamilySharing: true,
    canUseBulkScheduling: true,
    canUseAIRecommendations: true,
    canUseProviderComparison: true,
    canUseCostTracking: true,
    supportResponseTime: '8 hours'
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
    const unsubscribeSubscription = db
      .collection('subscriptions')
      .doc(userId)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            const data = doc.data();
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
    const unsubscribeUsage = db
      .collection('usage')
      .doc(userId)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            const data = doc.data();
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

  // Update subscription tier (for testing or manual assignment)
  const updateSubscriptionTier = async (tier, billingCycle = 'monthly') => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      await db.collection('subscriptions').doc(userId).set({
        tier,
        billingCycle,
        status: 'active',
        startDate: new Date(),
        expiresAt: null, // Set based on billing cycle in production
        updatedAt: new Date()
      }, { merge: true });
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  };

  // Increment usage counters
  const incrementUsage = async (metric) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      const usageRef = db.collection('usage').doc(userId);
      const usageDoc = await usageRef.get();
      
      if (!usageDoc.exists) {
        // Create initial usage document
        await usageRef.set({
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
        await usageRef.update(updates);
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
      const usageRef = db.collection('usage').doc(userId);
      const usageDoc = await usageRef.get();
      
      if (usageDoc.exists) {
        const currentValue = usageDoc.data()[metric] || 0;
        const updates = {
          [metric]: Math.max(0, currentValue - 1), // Don't go below 0
          updatedAt: new Date()
        };
        await usageRef.update(updates);
      }
    } catch (error) {
      console.error('Error decrementing usage:', error);
    }
  };

  // Get upgrade prompt message
  const getUpgradeMessage = (feature) => {
    const currentTier = subscription?.tier || SUBSCRIPTION_TIERS.FREE;
    
    const messages = {
      maxChildren: {
        free: 'Upgrade to Starter ($9.99/mo) to add 1 child',
        starter: 'Upgrade to Family ($19.99/mo) for unlimited children'
      },
      maxScheduledActivities: {
        free: 'Upgrade to Starter ($9.99/mo) for 30 activities',
        starter: 'Upgrade to Family ($19.99/mo) for unlimited activities'
      },
      maxProviderSearches: {
        free: 'Upgrade to Starter ($9.99/mo) for 20 searches/month',
        starter: 'Upgrade to Family ($19.99/mo) for unlimited searches'
      },
      recurringSchedules: {
        free: 'Upgrade to Family ($19.99/mo) for recurring schedules',
        starter: 'Upgrade to Family ($19.99/mo) for recurring schedules'
      },
      advancedAnalytics: {
        free: 'Upgrade to Family ($19.99/mo) for advanced analytics',
        starter: 'Upgrade to Family ($19.99/mo) for advanced analytics'
      },
      aiRecommendations: {
        free: 'Upgrade to Premium ($29.99/mo) for AI recommendations',
        starter: 'Upgrade to Premium ($29.99/mo) for AI recommendations',
        family: 'Upgrade to Premium ($29.99/mo) for AI recommendations'
      }
    };

    return messages[feature]?.[currentTier] || 'Upgrade to unlock this feature';
  };

  const value = {
    subscription,
    loading,
    usage,
    tier: subscription?.tier || SUBSCRIPTION_TIERS.FREE,
    isActive: subscription?.status === 'active',
    isFree: subscription?.tier === SUBSCRIPTION_TIERS.FREE,
    isStarter: subscription?.tier === SUBSCRIPTION_TIERS.STARTER,
    isFamily: subscription?.tier === SUBSCRIPTION_TIERS.FAMILY,
    isPremium: subscription?.tier === SUBSCRIPTION_TIERS.PREMIUM,
    limits: getLimits(),
    canAddChild,
    canScheduleActivity,
    canSearchProviders,
    hasFeature,
    updateSubscriptionTier,
    incrementUsage,
    decrementUsage,
    getUpgradeMessage
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}