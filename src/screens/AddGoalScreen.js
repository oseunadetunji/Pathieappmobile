import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { auth, db } from '../../firebase';

export default function AddGoalScreen({ route, navigation }) {
  const { child, mode } = route.params || {};
  
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [goal, setGoal] = useState('');
  const [avatar, setAvatar] = useState('👧');
  
  // Duration/timeline fields
  const [duration, setDuration] = useState('');
  const [durationUnit, setDurationUnit] = useState('months'); // 'months' or 'years'
  const [targetDate, setTargetDate] = useState(null);

  const avatars = ['👧', '👦', '🧒', '👶', '🧑', '👨', '👩'];
  const durationUnits = ['months', 'years'];

  const calculateTargetDate = (durationValue, unit) => {
    if (!durationValue || isNaN(durationValue)) return null;
    
    const now = new Date();
    const value = parseInt(durationValue);
    
    if (unit === 'months') {
      now.setMonth(now.getMonth() + value);
    } else {
      now.setFullYear(now.getFullYear() + value);
    }
    
    return now;
  };

  const handleDurationChange = (value) => {
    setDuration(value);
    setTargetDate(calculateTargetDate(value, durationUnit));
  };

  const handleUnitChange = (unit) => {
    setDurationUnit(unit);
    setTargetDate(calculateTargetDate(duration, unit));
  };

  const formatTargetDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric' 
    });
  };

  // Estimate activities needed based on duration
  const estimateActivitiesNeeded = (durationValue, unit) => {
    const months = unit === 'years' ? durationValue * 12 : durationValue;
    // Rough estimate: 2-3 activities per week = ~10 per month
    return Math.round(months * 10);
  };

  const handleSubmit = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    if (mode === 'newChild') {
      // Adding a new child
      if (!childName || !childAge || !goal) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      if (!duration || isNaN(duration)) {
        Alert.alert('Error', 'Please enter a valid timeline for the goal');
        return;
      }

      try {
        const goalData = {
          name: goal,
          duration: parseInt(duration),
          durationUnit: durationUnit,
          startDate: new Date(),
          targetDate: targetDate,
          completedActivities: 0,
          totalActivitiesNeeded: estimateActivitiesNeeded(parseInt(duration), durationUnit),
          progressPercentage: 0
        };

        const docRef = await db.collection('children').add({
          userId,
          name: childName,
          age: parseInt(childAge),
          avatar,
          goals: [goalData],
          createdAt: new Date()
        });
        
        // Get the newly created child data
        const childDoc = await docRef.get();
        const newChild = {
          id: childDoc.id,
          ...childDoc.data()
        };
        
        Alert.alert('Success', `${childName}'s profile created!`, [
          {
            text: 'OK',
            onPress: () => navigation.navigate('ChildProfile', { child: newChild })
          }
        ]);
      } catch (error) {
        Alert.alert('Error', error.message);
      }
    } else if (mode === 'addGoal') {
      // Adding a goal to existing child
      if (!goal) {
        Alert.alert('Error', 'Please enter a goal');
        return;
      }

      if (!duration || isNaN(duration)) {
        Alert.alert('Error', 'Please enter a valid timeline for the goal');
        return;
      }

      try {
        const goalData = {
          name: goal,
          duration: parseInt(duration),
          durationUnit: durationUnit,
          startDate: new Date(),
          targetDate: targetDate,
          completedActivities: 0,
          totalActivitiesNeeded: estimateActivitiesNeeded(parseInt(duration), durationUnit),
          progressPercentage: 0
        };

        const updatedGoals = [...(child.goals || []), goalData];
        await db.collection('children').doc(child.id).update({ goals: updatedGoals });
        
        Alert.alert('Success', 'Goal added successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]);
      } catch (error) {
        Alert.alert('Error', error.message);
      }
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
        {mode === 'newChild' && (
          <>
            <View style={styles.section}>
              <Text style={styles.label}>Child's Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter name"
                value={childName}
                onChangeText={setChildName}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter age"
                value={childAge}
                onChangeText={setChildAge}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Choose Avatar</Text>
              <View style={styles.avatarGrid}>
                {avatars.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.avatarButton,
                      avatar === emoji && styles.avatarButtonSelected
                    ]}
                    onPress={() => setAvatar(emoji)}
                  >
                    <Text style={styles.avatarEmoji}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        {mode === 'addGoal' && child && (
          <View style={styles.childInfo}>
            <Text style={styles.childAvatar}>{child.avatar}</Text>
            <View>
              <Text style={styles.childName}>{child.name}</Text>
              <Text style={styles.childAge}>Age {child.age}</Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.label}>
            {mode === 'newChild' ? 'First Goal' : "What's the new goal?"}
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g., Become a doctor, Master guitar, Get dance certification"
            value={goal}
            onChangeText={setGoal}
            multiline
          />
        </View>

        {/* Timeline/Duration Section */}
        <View style={styles.section}>
          <Text style={styles.label}>⏱️ Timeline to Achieve Goal</Text>
          <Text style={styles.helpText}>
            How long do you want to work towards this goal?
          </Text>
          
          <View style={styles.durationContainer}>
            <TextInput
              style={[styles.input, styles.durationInput]}
              placeholder="12"
              value={duration}
              onChangeText={handleDurationChange}
              keyboardType="number-pad"
            />
            
            <View style={styles.unitSelector}>
              {durationUnits.map((unit) => (
                <TouchableOpacity
                  key={unit}
                  style={[
                    styles.unitButton,
                    durationUnit === unit && styles.unitButtonActive
                  ]}
                  onPress={() => handleUnitChange(unit)}
                >
                  <Text style={[
                    styles.unitText,
                    durationUnit === unit && styles.unitTextActive
                  ]}>
                    {unit}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {targetDate && (
            <View style={styles.targetDateCard}>
              <Text style={styles.targetDateIcon}>🎯</Text>
              <View style={styles.targetDateContent}>
                <Text style={styles.targetDateLabel}>Target Date</Text>
                <Text style={styles.targetDateText}>{formatTargetDate(targetDate)}</Text>
                <Text style={styles.targetActivities}>
                  Estimated: ~{estimateActivitiesNeeded(parseInt(duration || 0), durationUnit)} activities needed
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.exampleBox}>
          <Text style={styles.exampleTitle}>💡 Timeline Examples:</Text>
          <Text style={styles.exampleText}>
            • Short-term (3-6 months): Get dance certification, Learn Spanish basics{'\n'}
            • Medium-term (1-3 years): Master guitar, Join soccer team{'\n'}
            • Long-term (5-15 years): Become a doctor, Start a business
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleSubmit}
        >
          <Text style={styles.buttonText}>
            {mode === 'newChild' ? 'Create Profile & Generate Plan' : 'Add Goal & Generate Plan'}
          </Text>
        </TouchableOpacity>

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
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  avatarButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarButtonSelected: {
    borderColor: '#9333EA',
    backgroundColor: '#FDF4FF',
  },
  avatarEmoji: {
    fontSize: 32,
  },
  childInfo: {
    backgroundColor: '#FDF4FF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  childAvatar: {
    fontSize: 40,
    marginRight: 12,
  },
  childName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  childAge: {
    fontSize: 14,
    color: '#6B7280',
  },
  durationContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  durationInput: {
    flex: 1,
  },
  unitSelector: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    overflow: 'hidden',
  },
  unitButton: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
  },
  unitButtonActive: {
    backgroundColor: '#9333EA',
  },
  unitText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  unitTextActive: {
    color: 'white',
  },
  targetDateCard: {
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetDateIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  targetDateContent: {
    flex: 1,
  },
  targetDateLabel: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '600',
    marginBottom: 4,
  },
  targetDateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 4,
  },
  targetActivities: {
    fontSize: 11,
    color: '#3B82F6',
  },
  exampleBox: {
    backgroundColor: '#FDF4FF',
    borderWidth: 2,
    borderColor: '#E9D5FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#7C3AED',
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
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
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 100,
  },
});