import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';

export default function PrivacyScreen({ navigation }) {
  const openPrivacyPolicy = () => {
    Linking.openURL('https://pathieapp.com/privacy.html');
  };

  const openTermsOfUse = () => {
    Linking.openURL('https://pathieapp.com/terms.html');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerIcon}>🔒</Text>
          <Text style={styles.headerTitle}>Privacy & Security</Text>
          <Text style={styles.headerSubtitle}>
            Your privacy matters to us. Learn how we protect your data.
          </Text>
        </View>

        {/* Privacy Policy */}
        <TouchableOpacity style={styles.card} onPress={openPrivacyPolicy}>
          <View style={styles.cardIcon}>
            <Text style={styles.cardIconText}>📄</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Privacy Policy</Text>
            <Text style={styles.cardDescription}>
              Learn how we collect, use, and protect your personal information
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        {/* Terms of Use */}
        <TouchableOpacity style={styles.card} onPress={openTermsOfUse}>
          <View style={styles.cardIcon}>
            <Text style={styles.cardIconText}>📋</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Terms of Use</Text>
            <Text style={styles.cardDescription}>
              Read the terms and conditions for using Pathie
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        {/* Data Protection Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How We Protect Your Data</Text>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>🔐</Text>
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Secure Storage</Text>
              <Text style={styles.infoDescription}>
                All data is encrypted and stored securely using Firebase
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>🚫</Text>
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>No Selling</Text>
              <Text style={styles.infoDescription}>
                We never sell your personal information to third parties
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>👤</Text>
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Your Control</Text>
              <Text style={styles.infoDescription}>
                You can delete your account and data at any time
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>🔒</Text>
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Minimal Data</Text>
              <Text style={styles.infoDescription}>
                We only collect what's necessary for the app to function
              </Text>
            </View>
          </View>
        </View>

        {/* Contact */}
        <View style={styles.contactBox}>
          <Text style={styles.contactTitle}>Questions about privacy?</Text>
          <Text style={styles.contactText}>
            Contact us at privacy@pathieapp.com
          </Text>
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
  card: {
    backgroundColor: 'white',
    margin: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardIconText: {
    fontSize: 24,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  chevron: {
    fontSize: 24,
    color: '#D1D5DB',
    marginLeft: 8,
  },
  infoSection: {
    margin: 16,
    marginTop: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  infoIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  contactBox: {
    backgroundColor: '#DBEAFE',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#1E40AF',
  },
});