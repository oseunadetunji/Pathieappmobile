import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { auth, db } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import HeaderBack from '../components/HeaderBack';
import GettingStarted from '../components/GettingStarted';

export default function DashboardScreen({ navigation }) {
  const [children, setChildren] = useState([]);
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, thisWeek: 0 });

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    // Fetch children
    const childrenQuery = query(collection(db, 'children'), where('userId', '==', userId));
    const unsubChildren = onSnapshot(childrenQuery, (snapshot) => {
      const childrenData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Sanitize goals immediately when fetching
          goals: data.goals ? data.goals.map(goal => 
            typeof goal === 'string' ? goal : (goal?.name || String(goal))
          ) : []
        };
      });
      setChildren(childrenData);
    });

    // Fetch activities
     const activitiesQuery = query(collection(db, 'activities'), where('userId', '==', userId));
     const unsubActivities = onSnapshot(activitiesQuery, (snapshot) => {
      const acts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setActivities(acts);
      
      // Calculate stats
      const completed = acts.filter(a => a.completed).length;
      const thisWeek = acts.filter(a => {
        const actDate = a.createdAt?.toDate() || new Date();
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return actDate >= weekAgo;
      }).length;
      
      setStats({ total: acts.length, completed, thisWeek });
    });

    return () => {
      unsubChildren();
      unsubActivities();
    };
  }, []);

  const upcomingActivities = activities
    .filter(a => !a.completed)
    .slice(0, 3);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <HeaderBack />
        <Text style={styles.greeting}>Welcome back! {"\uD83D\uDC4B"}</Text>
        <Text style={styles.subtitle}>Here's your family's progress</Text>
      </View>

      <GettingStarted kids={children} activities={activities} navigation={navigation} />

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{children.length}</Text>
          <Text style={styles.statLabel}>Children</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.thisWeek}</Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity 
          style={styles.activityCard}
          onPress={() => navigation.navigate('Kids')}
        >
          <View style={styles.activityInfo}>
            <Text style={styles.activityName}>{"\uD83D\uDC76"} Add Child</Text>
          </View>
          <Text style={styles.activityArrow}>{"\u203A"}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.activityCard}
          onPress={() => navigation.navigate('Discover')}
        >
          <View style={styles.activityInfo}>
            <Text style={styles.activityName}>{"\uD83D\uDD0D"} Find Activities</Text>
          </View>
          <Text style={styles.activityArrow}>{"\u203A"}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.activityCard}
          onPress={() => navigation.navigate('Calendar')}
        >
          <View style={styles.activityInfo}>
            <Text style={styles.activityName}>{"\uD83D\uDCC5"} View Calendar</Text>
          </View>
          <Text style={styles.activityArrow}>{"\u203A"}</Text>
        </TouchableOpacity>
      </View>

      {/* Upcoming Activities */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Activities</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Calendar')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {upcomingActivities.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>{"\uD83D\uDCC5"}</Text>
            <Text style={styles.emptyText}>No upcoming activities</Text>
            <Text style={styles.emptySubtext}>Discover activities to get started</Text>
          </View>
        ) : (
          upcomingActivities.map(activity => (
            <TouchableOpacity 
              key={activity.id}
              style={styles.activityCard}
              onPress={() => navigation.navigate('Calendar')}
            >
              <View style={styles.activityInfo}>
                <Text style={styles.activityName}>{activity.activityName || activity.name || 'Untitled Activity'}</Text>
                <Text style={styles.activityTime}>
                  {activity.scheduledDate ? new Date(activity.scheduledDate.seconds * 1000).toLocaleDateString() : 'No date set'}
                </Text>
              </View>
              <Text style={styles.activityArrow}>{"\u203A"}</Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Children Overview */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Children</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Kids')}>
            <Text style={styles.seeAllText}>Manage</Text>
          </TouchableOpacity>
        </View>

        {children.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>{"\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67\u200D\uD83D\uDC66"}</Text>
            <Text style={styles.emptyText}>No children added yet</Text>
            <TouchableOpacity 
              style={styles.addChildButton}
              onPress={() => navigation.navigate('Kids')}
            >
              <Text style={styles.addChildButtonText}>Add Your First Child</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {children.map((child) => (
              <TouchableOpacity
                key={child.id}
                style={styles.childCard}
                onPress={() => {
                  // Goals are already sanitized in the children state
                  navigation.navigate('ChildProfile', { child });
                }}
              >
                <Text style={styles.childAvatar}>{child.avatar || "\uD83D\uDC67"}</Text>
                <Text style={styles.childName}>{child.name}</Text>
                <Text style={styles.childAge}>{child.age} years old</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#9333EA',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#E9D5FF',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#9333EA',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    padding: 20,
    paddingTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  seeAllText: {
    fontSize: 14,
    color: '#9333EA',
    fontWeight: '600',
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 14,
    color: '#666',
  },
  activityArrow: {
    fontSize: 24,
    color: '#9333EA',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  childCard: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    marginRight: 10,
    alignItems: 'center',
    width: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  childAvatar: {
    fontSize: 40,
    marginBottom: 10,
  },
  childName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  childAge: {
    fontSize: 12,
    color: '#666',
  },
  addChildButton: {
    backgroundColor: '#9333EA',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
  },
  addChildButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});