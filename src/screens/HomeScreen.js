import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { auth, db } from '../../firebase';
import { showAlert } from '../utils/crossAlert';

export default function HomeScreen({ navigation }) {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const q = db.collection('children').where('userId', '==', userId);
    
    const unsubscribe = q.onSnapshot((snapshot) => {
      const childrenData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setChildren(childrenData);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      showAlert('Error', error.message);
    }
  };

  const addSampleChild = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      await db.collection('children').add({
        userId,
        name: 'Emma',
        age: 7,
        avatar: '👧',
        goals: ['Become a Doctor', 'Learn Piano'],
        createdAt: new Date()
      });
    } catch (error) {
      showAlert('Error', error.message);
    }
  };

  const getAvatarEmoji = (index) => {
    const emojis = ['👧', '👦', '🧒', '👶', '🧑'];
    return emojis[index % emojis.length];
  };

  // Helper function to get goal name (handles both string and object)
  const getGoalName = (goal) => {
    return typeof goal === 'string' ? goal : goal?.name || 'Goal';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Pathie</Text>
          <Text style={styles.subtitle}>Fun activities for every dream! 🌟</Text>
        </View>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Children</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('AddGoal', { mode: 'newChild' })}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : children.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No children added yet</Text>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => navigation.navigate('AddGoal', { mode: 'newChild' })}
            >
              <Text style={styles.buttonText}>Add Your First Child</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.primaryButton, { backgroundColor: '#10B981', marginTop: 12 }]}
              onPress={addSampleChild}
            >
              <Text style={styles.buttonText}>Add Sample Child (Emma)</Text>
            </TouchableOpacity>
          </View>
        ) : (
          children.map((child, index) => (
            <TouchableOpacity
              key={child.id}
              style={styles.childCard}
              onPress={() => navigation.navigate('ChildProfile', { child })}
            >
              <Text style={styles.avatar}>{child.avatar || getAvatarEmoji(index)}</Text>
              <View style={styles.childInfo}>
                <Text style={styles.childName}>{child.name}</Text>
                <Text style={styles.childAge}>Age {child.age}</Text>
                {child.goals && child.goals.map((goal, idx) => (
                  <View key={idx} style={styles.goalTag}>
                    <Text style={styles.goalText}>🎯 {getGoalName(goal)}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))
        )}

        <TouchableOpacity 
          style={[styles.primaryButton, { marginTop: 24 }]}
          onPress={() => navigation.navigate('Calendar')}
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
    paddingTop: 60,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: '#E9D5FF',
    marginTop: 4,
  },
  signOutButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  signOutText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 24,
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
    backgroundColor: '#9333EA',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  childCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
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
    fontSize: 40,
    marginRight: 16,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  childAge: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  goalTag: {
    marginTop: 4,
  },
  goalText: {
    fontSize: 12,
    color: '#9333EA',
  },
  chevron: {
    fontSize: 24,
    color: '#D1D5DB',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#9333EA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '100%',
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
});