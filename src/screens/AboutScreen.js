import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import HeaderBack from '../components/HeaderBack';

export default function AboutScreen({ navigation }) {
  const appVersion = '1.0.0';
  const buildNumber = 'Beta';

  const openWebsite = () => {
    Linking.openURL('https://www.pathieapp.com');
  };

  const openPrivacy = () => {
    navigation.navigate('Privacy');
  };

  const openTerms = () => {
    Linking.openURL('https://pathieapp.com/terms.html');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* App Logo/Icon */}
        <View style={styles.header}>
        <HeaderBack />
          <View style={styles.appIcon}>
            <Text style={styles.appIconText}>🎯</Text>
          </View>
          <Text style={styles.appName}>Pathie</Text>
          <Text style={styles.tagline}>Fun activities for every dream!</Text>
        </View>

        {/* Version Info */}
        <View style={styles.versionCard}>
          <View style={styles.versionRow}>
            <Text style={styles.versionLabel}>Version</Text>
            <Text style={styles.versionValue}>{appVersion}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.versionRow}>
            <Text style={styles.versionLabel}>Build</Text>
            <Text style={styles.versionValue}>{buildNumber}</Text>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Pathie</Text>
          <Text style={styles.description}>
            Pathie helps parents discover and schedule activities aligned with their children's goals and dreams. 
            From STEM to sports, arts to music, we make it easy to find the perfect activities to support your child's journey.
          </Text>
        </View>

        {/* Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>More Information</Text>
          
          <TouchableOpacity style={styles.linkCard} onPress={openWebsite}>
            <Text style={styles.linkIcon}>🌐</Text>
            <Text style={styles.linkText}>Visit Our Website</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkCard} onPress={openPrivacy}>
            <Text style={styles.linkIcon}>🔒</Text>
            <Text style={styles.linkText}>Privacy Policy</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkCard} onPress={openTerms}>
            <Text style={styles.linkIcon}>📋</Text>
            <Text style={styles.linkText}>Terms of Use</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Credits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Made With</Text>
          <View style={styles.creditsBox}>
            <Text style={styles.creditsText}>
              Built with React Native & Expo
              {'\n'}
              Powered by Firebase
              {'\n'}
              Designed with ❤️ for parents and kids
            </Text>
          </View>
        </View>

        {/* Copyright */}
        <View style={styles.footer}>
          <Text style={styles.copyright}>
            © 2026 Pathie. All rights reserved.
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
    padding: 40,
    paddingTop: 60,
    alignItems: 'center',
  },
  appIcon: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appIconText: {
    fontSize: 56,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#E9D5FF',
  },
  versionCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  versionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  versionLabel: {
    fontSize: 15,
    color: '#6B7280',
  },
  versionValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
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
  description: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
  },
  linkCard: {
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
  linkIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  linkText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  chevron: {
    fontSize: 20,
    color: '#D1D5DB',
  },
  creditsBox: {
    backgroundColor: '#FDF4FF',
    borderWidth: 2,
    borderColor: '#E9D5FF',
    borderRadius: 12,
    padding: 16,
  },
  creditsText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
    textAlign: 'center',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  copyright: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});