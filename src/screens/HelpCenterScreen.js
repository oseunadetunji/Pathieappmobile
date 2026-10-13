import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { showAlert } from '../utils/crossAlert';

export default function HelpCenterScreen({ navigation }) {
  const [expandedFaq, setExpandedFaq] = useState(null);

  const faqs = [
    {
      question: 'How do I add a new child?',
      answer: 'Go to the Kids tab and tap the "+ Add Child" button. Enter your child\'s name, age, and select an avatar. Then add their first goal to get started!'
    },
    {
      question: 'How do I schedule activities?',
      answer: 'Navigate to a goal, add activities to your plan, then tap "Find Providers". Choose a provider and tap "Add to Calendar" to schedule with recurring options.'
    },
    {
      question: 'Can I delete a goal?',
      answer: 'Yes! Go to your child\'s profile, long-press on the goal you want to remove, and confirm the deletion.'
    },
    {
      question: 'How do I change notification settings?',
      answer: 'Go to Settings > Notifications to toggle reminders on/off and choose when you want to be notified (1 day, 1 hour, or 30 minutes before activities).'
    },
    {
      question: 'What if I can\'t find providers near me?',
      answer: 'Make sure location permissions are enabled in Settings > Location. You can also enter a custom location manually if GPS isn\'t working.'
    },
    {
      question: 'How do I track completed activities?',
      answer: 'Go to the Calendar tab and tap the checkmark on any activity to mark it complete. You can also add notes about how it went.'
    },
    {
      question: 'Can I share my account with my partner?',
      answer: 'Currently, each parent needs their own account. Family sharing is coming in a future update!'
    },
    {
      question: 'How do I delete my account?',
      answer: 'Contact us at support@pathieapp.com to request account deletion. All your data will be permanently removed.'
    },
  ];

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const contactSupport = () => {
    showAlert(
      'Contact Support',
      'Choose how you\'d like to reach us:',
      [
        {
          text: 'Email',
          onPress: () => Linking.openURL('mailto:support@pathieapp.com?subject=Pathie%20Support%20Request')
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerIcon}>❓</Text>
          <Text style={styles.headerTitle}>Help Center</Text>
          <Text style={styles.headerSubtitle}>
            Find answers to common questions
          </Text>
        </View>

        {/* Contact Support Button */}
        <TouchableOpacity style={styles.contactButton} onPress={contactSupport}>
          <Text style={styles.contactButtonIcon}>💬</Text>
          <View style={styles.contactButtonContent}>
            <Text style={styles.contactButtonTitle}>Contact Support</Text>
            <Text style={styles.contactButtonSubtitle}>Get help from our team</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        {/* FAQs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          
          {faqs.map((faq, index) => (
            <TouchableOpacity
              key={index}
              style={styles.faqCard}
              onPress={() => toggleFaq(index)}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <Text style={styles.faqIcon}>
                  {expandedFaq === index ? '−' : '+'}
                </Text>
              </View>
              {expandedFaq === index && (
                <Text style={styles.faqAnswer}>{faq.answer}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Still Need Help */}
        <View style={styles.helpBox}>
          <Text style={styles.helpTitle}>Still need help?</Text>
          <Text style={styles.helpText}>
            Our support team is here to help you. We typically respond within 24 hours.
          </Text>
          <TouchableOpacity style={styles.helpButton} onPress={contactSupport}>
            <Text style={styles.helpButtonText}>Contact Support</Text>
          </TouchableOpacity>
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
  contactButton: {
    backgroundColor: 'white',
    margin: 16,
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
  contactButtonIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  contactButtonContent: {
    flex: 1,
  },
  contactButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  contactButtonSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  chevron: {
    fontSize: 24,
    color: '#D1D5DB',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  faqCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 12,
  },
  faqIcon: {
    fontSize: 24,
    fontWeight: '300',
    color: '#9333EA',
  },
  faqAnswer: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
    lineHeight: 20,
  },
  helpBox: {
    backgroundColor: '#DBEAFE',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#1E40AF',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  helpButton: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  helpButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
});