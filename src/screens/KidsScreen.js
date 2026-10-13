import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { collection, query, onSnapshot, where, addDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { showAlert } from '../utils/crossAlert';
import { useSubscription } from '../context/SubscriptionContext';
import HeaderBack from '../components/HeaderBack';

export default function KidsScreen({ navigation }) {
  const { startAddChild } = useSubscription();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const q = query(collection(db, 'children'), where('userId', '==', userId));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const childrenData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Sanitize goals immediately when fetching from Firestore
          goals: data.goals ? data.goals.map(goal => 
            typeof goal === 'string' ? goal : (goal?.name || String(goal))
          ) : []
        };
      });
      setChildren(childrenData);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const getAvatarEmoji = (index) => {
    const emojis = ['👧', '👦', '🧒', '👶', '🧑'];
    return emojis[index % emojis.length];
  };

  // Helper function to safely get goal name
  const getGoalName = (goal) => {
    if (typeof goal === 'string') return goal;
    if (goal && typeof goal === 'object' && goal.name) return goal.name;
    return 'Goal';
  };

  const handleDeleteChild = async (child) => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      showAlert('Error', 'You must be logged in to delete a child profile');
      return;
    }

    try {
      // Count activities to show in confirmation
      const activitiesQuery = query(
        collection(db, 'activities'),
        where('userId', '==', userId),
        where('childId', '==', child.id)
      );
      const activitiesSnapshot = await getDocs(activitiesQuery);

      const customActivitiesQuery = query(
        collection(db, 'customActivities'),
        where('userId', '==', userId),
        where('childId', '==', child.id)
      );
      const customActivitiesSnapshot = await getDocs(customActivitiesQuery);

      const totalGoals = child.goals?.length || 0;
      const totalActivities = activitiesSnapshot.size + customActivitiesSnapshot.size;
      
      let deleteMessage = `Are you sure you want to delete ${child.name}'s profile?\n\n`;
      deleteMessage += `This will permanently delete:\n`;
      deleteMessage += `• ${totalGoals} goal${totalGoals !== 1 ? 's' : ''}\n`;
      
      if (activitiesSnapshot.size > 0) {
        deleteMessage += `• ${activitiesSnapshot.size} scheduled activit${activitiesSnapshot.size !== 1 ? 'ies' : 'y'}\n`;
      }
      if (customActivitiesSnapshot.size > 0) {
        deleteMessage += `• ${customActivitiesSnapshot.size} custom plan activit${customActivitiesSnapshot.size !== 1 ? 'ies' : 'y'}\n`;
      }
      
      deleteMessage += `\nThis action cannot be undone.`;

      showAlert(
        '⚠️ Delete Child Profile',
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
                // Delete all scheduled activities
                const activityDeletePromises = activitiesSnapshot.docs.map(doc => 
                  deleteDoc(doc.ref)
                );

                // Delete all custom activities
                const customActivityDeletePromises = customActivitiesSnapshot.docs.map(doc => 
                  deleteDoc(doc.ref)
                );

                // Execute all deletions
                await Promise.all([
                  ...activityDeletePromises,
                  ...customActivityDeletePromises
                ]);

                // Finally, delete the child document
                await deleteDoc(doc(db, 'children', child.id));

                showAlert('Success', `${child.name}'s profile has been deleted`);
              } catch (error) {
                console.error('Error deleting child:', error);
                showAlert('Error', 'Failed to delete child profile. Please try again.');
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
        <HeaderBack />
        <Text style={styles.title}>My Children</Text>
        <Text style={styles.subtitle}>Manage your children and their goals</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.addButtonContainer}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => startAddChild(navigation)}
          >
            <Text style={styles.addButtonIcon}>+</Text>
            <Text style={styles.addButtonText}>Add Child</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : children.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👨‍👩‍👧‍👦</Text>
            <Text style={styles.emptyText}>No children added yet</Text>
            <Text style={styles.emptySubtext}>Add your first child to get started!</Text>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => startAddChild(navigation)}
            >
              <Text style={styles.buttonText}>Add Your First Child</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            {children.map((child, index) => (
              <TouchableOpacity
                key={child.id}
                style={styles.childCard}
                onPress={() => navigation.navigate('ChildProfile', { child })}
                onLongPress={() => handleDeleteChild(child)}
                activeOpacity={0.7}
              >
                <Text style={styles.avatar}>{child.avatar || getAvatarEmoji(index)}</Text>
                <View style={styles.childInfo}>
                  <Text style={styles.childName}>{child.name}</Text>
                  <Text style={styles.childAge}>Age {child.age}</Text>
                  <View style={styles.goalsContainer}>
                    {child.goals && child.goals.map((goal, idx) => (
                      <View key={idx} style={styles.goalTag}>
                        <Text style={styles.goalText}>🎯 {getGoalName(goal)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))}
            
            <View style={styles.hintContainer}>
              <Text style={styles.hintText}>
                💡 Tip: Long press on any child card to delete their profile
              </Text>
            </View>
          </View>
        )}
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
  addButtonContainer: {
    padding: 16,
  },
  addButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#9333EA',
    borderStyle: 'dashed',
  },
  addButtonIcon: {
    fontSize: 24,
    color: '#9333EA',
    marginRight: 8,
    fontWeight: 'bold',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#9333EA',
  },
  childCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    fontSize: 48,
    marginRight: 16,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  childAge: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  goalsContainer: {
    marginTop: 8,
  },
  goalTag: {
    marginBottom: 4,
  },
  goalText: {
    fontSize: 13,
    color: '#9333EA',
  },
  chevron: {
    fontSize: 28,
    color: '#D1D5DB',
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
    marginTop: 32,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#9333EA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: '#10B981',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 24,
  },
  hintContainer: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  hintText: {
    fontSize: 13,
    color: '#92400E',
    textAlign: 'center',
  },
});