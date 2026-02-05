import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { auth, db } from '../../firebase';

export default function ManageAccountScreen({ navigation }) {
  const handlePauseAccount = () => {
    Alert.alert(
      'Pause Account',
      'This will temporarily deactivate your account. Your data will be saved and you can reactivate anytime by signing back in.\n\nAre you sure you want to pause your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pause Account',
          style: 'destructive',
          onPress: async () => {
            try {
              const user = auth.currentUser;
              
              await db.collection('users').doc(user.uid).update({
                accountStatus: 'paused',
                pausedAt: new Date()
              });

              Alert.alert(
                'Account Paused',
                'Your account has been paused. Sign in again anytime to reactivate.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      auth.signOut();
                      navigation.navigate('Auth');
                    }
                  }
                ]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to pause account. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '⚠️ Delete Account',
      'This action is permanent and cannot be undone.\n\nAll your data will be deleted including:\n• Children profiles\n• Goals and activities\n• Scheduled events\n• Usage data\n\nConsider pausing your account instead if you might return later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pause Instead',
          onPress: handlePauseAccount
        },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: confirmDeleteAccount
        }
      ]
    );
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Final Confirmation',
      'Type DELETE to confirm account deletion',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: () => {
            Alert.prompt(
              'Type DELETE',
              'Enter DELETE to confirm',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async (text) => {
                    if (text === 'DELETE') {
                      await deleteAccountData();
                    } else {
                      Alert.alert('Cancelled', 'Text did not match. Account deletion cancelled.');
                    }
                  }
                }
              ],
              'plain-text'
            );
          }
        }
      ]
    );
  };

  const deleteAccountData = async () => {
    try {
      const user = auth.currentUser;
      const userId = user.uid;

      // Delete all user data from Firestore
      const collections = ['children', 'customActivities', 'activities', 'feedback'];
      
      for (const collectionName of collections) {
        const snapshot = await db.collection(collectionName)
          .where('userId', '==', userId)
          .get();
        
        for (const document of snapshot.docs) {
          await db.collection(collectionName).doc(document.id).delete();
        }
      }

      // Delete user document
      await db.collection('users').doc(userId).delete();

      // Delete authentication account
      await user.delete();

      Alert.alert(
        'Account Deleted',
        'Your account and all data have been permanently deleted.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Auth')
          }
        ]
      );
    } catch (error) {
      if (error.code === 'auth/requires-recent-login') {
        Alert.alert(
          'Re-authentication Required',
          'For security, please sign out and sign back in, then try deleting your account again.'
        );
      } else {
        Alert.alert('Error', 'Failed to delete account. Please contact support.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerIcon}>⚙️</Text>
          <Text style={styles.headerTitle}>Manage Account</Text>
          <Text style={styles.headerSubtitle}>
            Pause or permanently delete your account
          </Text>
        </View>

        {/* Account Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Current Account</Text>
          <Text style={styles.infoValue}>{auth.currentUser?.email}</Text>
          <Text style={styles.infoStatus}>✓ Active</Text>
        </View>

        {/* Pause Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pause Account</Text>
          <View style={styles.optionCard}>
            <View style={styles.optionHeader}>
              <Text style={styles.optionIcon}>⏸️</Text>
              <Text style={styles.optionTitle}>Temporary Deactivation</Text>
            </View>
            <Text style={styles.optionDescription}>
              Taking a break? Pause your account to temporarily deactivate it. All your data will be saved and you can reactivate anytime by signing back in.
            </Text>
            <View style={styles.optionFeatures}>
              <Text style={styles.featureItem}>✓ Data preserved</Text>
              <Text style={styles.featureItem}>✓ Reactivate anytime</Text>
              <Text style={styles.featureItem}>✓ No data loss</Text>
            </View>
            <TouchableOpacity style={styles.pauseButton} onPress={handlePauseAccount}>
              <Text style={styles.pauseButtonText}>Pause Account</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Delete Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delete Account</Text>
          <View style={[styles.optionCard, styles.dangerCard]}>
            <View style={styles.optionHeader}>
              <Text style={styles.optionIcon}>🗑️</Text>
              <Text style={[styles.optionTitle, styles.dangerTitle]}>Permanent Deletion</Text>
            </View>
            <Text style={styles.optionDescription}>
              This action is permanent and cannot be undone. All your data will be permanently deleted including children profiles, goals, activities, and usage data.
            </Text>
            <View style={styles.warningBox}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.warningText}>
                Consider pausing instead if you might return later
              </Text>
            </View>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
              <Text style={styles.deleteButtonText}>Delete Account Permanently</Text>
            </TouchableOpacity>
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
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    backgroundColor: '#9333EA',
    padding: 24,
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E9D5FF',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E9D5FF',
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  infoStatus: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  optionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  dangerCard: {
    borderColor: '#FCA5A5',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  dangerTitle: {
    color: '#DC2626',
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  optionFeatures: {
    marginBottom: 16,
  },
  featureItem: {
    fontSize: 14,
    color: '#10B981',
    marginBottom: 6,
  },
  warningBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    fontWeight: '500',
  },
  pauseButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  pauseButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
});