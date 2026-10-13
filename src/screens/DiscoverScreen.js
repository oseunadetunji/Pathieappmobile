import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { activityDatabase } from '../data/activityDatabase';
import { showAlert } from '../utils/crossAlert';
import HeaderBack from '../components/HeaderBack';

export default function DiscoverScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All', icon: "\uD83C\uDF1F", color: '#9333EA' },
    { id: 'stem', name: 'STEM', icon: "\uD83D\uDD2C", color: '#3B82F6' },
    { id: 'arts', name: 'Arts', icon: "\uD83C\uDFA8", color: '#EC4899' },
    { id: 'music', name: 'Music', icon: "\uD83C\uDFB5", color: '#8B5CF6' },
    { id: 'sports', name: 'Sports', icon: "\u26BD", color: '#10B981' },
    { id: 'business', name: 'Business', icon: "\uD83D\uDCBC", color: '#F59E0B' },
  ];

  const allGoals = {
    all: [
      { name: 'Become a Doctor', key: 'medical', icon: "\u2695\uFE0F", category: 'stem' },
      { name: 'Become an Engineer', key: 'engineering', icon: "\u2699\uFE0F", category: 'stem' },
      { name: 'Master Guitar', key: 'music', icon: "\uD83C\uDFB8", category: 'music' },
      { name: 'Master Piano', key: 'music', icon: "\uD83C\uDFB9", category: 'music' },
      { name: 'Become an Artist', key: 'visualArts', icon: "\uD83C\uDFA8", category: 'arts' },
      { name: 'Join Soccer Team', key: 'sports', icon: "\u26BD", category: 'sports' },
      { name: 'Learn to Code', key: 'programming', icon: "\uD83D\uDCBB", category: 'stem' },
      { name: 'Start a Business', key: 'business', icon: "\uD83D\uDCBC", category: 'business' },
    ],
    stem: [
      { name: 'Become a Doctor', key: 'medical', icon: "\u2695\uFE0F" },
      { name: 'Become an Engineer', key: 'engineering', icon: "\u2699\uFE0F" },
      { name: 'Learn to Code', key: 'programming', icon: "\uD83D\uDCBB" },
      { name: 'Be a Scientist', key: 'environmental', icon: "\uD83D\uDD2C" },
      { name: 'Study Marine Biology', key: 'environmental', icon: "\uD83D\uDC0B" },
    ],
    arts: [
      { name: 'Become an Artist', key: 'visualArts', icon: "\uD83C\uDFA8" },
      { name: 'Be an Actor', key: 'performingArts', icon: "\uD83C\uDFAD" },
      { name: 'Professional Dancer', key: 'performingArts', icon: "\uD83D\uDC83" },
      { name: 'Fashion Designer', key: 'visualArts', icon: "\uD83D\uDC57" },
    ],
    music: [
      { name: 'Master Guitar', key: 'music', icon: "\uD83C\uDFB8" },
      { name: 'Master Piano', key: 'music', icon: "\uD83C\uDFB9" },
      { name: 'Become a Singer', key: 'music', icon: "\uD83C\uDFA4" },
      { name: 'Music Producer', key: 'music', icon: "\uD83C\uDFA7" },
    ],
    sports: [
      { name: 'Join Soccer Team', key: 'sports', icon: "\u26BD" },
      { name: 'Professional Basketball Player', key: 'sports', icon: "\uD83C\uDFC0" },
      { name: 'Olympic Swimmer', key: 'sports', icon: "\uD83C\uDFCA" },
      { name: 'Martial Arts Master', key: 'sports', icon: "\uD83E\uDD4B" },
    ],
    business: [
      { name: 'Start a Business', key: 'business', icon: "\uD83D\uDCBC" },
      { name: 'Save Money', key: 'business', icon: "\uD83D\uDCB0" },
      { name: 'Become an Entrepreneur', key: 'business', icon: "\uD83D\uDE80" },
      { name: 'Learn About Investing', key: 'business', icon: "\uD83D\uDCC8" },
    ],
  };

  const activityTypes = [
    { name: 'Science', icon: "\uD83D\uDD2C", color: '#EEF2FF', searchTerm: 'science classes' },
    { name: 'Arts & Crafts', icon: "\uD83C\uDFA8", color: '#FEF3C7', searchTerm: 'art classes' },
    { name: 'Music', icon: "\uD83C\uDFB5", color: '#DBEAFE', searchTerm: 'music lessons' },
    { name: 'Sports', icon: "\u26BD", color: '#D1FAE5', searchTerm: 'sports training' },
    { name: 'Coding', icon: "\uD83D\uDCBB", color: '#FCE7F3', searchTerm: 'coding classes' },
    { name: 'Dance', icon: "\uD83D\uDC83", color: '#F3E8FF', searchTerm: 'dance classes' },
  ];

  const displayedGoals = selectedCategory === 'all' 
    ? allGoals.all 
    : allGoals[selectedCategory] || allGoals.all;

  const handleGoalSelect = (goal) => {
    // Get activities for this goal from the activity database
    const goalActivities = activityDatabase[goal.key] || [];
    const allActivitiesForGoal = goalActivities.flatMap(category => 
      category.activities.map(activity => ({
        ...activity,
        category: category.category
      }))
    );

    if (allActivitiesForGoal.length === 0) {
      showAlert(
        goal.name,
        'No activities found for this goal yet. Check back soon!',
        [{ text: 'OK' }]
      );
      return;
    }

    // Navigate to Kids screen to select a child first, then they can add activities
    showAlert(
      goal.name,
      `Found ${allActivitiesForGoal.length} activities! Please select a child from the Kids tab to add activities for this goal.`,
      [
        { text: 'Go to Kids', onPress: () => navigation.navigate('Kids') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleActivityTypeSelect = (activityType) => {
    navigation.navigate('FindProviders', {
      child: { name: 'Your Child', id: 'temp' },
      goal: activityType.name,
      activity: activityType.searchTerm
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <HeaderBack />
        <Text style={styles.title}>Discover</Text>
        <Text style={styles.subtitle}>Find activities for your child's goals</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>{"\uD83D\uDD0D"}</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search activities, goals..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Category Filter */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                selectedCategory === category.id && { backgroundColor: category.color }
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={[
                styles.categoryText,
                selectedCategory === category.id && styles.categoryTextActive
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Popular Goals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'all' ? 'Popular Goals' : `Popular ${categories.find(c => c.id === selectedCategory)?.name} Goals`}
          </Text>
          
          <View style={styles.goalsGrid}>
            {displayedGoals.map((goal, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.goalCard}
                onPress={() => handleGoalSelect(goal)}
              >
                <View style={styles.goalIcon}>
                  <Text style={styles.goalIconText}>{goal.icon}</Text>
                </View>
                <Text style={styles.goalName}>{goal.name}</Text>
                <Text style={styles.goalActivities}>
                  {activityDatabase[goal.key]?.reduce((sum, cat) => sum + cat.activities.length, 0) || 0} activities
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Browse by Activity Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse by Activity Type</Text>
          
          <View style={styles.activityGrid}>
            {activityTypes.map((activity, idx) => (
              <TouchableOpacity 
                key={idx}
                style={[styles.activityCard, { backgroundColor: activity.color }]}
                onPress={() => handleActivityTypeSelect(activity)}
              >
                <Text style={styles.activityCardIcon}>{activity.icon}</Text>
                <Text style={styles.activityCardTitle}>{activity.name}</Text>
                <Text style={styles.activityCardAction}>Find nearby {"\u203A"}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>{"\uD83D\uDCA1"} Pro Tips</Text>
          <Text style={styles.tipsText}>
            {"\u2022"} Start with 2-3 activities per week{'\n'}
            {"\u2022"} Mix different types of activities{'\n'}
            {"\u2022"} Let your child explore their interests{'\n'}
            {"\u2022"} Track progress to see what they enjoy most
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
  header: {
    backgroundColor: '#9333EA',
    padding: 24,
    paddingTop: 70,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 16,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  categoriesContainer: {
    marginBottom: 8,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  categoryTextActive: {
    color: 'white',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  goalCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  goalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalIconText: {
    fontSize: 24,
  },
  goalName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  goalActivities: {
    fontSize: 12,
    color: '#6B7280',
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  activityCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  activityCardIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  activityCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  activityCardAction: {
    fontSize: 12,
    color: '#9333EA',
    fontWeight: '600',
  },
  tipsSection: {
    backgroundColor: '#FEF3C7',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 100,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#78350F',
    lineHeight: 22,
  },
});