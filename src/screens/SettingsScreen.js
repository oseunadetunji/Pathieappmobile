import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { auth } from '../../firebase';
import { useSubscription } from '../context/SubscriptionContext';
import { showAlert } from '../utils/crossAlert';
import HeaderBack from '../components/HeaderBack';

export default function SettingsScreen({ navigation }) {
  const { tier, subscription } = useSubscription();

  const handleSignOut = async () => {
    showAlert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await auth.signOut();
            } catch (error) {
              showAlert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  // Get tier display name
  const getTierName = () => {
    const tierNames = {
      free: 'Free',
      starter: 'Starter',
      family: 'Family',
      premium: 'Premium'
    };
    return tierNames[tier] || 'Free';
  };

  const settingsSections = [
    {
      title: 'Account',
      items: [
        { 
          icon: '👤', 
          label: 'Profile', 
          subtitle: auth.currentUser?.email, 
          action: () => navigation.navigate('ProfileSettings') 
        },
        { 
          icon: '💳', 
          label: 'Subscription', 
          subtitle: `${getTierName()} Plan`, 
          action: () => navigation.navigate('Pricing'),
          highlight: tier === 'free'
        },
        { 
          icon: '⚙️', 
          label: 'Manage Account', 
          subtitle: 'Pause or delete account', 
          action: () => navigation.navigate('ManageAccount') 
        },
        { 
          icon: '🔔', 
          label: 'Notifications', 
          subtitle: 'Manage reminders', 
          action: () => navigation.navigate('NotificationSettings') 
        },
        { 
          icon: '📍', 
          label: 'Location', 
          subtitle: 'Update your location', 
          action: () => navigation.navigate('LocationSettings') 
        },
      ]
    },
    {
      title: 'Support',
      items: [
        { 
          icon: '🔒', 
          label: 'Privacy', 
          subtitle: 'Data & security', 
          action: () => navigation.navigate('Privacy') 
        },
        { 
          icon: '❓', 
          label: 'Help Center', 
          subtitle: 'Get support', 
          action: () => navigation.navigate('HelpCenter') 
        },
        { 
          icon: '💬', 
          label: 'Feedback', 
          subtitle: 'Share your thoughts', 
          action: () => navigation.navigate('Feedback') 
        },
        { 
          icon: 'ℹ️', 
          label: 'About', 
          subtitle: 'Version 1.0.0', 
          action: () => navigation.navigate('About') 
        },
      ]
    }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <HeaderBack />
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage your account and preferences</Text>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {auth.currentUser?.email?.charAt(0).toUpperCase() || '👤'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {auth.currentUser?.email?.split('@')[0] || 'User'}
            </Text>
            <Text style={styles.userEmail}>{auth.currentUser?.email}</Text>
            <View style={styles.tierBadge}>
              <Text style={styles.tierBadgeText}>{getTierName()} Plan</Text>
            </View>
          </View>
        </View>

        {/* Settings Sections */}
        {settingsSections.map((section, idx) => (
          <View key={idx} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, itemIdx) => (
              <TouchableOpacity
                key={itemIdx}
                style={[
                  styles.settingItem,
                  item.highlight && styles.settingItemHighlight
                ]}
                onPress={item.action}
              >
                <View style={styles.settingIcon}>
                  <Text style={styles.settingIconText}>{item.icon}</Text>
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>{item.label}</Text>
                  <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Sign Out Button */}
        <TouchableOpacity 
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutText}>🚪 Sign Out</Text>
        </TouchableOpacity>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>Pathie</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appTagline}>Fun activities for every dream! 🌟</Text>
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
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: '#E9D5FF',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  userCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#9333EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userAvatarText: {
    fontSize: 28,
    color: 'white',
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textTransform: 'capitalize',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  tierBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  tierBadgeText: {
    color: '#9333EA',
    fontSize: 12,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingItemHighlight: {
    borderWidth: 2,
    borderColor: '#9333EA',
    backgroundColor: '#FDF4FF',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingIconText: {
    fontSize: 20,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  chevron: {
    fontSize: 20,
    color: '#D1D5DB',
  },
  signOutButton: {
    backgroundColor: '#FEE2E2',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingBottom: 48,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#9333EA',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  appTagline: {
    fontSize: 14,
    color: '#6B7280',
  },
});