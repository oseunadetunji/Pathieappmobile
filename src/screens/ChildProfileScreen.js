import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { doc, onSnapshot, updateDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { showAlert } from '../utils/crossAlert';
import { useSubscription } from '../context/SubscriptionContext';

export default function ChildProfileScreen({ route, navigation }) {
  const { child } = route.params;
  const { startAddGoal } = useSubscription();
  const [currentChild, setCurrentChild] = useState(child);

  useEffect(() => {
    // Listen to real-time updates for this child
    const unsubscribe = onSnapshot(doc(db, 'children', child.id), (snapshot) => {
      if (snapshot.exists()) {
        setCurrentChild({
          id: snapshot.id,
          ...snapshot.data()
        });
      }
    });

    return unsubscribe;
  }, [child.id]);

  const handleDeleteGoal = async (goalToDelete, index) => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      showAlert('Error', 'You must be logged in to delete a goal');
      return;
    }

    const goalName = typeof goalToDelete === 'string' ? goalToDelete : goalToDelete.name;

    try {
      // Count related activities for this goal
      const activitiesQuery = query(
        collection(db, 'activities'),
        where('userId', '==', userId),
        where('childId', '==', child.id),
        where('goal', '==', goalName)
      );
      const activitiesSnapshot = await getDocs(activitiesQuery);

      const customActivitiesQuery = query(
        collection(db, 'customActivities'),
        where('userId', '==', userId),
        where('childId', '==', child.id),
        where('goal', '==', goalName)
      );
      const customActivitiesSnapshot = await getDocs(customActivitiesQuery);

      const totalActivities = activitiesSnapshot.size + customActivitiesSnapshot.size;
      
      let deleteMessage = `Are you sure you want to delete the goal "${goalName}"?\n\n`;
      
      if (totalActivities > 0) {
        deleteMessage += `This will also delete:\n`;
        if (activitiesSnapshot.size > 0) {
          deleteMessage += `• ${activitiesSnapshot.size} scheduled activit${activitiesSnapshot.size !== 1 ? 'ies' : 'y'}\n`;
        }
        if (customActivitiesSnapshot.size > 0) {
          deleteMessage += `• ${customActivitiesSnapshot.size} custom plan activit${customActivitiesSnapshot.size !== 1 ? 'ies' : 'y'}\n`;
        }
        deleteMessage += `\n`;
      }
      
      deleteMessage += `This action cannot be undone.`;

      showAlert(
        '⚠️ Delete Goal',
        deleteMessage,
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                // Delete all scheduled activities for this goal
                const activityDeletePromises = activitiesSnapshot.docs.map(doc => 
                  deleteDoc(doc.ref)
                );

                // Delete all custom activities for this goal
                const customActivityDeletePromises = customActivitiesSnapshot.docs.map(doc => 
                  deleteDoc(doc.ref)
                );

                // Execute all activity deletions
                await Promise.all([
                  ...activityDeletePromises,
                  ...customActivityDeletePromises
                ]);

                // Remove goal from child's goals array
                const updatedGoals = currentChild.goals.filter((_, i) => i !== index);
                await updateDoc(doc(db, 'children', child.id), {
                  goals: updatedGoals
                });

                showAlert('Success', `Goal "${goalName}" has been deleted`);
              } catch (error) {
                console.error('Error deleting goal:', error);
                showAlert('Error', 'Failed to delete goal. Please try again.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error preparing delete:', error);
      showAlert('Error', 'Failed to prepare deletion. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.avatar}>{currentChild.avatar}</Text>
        <View>
          <Text style={styles.name}>{currentChild.name}</Text>
          <Text style={styles.age}>Age {currentChild.age}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Goals</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => startAddGoal(currentChild, navigation)}
            >
              <Text style={styles.addButtonText}>+ Add Goal</Text>
            </TouchableOpacity>
          </View>

          {currentChild.goals && currentChild.goals.length > 0 ? (
            <>
              {currentChild.goals.map((goal, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.goalCard}
                  onPress={() => navigation.navigate('ActivityPlan', { 
                    child: currentChild, 
                    goal: typeof goal === 'string' ? goal : goal.name 
                  })}
                  onLongPress={() => handleDeleteGoal(goal, index)}
                  activeOpacity={0.7}
                >
                  <View style={styles.goalContent}>
                    <Text style={styles.goalIcon}>🎯</Text>
                    <Text style={styles.goalText}>
                      {typeof goal === 'string' ? goal : goal.name}
                    </Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              ))}
              
              <View style={styles.hintContainer}>
                <Text style={styles.hintText}>
                  💡 Tip: Long press on any goal to delete it
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.emptyText}>No goals yet. Add one to get started!</Text>
          )}
        </View>

        <TouchableOpacity 
          style={styles.calendarButton}
          onPress={() => navigation.navigate('Home', { screen: 'Calendar' })}
        >
          <Text style={styles.buttonText}>📅 View Calendar</Text>
        </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    fontSize: 60,
    marginRight: 16,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  age: {
    fontSize: 16,
    color: '#E9D5FF',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  addButton: {
    backgroundColor: '#E9D5FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#9333EA',
    fontSize: 14,
    fontWeight: '600',
  },
  goalCard: {
    backgroundColor: '#FDF4FF',
    borderWidth: 2,
    borderColor: '#E9D5FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  goalIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  goalText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
    flex: 1,
  },
  chevron: {
    fontSize: 24,
    color: '#C4B5FD',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    marginTop: 24,
  },
  calendarButton: {
    backgroundColor: '#9333EA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hintContainer: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  hintText: {
    fontSize: 13,
    color: '#92400E',
    textAlign: 'center',
  },
});