import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { activityDatabase } from '../data/activityDatabase';

export default function DiscoverScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All', icon: '🌟', color: '#9333EA' },
    { id: 'stem', name: 'STEM', icon: '🔬', color: '#3B82F6' },
    { id: 'arts', name: 'Arts', icon: '🎨', color: '#EC4899' },
    { id: 'music', name: 'Music', icon: '🎵', color: '#8B5CF6' },
    { id: 'sports', name: 'Sports', icon: '⚽', color: '#10B981' },
    { id: 'business', name: 'Business', icon: '💼', color: '#F59E0B' },
    { id: 'languages', name: 'Languages', icon: '🌍', color: '#06B6D4' },
    { id: 'life', name: 'Life Skills', icon: '🛠️', color: '#84CC16' },
  ];

  const allGoals = {
    all: [
      // STEM (15 goals)
      { name: 'Become a Doctor', key: 'medical', icon: '⚕️', category: 'stem' },
      { name: 'Become an Engineer', key: 'engineering', icon: '⚙️', category: 'stem' },
      { name: 'Learn to Code', key: 'programming', icon: '💻', category: 'stem' },
      { name: 'Be a Scientist', key: 'environmental', icon: '🔬', category: 'stem' },
      { name: 'Study Marine Biology', key: 'environmental', icon: '🐋', category: 'stem' },
      { name: 'Become a Veterinarian', key: 'medical', icon: '🐾', category: 'stem' },
      { name: 'Study Astronomy', key: 'environmental', icon: '🔭', category: 'stem' },
      { name: 'Become a Dentist', key: 'medical', icon: '🦷', category: 'stem' },
      { name: 'Game Developer', key: 'programming', icon: '🎮', category: 'stem' },
      { name: 'Web Developer', key: 'programming', icon: '🌐', category: 'stem' },
      { name: 'Robotics Engineer', key: 'engineering', icon: '🤖', category: 'stem' },
      { name: 'Environmental Scientist', key: 'environmental', icon: '🌱', category: 'stem' },
      { name: 'Architect', key: 'engineering', icon: '🏛️', category: 'stem' },
      { name: 'Data Scientist', key: 'programming', icon: '📊', category: 'stem' },
      { name: 'Nurse', key: 'medical', icon: '👩‍⚕️', category: 'stem' },
      
      // Arts (12 goals)
      { name: 'Become an Artist', key: 'visualArts', icon: '🎨', category: 'arts' },
      { name: 'Be an Actor', key: 'performingArts', icon: '🎭', category: 'arts' },
      { name: 'Professional Dancer', key: 'performingArts', icon: '💃', category: 'arts' },
      { name: 'Fashion Designer', key: 'visualArts', icon: '👗', category: 'arts' },
      { name: 'Photographer', key: 'visualArts', icon: '📸', category: 'arts' },
      { name: 'Animator', key: 'visualArts', icon: '🎬', category: 'arts' },
      { name: 'Graphic Designer', key: 'visualArts', icon: '🖌️', category: 'arts' },
      { name: 'Filmmaker', key: 'performingArts', icon: '🎥', category: 'arts' },
      { name: 'Voice Actor', key: 'performingArts', icon: '🎙️', category: 'arts' },
      { name: 'Illustrator', key: 'visualArts', icon: '✏️', category: 'arts' },
      { name: 'Stage Director', key: 'performingArts', icon: '🎪', category: 'arts' },
      { name: 'Sculptor', key: 'visualArts', icon: '🗿', category: 'arts' },
      
      // Music (10 goals)
      { name: 'Master Guitar', key: 'music', icon: '🎸', category: 'music' },
      { name: 'Master Piano', key: 'music', icon: '🎹', category: 'music' },
      { name: 'Become a Singer', key: 'music', icon: '🎤', category: 'music' },
      { name: 'Music Producer', key: 'music', icon: '🎧', category: 'music' },
      { name: 'Learn Violin', key: 'music', icon: '🎻', category: 'music' },
      { name: 'Learn Drums', key: 'music', icon: '🥁', category: 'music' },
      { name: 'Join Orchestra', key: 'music', icon: '🎺', category: 'music' },
      { name: 'DJ/Electronic Music', key: 'music', icon: '🎛️', category: 'music' },
      { name: 'Songwriter', key: 'music', icon: '✍️🎵', category: 'music' },
      { name: 'Music Teacher', key: 'music', icon: '👨‍🏫🎵', category: 'music' },
      
      // Sports (15 goals)
      { name: 'Join Soccer Team', key: 'sports', icon: '⚽', category: 'sports' },
      { name: 'Professional Basketball', key: 'sports', icon: '🏀', category: 'sports' },
      { name: 'Olympic Swimmer', key: 'sports', icon: '🏊', category: 'sports' },
      { name: 'Martial Arts Master', key: 'martialArts', icon: '🥋', category: 'sports' },
      { name: 'Tennis Player', key: 'sports', icon: '🎾', category: 'sports' },
      { name: 'Baseball Player', key: 'sports', icon: '⚾', category: 'sports' },
      { name: 'Gymnast', key: 'sports', icon: '🤸', category: 'sports' },
      { name: 'Track & Field Athlete', key: 'sports', icon: '🏃', category: 'sports' },
      { name: 'Figure Skater', key: 'sports', icon: '⛸️', category: 'sports' },
      { name: 'Volleyball Player', key: 'sports', icon: '🏐', category: 'sports' },
      { name: 'Hockey Player', key: 'sports', icon: '🏒', category: 'sports' },
      { name: 'Golf Player', key: 'sports', icon: '⛳', category: 'sports' },
      { name: 'Rock Climber', key: 'sports', icon: '🧗', category: 'sports' },
      { name: 'Yoga Instructor', key: 'sports', icon: '🧘', category: 'sports' },
      { name: 'Personal Trainer', key: 'sports', icon: '💪', category: 'sports' },
      
      // Business (10 goals)
      { name: 'Start a Business', key: 'business', icon: '💼', category: 'business' },
      { name: 'Save Money', key: 'business', icon: '💰', category: 'business' },
      { name: 'Become an Entrepreneur', key: 'business', icon: '🚀', category: 'business' },
      { name: 'Learn About Investing', key: 'business', icon: '📈', category: 'business' },
      { name: 'Marketing Expert', key: 'business', icon: '📢', category: 'business' },
      { name: 'CEO/Executive', key: 'business', icon: '👔', category: 'business' },
      { name: 'Financial Advisor', key: 'business', icon: '💳', category: 'business' },
      { name: 'Real Estate Agent', key: 'business', icon: '🏘️', category: 'business' },
      { name: 'Accountant', key: 'business', icon: '🧮', category: 'business' },
      { name: 'Sales Professional', key: 'business', icon: '🤝', category: 'business' },
      
      // Languages (8 goals)
      { name: 'Learn Spanish', key: 'languages', icon: '🇪🇸', category: 'languages' },
      { name: 'Learn French', key: 'languages', icon: '🇫🇷', category: 'languages' },
      { name: 'Learn Mandarin', key: 'languages', icon: '🇨🇳', category: 'languages' },
      { name: 'Learn Japanese', key: 'languages', icon: '🇯🇵', category: 'languages' },
      { name: 'Learn German', key: 'languages', icon: '🇩🇪', category: 'languages' },
      { name: 'Learn Arabic', key: 'languages', icon: '🇸🇦', category: 'languages' },
      { name: 'Become Bilingual', key: 'languages', icon: '🌐', category: 'languages' },
      { name: 'Translator/Interpreter', key: 'languages', icon: '🗣️', category: 'languages' },
      
      // Life Skills (10 goals)
      { name: 'Learn to Cook', key: 'culinary', icon: '👨‍🍳', category: 'life' },
      { name: 'Become a Chef', key: 'culinary', icon: '🍳', category: 'life' },
      { name: 'Learn to Write', key: 'writing', icon: '✍️', category: 'life' },
      { name: 'Become an Author', key: 'writing', icon: '📚', category: 'life' },
      { name: 'Public Speaking', key: 'business', icon: '🎤', category: 'life' },
      { name: 'Leadership Skills', key: 'business', icon: '👑', category: 'life' },
      { name: 'Time Management', key: 'enrichment', icon: '⏰', category: 'life' },
      { name: 'Critical Thinking', key: 'enrichment', icon: '🧠', category: 'life' },
      { name: 'First Aid/Safety', key: 'medical', icon: '🚑', category: 'life' },
      { name: 'Gardening', key: 'environmental', icon: '🌻', category: 'life' },
    ],
    
    stem: [
      { name: 'Become a Doctor', key: 'medical', icon: '⚕️' },
      { name: 'Become an Engineer', key: 'engineering', icon: '⚙️' },
      { name: 'Learn to Code', key: 'programming', icon: '💻' },
      { name: 'Be a Scientist', key: 'environmental', icon: '🔬' },
      { name: 'Study Marine Biology', key: 'environmental', icon: '🐋' },
      { name: 'Become a Veterinarian', key: 'medical', icon: '🐾' },
      { name: 'Study Astronomy', key: 'environmental', icon: '🔭' },
      { name: 'Become a Dentist', key: 'medical', icon: '🦷' },
      { name: 'Game Developer', key: 'programming', icon: '🎮' },
      { name: 'Web Developer', key: 'programming', icon: '🌐' },
      { name: 'Robotics Engineer', key: 'engineering', icon: '🤖' },
      { name: 'Environmental Scientist', key: 'environmental', icon: '🌱' },
      { name: 'Architect', key: 'engineering', icon: '🏛️' },
      { name: 'Data Scientist', key: 'programming', icon: '📊' },
      { name: 'Nurse', key: 'medical', icon: '👩‍⚕️' },
      { name: 'Pharmacist', key: 'medical', icon: '💊' },
      { name: 'Physicist', key: 'environmental', icon: '⚛️' },
      { name: 'Chemist', key: 'environmental', icon: '⚗️' },
    ],
    
    arts: [
      { name: 'Become an Artist', key: 'visualArts', icon: '🎨' },
      { name: 'Be an Actor', key: 'performingArts', icon: '🎭' },
      { name: 'Professional Dancer', key: 'performingArts', icon: '💃' },
      { name: 'Fashion Designer', key: 'visualArts', icon: '👗' },
      { name: 'Photographer', key: 'visualArts', icon: '📸' },
      { name: 'Animator', key: 'visualArts', icon: '🎬' },
      { name: 'Graphic Designer', key: 'visualArts', icon: '🖌️' },
      { name: 'Filmmaker', key: 'performingArts', icon: '🎥' },
      { name: 'Voice Actor', key: 'performingArts', icon: '🎙️' },
      { name: 'Illustrator', key: 'visualArts', icon: '✏️' },
      { name: 'Stage Director', key: 'performingArts', icon: '🎪' },
      { name: 'Sculptor', key: 'visualArts', icon: '🗿' },
      { name: 'Interior Designer', key: 'visualArts', icon: '🛋️' },
      { name: 'Makeup Artist', key: 'visualArts', icon: '💄' },
    ],
    
    music: [
      { name: 'Master Guitar', key: 'music', icon: '🎸' },
      { name: 'Master Piano', key: 'music', icon: '🎹' },
      { name: 'Become a Singer', key: 'music', icon: '🎤' },
      { name: 'Music Producer', key: 'music', icon: '🎧' },
      { name: 'Learn Violin', key: 'music', icon: '🎻' },
      { name: 'Learn Drums', key: 'music', icon: '🥁' },
      { name: 'Join Orchestra', key: 'music', icon: '🎺' },
      { name: 'DJ/Electronic Music', key: 'music', icon: '🎛️' },
      { name: 'Songwriter', key: 'music', icon: '✍️🎵' },
      { name: 'Music Teacher', key: 'music', icon: '👨‍🏫🎵' },
      { name: 'Conductor', key: 'music', icon: '🎼' },
      { name: 'Sound Engineer', key: 'music', icon: '🔊' },
    ],
    
    sports: [
      { name: 'Join Soccer Team', key: 'sports', icon: '⚽' },
      { name: 'Professional Basketball', key: 'sports', icon: '🏀' },
      { name: 'Olympic Swimmer', key: 'sports', icon: '🏊' },
      { name: 'Martial Arts Master', key: 'martialArts', icon: '🥋' },
      { name: 'Tennis Player', key: 'sports', icon: '🎾' },
      { name: 'Baseball Player', key: 'sports', icon: '⚾' },
      { name: 'Gymnast', key: 'sports', icon: '🤸' },
      { name: 'Track & Field Athlete', key: 'sports', icon: '🏃' },
      { name: 'Figure Skater', key: 'sports', icon: '⛸️' },
      { name: 'Volleyball Player', key: 'sports', icon: '🏐' },
      { name: 'Hockey Player', key: 'sports', icon: '🏒' },
      { name: 'Golf Player', key: 'sports', icon: '⛳' },
      { name: 'Rock Climber', key: 'sports', icon: '🧗' },
      { name: 'Yoga Instructor', key: 'sports', icon: '🧘' },
      { name: 'Personal Trainer', key: 'sports', icon: '💪' },
      { name: 'Cyclist', key: 'sports', icon: '🚴' },
      { name: 'Equestrian', key: 'sports', icon: '🏇' },
    ],
    
    business: [
      { name: 'Start a Business', key: 'business', icon: '💼' },
      { name: 'Save Money', key: 'business', icon: '💰' },
      { name: 'Become an Entrepreneur', key: 'business', icon: '🚀' },
      { name: 'Learn About Investing', key: 'business', icon: '📈' },
      { name: 'Marketing Expert', key: 'business', icon: '📢' },
      { name: 'CEO/Executive', key: 'business', icon: '👔' },
      { name: 'Financial Advisor', key: 'business', icon: '💳' },
      { name: 'Real Estate Agent', key: 'business', icon: '🏘️' },
      { name: 'Accountant', key: 'business', icon: '🧮' },
      { name: 'Sales Professional', key: 'business', icon: '🤝' },
      { name: 'Consultant', key: 'business', icon: '💡' },
      { name: 'Project Manager', key: 'business', icon: '📋' },
    ],
    
    languages: [
      { name: 'Learn Spanish', key: 'languages', icon: '🇪🇸' },
      { name: 'Learn French', key: 'languages', icon: '🇫🇷' },
      { name: 'Learn Mandarin', key: 'languages', icon: '🇨🇳' },
      { name: 'Learn Japanese', key: 'languages', icon: '🇯🇵' },
      { name: 'Learn German', key: 'languages', icon: '🇩🇪' },
      { name: 'Learn Arabic', key: 'languages', icon: '🇸🇦' },
      { name: 'Learn Italian', key: 'languages', icon: '🇮🇹' },
      { name: 'Learn Korean', key: 'languages', icon: '🇰🇷' },
      { name: 'Learn Portuguese', key: 'languages', icon: '🇧🇷' },
      { name: 'Become Bilingual', key: 'languages', icon: '🌐' },
      { name: 'Translator/Interpreter', key: 'languages', icon: '🗣️' },
    ],
    
    life: [
      { name: 'Learn to Cook', key: 'culinary', icon: '👨‍🍳' },
      { name: 'Become a Chef', key: 'culinary', icon: '🍳' },
      { name: 'Learn to Write', key: 'writing', icon: '✍️' },
      { name: 'Become an Author', key: 'writing', icon: '📚' },
      { name: 'Public Speaking', key: 'business', icon: '🎤' },
      { name: 'Leadership Skills', key: 'business', icon: '👑' },
      { name: 'Time Management', key: 'enrichment', icon: '⏰' },
      { name: 'Critical Thinking', key: 'enrichment', icon: '🧠' },
      { name: 'First Aid/Safety', key: 'medical', icon: '🚑' },
      { name: 'Gardening', key: 'environmental', icon: '🌻' },
      { name: 'Sewing/Fashion', key: 'visualArts', icon: '🧵' },
      { name: 'Woodworking', key: 'enrichment', icon: '🪚' },
      { name: 'Photography', key: 'visualArts', icon: '📷' },
    ],
  };

  const activityTypes = [
    { name: 'Science', icon: '🔬', color: '#EEF2FF', searchTerm: 'science classes' },
    { name: 'Arts & Crafts', icon: '🎨', color: '#FEF3C7', searchTerm: 'art classes' },
    { name: 'Music', icon: '🎵', color: '#DBEAFE', searchTerm: 'music lessons' },
    { name: 'Sports', icon: '⚽', color: '#D1FAE5', searchTerm: 'sports training' },
    { name: 'Coding', icon: '💻', color: '#FCE7F3', searchTerm: 'coding classes' },
    { name: 'Dance', icon: '💃', color: '#F3E8FF', searchTerm: 'dance classes' },
  ];

  const displayedGoals = selectedCategory === 'all' 
    ? allGoals.all 
    : allGoals[selectedCategory] || allGoals.all;

  const filteredGoals = searchQuery.trim() === ''
    ? displayedGoals
    : displayedGoals.filter(goal => 
        goal.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const handleGoalSelect = (goal) => {
    Alert.alert(
      goal.name,
      'Would you like to find local providers for this activity?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Find Providers',
          onPress: () => {
            navigation.navigate('FindProviders', {
              child: { name: 'Your Child', id: 'temp' },
              goal: goal.name,
              activity: goal.name
            });
          }
        }
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
        <Text style={styles.title}>Discover</Text>
        <Text style={styles.subtitle}>Find activities for your child's goals</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
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
          <Text style={styles.sectionSubtitle}>
            {filteredGoals.length} {filteredGoals.length === 1 ? 'goal' : 'goals'} available
          </Text>
          
          <View style={styles.goalsGrid}>
            {filteredGoals.map((goal, idx) => (
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
                <Text style={styles.activityCardAction}>Find nearby →</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>💡 Pro Tips</Text>
          <Text style={styles.tipsText}>
            • Start with 2-3 activities per week{'\n'}
            • Mix different types of activities{'\n'}
            • Let your child explore their interests{'\n'}
            • Track progress to see what they enjoy most
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
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
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