import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { auth, db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { showAlert } from '../utils/crossAlert';

export default function FeedbackScreen({ navigation }) {
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState('general');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    { value: 'general', label: 'General Feedback', icon: '💬' },
    { value: 'bug', label: 'Bug Report', icon: '🐛' },
    { value: 'feature', label: 'Feature Request', icon: '✨' },
    { value: 'improvement', label: 'Improvement Idea', icon: '💡' },
  ];

  const handleSubmit = async () => {
    if (rating === 0) {
      showAlert('Rating Required', 'Please select a rating before submitting');
      return;
    }

    if (!feedback.trim()) {
      showAlert('Feedback Required', 'Please enter your feedback');
      return;
    }

    setSubmitting(true);

    try {
      const userId = auth.currentUser?.uid;
      const userEmail = auth.currentUser?.email;

      await addDoc(collection(db, 'feedback'), {
        userId,
        userEmail,
        rating,
        category,
        feedback: feedback.trim(),
        createdAt: new Date()
      });

      showAlert(
        'Thank You! 🎉',
        'Your feedback has been submitted. We appreciate you helping us improve Pathie!',
        [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]
      );

      // Reset form
      setRating(0);
      setCategory('general');
      setFeedback('');
    } catch (error) {
      showAlert('Error', 'Failed to submit feedback: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={100}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerIcon}>💭</Text>
          <Text style={styles.headerTitle}>Share Your Feedback</Text>
          <Text style={styles.headerSubtitle}>
            Help us make Pathie better for everyone
          </Text>
        </View>

        {/* Rating */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How would you rate Pathie?</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starButton}
              >
                <Text style={styles.star}>
                  {star <= rating ? '⭐' : '☆'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingLabel}>
            {rating === 0 && 'Tap to rate'}
            {rating === 1 && 'Poor'}
            {rating === 2 && 'Fair'}
            {rating === 3 && 'Good'}
            {rating === 4 && 'Great'}
            {rating === 5 && 'Excellent!'}
          </Text>
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What type of feedback?</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.categoryChip,
                  category === cat.value && styles.categoryChipActive
                ]}
                onPress={() => setCategory(cat.value)}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text style={[
                  styles.categoryLabel,
                  category === cat.value && styles.categoryLabelActive
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Feedback Text */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tell us more</Text>
          <TextInput
            style={styles.textArea}
            value={feedback}
            onChangeText={setFeedback}
            placeholder="Share your thoughts, suggestions, or report issues..."
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        {/* Submit Button - INSIDE ScrollView */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </Text>
        </TouchableOpacity>

        {/* Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Your feedback helps us prioritize improvements and fix bugs. Thank you for making Pathie better! 💜
          </Text>
        </View>

        {/* Extra padding at bottom to ensure button is above keyboard */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  starButton: {
    padding: 4,
  },
  star: {
    fontSize: 40,
  },
  ratingLabel: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#9333EA',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    minWidth: '48%',
  },
  categoryChipActive: {
    borderColor: '#9333EA',
    backgroundColor: '#F3E8FF',
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryLabelActive: {
    color: '#9333EA',
  },
  textArea: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    minHeight: 150,
  },
  submitButton: {
    backgroundColor: '#9333EA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 100,
  },
});