import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { getGoalMatch, getPlanForCategory, CATEGORY_LABELS } from '../data/activityDatabase';
import { showAlert } from '../utils/crossAlert';
import { useSubscription } from '../context/SubscriptionContext';
import HeaderBack from '../components/HeaderBack';
import ActivityPlanGuide from '../components/ActivityPlanGuide';

export default function ActivityPlanScreen({ route, navigation }) {
  const { child, goal } = route.params;
  const { checkCanSchedule } = useSubscription();
  const match = React.useMemo(() => getGoalMatch(goal), [goal]);
  const [pickedCategory, setPickedCategory] = useState(null);
  const suggestedActivities = pickedCategory ? getPlanForCategory(pickedCategory) : match.plan;
  const needsPicker = match.confidence === 'none' && !pickedCategory;
  const searchTerm = (goal || '').replace(/^\s*(i want to be|to be|become|be)\s+(a|an|the)?\s*/i, '').trim() || goal;
  const [customPlan, setCustomPlan] = useState([]);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [newActivity, setNewActivity] = useState({
    name: '',
    frequency: '',
    duration: '',
    category: 'Custom'
  });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [recurrence, setRecurrence] = useState('once');
  const [recurringUntil, setRecurringUntil] = useState('');

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    // Fetch custom plan activities for this child and goal
    const q = query(
      collection(db, 'customActivities'),
      where('userId', '==', userId),
      where('childId', '==', child.id),
      where('goal', '==', goal)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activities = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCustomPlan(activities);
    });

    return unsubscribe;
  }, [child.id, goal]);

  // How many sessions are already scheduled for this child (drives the guide card)
  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    const q = query(collection(db, 'activities'), where('userId', '==', userId), where('childId', '==', child.id));
    return onSnapshot(q, (snap) => setScheduledCount(snap.size), () => setScheduledCount(0));
  }, [child.id]);

  // Best-effort log of goals we could not classify (and what the user chose),
  // so the matcher can be improved. Never blocks the UI.
  const logUnmatched = async (chosenCategory) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;
      await addDoc(collection(db, 'unmatchedGoals'), {
        userId,
        goal,
        chosenCategory: chosenCategory || null,
        createdAt: new Date()
      });
    } catch (e) {
      // ignore (e.g. Firestore rules)
    }
  };

  useEffect(() => {
    if (match.confidence === 'none') logUnmatched(null);
  }, [goal]);

  const pickCategory = (key) => {
    setPickedCategory(key);
    logUnmatched(key);
  };

  const addToPlan = async (activity, category) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      await addDoc(collection(db, 'customActivities'), {
        userId,
        childId: child.id,
        childName: child.name,
        goal,
        name: activity.name,
        frequency: activity.frequency,
        duration: activity.duration,
        category: category,
        createdAt: new Date()
      });
      showAlert('Added! ✅', `${activity.name} added to your plan`);
    } catch (error) {
      showAlert('Error', error.message);
    }
  };

  const addCustomActivity = async () => {
    if (!newActivity.name || !newActivity.frequency || !newActivity.duration) {
      showAlert('Error', 'Please fill in all fields');
      return;
    }

    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      await addDoc(collection(db, 'customActivities'), {
        userId,
        childId: child.id,
        childName: child.name,
        goal,
        name: newActivity.name,
        frequency: newActivity.frequency,
        duration: newActivity.duration,
        category: newActivity.category,
        createdAt: new Date()
      });

      setNewActivity({ name: '', frequency: '', duration: '', category: 'Custom' });
      setShowAddModal(false);
      showAlert('Success', 'Custom activity added to your plan!');
    } catch (error) {
      showAlert('Error', error.message);
    }
  };

  const removeFromPlan = async (activityId) => {
    showAlert(
      'Remove Activity',
      'Remove this from your plan?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'customActivities', activityId));
            } catch (error) {
              showAlert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  const openScheduleModal = (activity) => {
    setSelectedActivity(activity);
    setShowScheduleModal(true);
  };

  const scheduleActivity = async () => {
    if (!selectedActivity || !selectedDate) {
      showAlert('Error', 'Please select a date');
      return;
    }

    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      const startDate = new Date(selectedDate + 'T12:00:00');
      const dates = [];

      if (recurrence === 'once') {
        dates.push(startDate);
      } else {
        const endDate = recurringUntil
          ? new Date(recurringUntil + 'T12:00:00')
          : new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000);

        let currentDate = new Date(startDate);
        while (currentDate <= endDate && dates.length < 50) {
          dates.push(new Date(currentDate));
          if (recurrence === 'weekly') currentDate.setDate(currentDate.getDate() + 7);
          else if (recurrence === 'biweekly') currentDate.setDate(currentDate.getDate() + 14);
          else if (recurrence === 'monthly') currentDate.setMonth(currentDate.getMonth() + 1);
        }
      }

      if (!(await checkCanSchedule(dates.length, recurrence, navigation))) {
        setShowScheduleModal(false);
        return;
      }

      await Promise.all(
        dates.map((date) =>
          addDoc(collection(db, 'activities'), {
            userId,
            childId: child.id,
            childName: child.name,
            goal,
            activityName: selectedActivity.name,
            providerName: 'To Be Determined',
            providerAddress: '',
            providerDistance: '',
            completed: false,
            notes: '',
            createdAt: new Date(),
            scheduledDate: date,
            recurrence
          })
        )
      );

      setShowScheduleModal(false);
      setSelectedActivity(null);
      setRecurrence('once');
      setRecurringUntil('');
      setSelectedDate(new Date().toISOString().split('T')[0]);

      showAlert('Success! 🎉', `${dates.length} session(s) scheduled!`);
    } catch (error) {
      showAlert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <HeaderBack />
        <Text style={styles.headerTitle}>Activity Plan</Text>
        <Text style={styles.headerSubtitle}>
          {child.name}, Age {child.age} - {goal}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <ActivityPlanGuide planCount={customPlan.length} scheduledCount={scheduledCount} childName={child.name} />

        {/* Your Custom Plan Section */}
        {customPlan.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📋 Your Custom Plan</Text>
              <Text style={styles.sectionCount}>{customPlan.length} activities</Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              Schedule or find providers for these activities
            </Text>

            {customPlan.map((activity) => (
              <View key={activity.id} style={styles.customActivityCard}>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityName}>{activity.name}</Text>
                  <View style={styles.activityMeta}>
                    <Text style={styles.frequency}>📍 {activity.frequency}</Text>
                    <Text style={styles.duration}>⏱️ {activity.duration}</Text>
                  </View>
                  <Text style={styles.categoryBadge}>{activity.category}</Text>
                </View>
                <View style={styles.customActivityActions}>
                  <TouchableOpacity
                    style={styles.scheduleButton}
                    onPress={() => openScheduleModal(activity)}
                  >
                    <Text style={styles.scheduleButtonText}>📅 Schedule</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.findProvidersButton}
                    onPress={() => navigation.navigate('FindProviders', { 
                      child, 
                      goal, 
                      activity: activity.name 
                    })}
                  >
                    <Text style={styles.findProvidersButtonText}>Find Providers</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeFromPlan(activity.id)}
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Add Custom Activity Button */}
        <TouchableOpacity
          style={styles.addCustomButton}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addCustomIcon}>+</Text>
          <Text style={styles.addCustomText}>Add Custom Activity</Text>
        </TouchableOpacity>

        {/* Suggested Activities Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>💡 Suggested Activities</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Based on "{goal}" - Add to your plan to get started
          </Text>

          {needsPicker && (
            <View style={styles.pickerCard}>
              <Text style={styles.pickerTitle}>What area is this closest to?</Text>
              <Text style={styles.pickerText}>
                We're not sure which activities fit "{goal}" yet. Pick the closest area and we'll suggest activities for it.
              </Text>
              <View style={styles.pickerChips}>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <TouchableOpacity key={key} style={styles.pickerChip} onPress={() => pickCategory(key)}>
                    <Text style={styles.pickerChipText}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={styles.pickerSearch}
                onPress={() => navigation.navigate('FindProviders', { child, goal, activity: searchTerm })}
              >
                <Text style={styles.pickerSearchText}>🔍 Search nearby for "{searchTerm}"</Text>
              </TouchableOpacity>
            </View>
          )}

          {pickedCategory && (
            <Text style={styles.pickerNote}>
              Showing {CATEGORY_LABELS[pickedCategory]} activities.{' '}
              <Text style={styles.pickerChange} onPress={() => setPickedCategory(null)}>Change</Text>
            </Text>
          )}

          {suggestedActivities.map((section, index) => (
            <View key={index} style={styles.suggestedSection}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryIcon}>{section.icon}</Text>
                <Text style={styles.categoryTitle}>{section.category}</Text>
              </View>

              {section.activities.map((activity, actIndex) => (
                <View key={actIndex} style={styles.activityCard}>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityName}>{activity.name}</Text>
                    <View style={styles.activityMeta}>
                      <Text style={styles.frequency}>📍 {activity.frequency}</Text>
                      <Text style={styles.duration}>⏱️ {activity.duration}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.addToPlanButton}
                    onPress={() => addToPlan(activity, section.category)}
                  >
                    <Text style={styles.addToPlanText}>+ Add to Plan</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.calendarButton}
          onPress={() => {
            // Navigate back to Home (MainTabs) and switch to Calendar tab
            navigation.navigate('Home', { 
              screen: 'Calendar'
            });
          }}
        >
          <Text style={styles.buttonText}>📅 View Calendar</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Custom Activity Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Custom Activity</Text>
            
            <ScrollView 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.inputLabel}>Activity Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Swimming lessons"
                value={newActivity.name}
                onChangeText={(text) => setNewActivity({...newActivity, name: text})}
              />

              <Text style={styles.inputLabel}>Frequency</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 2x/week, Daily, Monthly"
                value={newActivity.frequency}
                onChangeText={(text) => setNewActivity({...newActivity, frequency: text})}
              />

              <Text style={styles.inputLabel}>Duration</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 1 hour, 30 mins"
                value={newActivity.duration}
                onChangeText={(text) => setNewActivity({...newActivity, duration: text})}
              />

              <Text style={styles.inputLabel}>Category (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Sports, Arts, STEM"
                value={newActivity.category}
                onChangeText={(text) => setNewActivity({...newActivity, category: text})}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowAddModal(false);
                    setNewActivity({ name: '', frequency: '', duration: '', category: 'Custom' });
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={addCustomActivity}
                >
                  <Text style={styles.saveButtonText}>Add to Plan</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Schedule Activity Modal */}
      <Modal
        visible={showScheduleModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowScheduleModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Schedule Activity</Text>
            <Text style={styles.modalSubtitle}>{selectedActivity?.name}</Text>

            <ScrollView 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.inputLabel}>Start Date</Text>
              <TextInput
                style={styles.input}
                value={selectedDate}
                onChangeText={setSelectedDate}
                placeholder="YYYY-MM-DD"
              />

              <Text style={styles.inputLabel}>Recurrence</Text>
              <View style={styles.recurrenceOptions}>
                {['once', 'weekly', 'biweekly', 'monthly'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.recurrenceButton,
                      recurrence === type && styles.recurrenceButtonActive
                    ]}
                    onPress={() => setRecurrence(type)}
                  >
                    <Text style={[
                      styles.recurrenceText,
                      recurrence === type && styles.recurrenceTextActive
                    ]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {recurrence !== 'once' && (
                <>
                  <Text style={styles.inputLabel}>Repeat Until (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={recurringUntil}
                    onChangeText={setRecurringUntil}
                    placeholder="YYYY-MM-DD (default: 3 months)"
                  />
                  <Text style={styles.helpText}>Leave blank for 3 months</Text>
                </>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowScheduleModal(false);
                    setSelectedActivity(null);
                    setRecurrence('once');
                    setRecurringUntil('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={scheduleActivity}
                >
                  <Text style={styles.saveButtonText}>Schedule</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E9D5FF',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  sectionCount: {
    fontSize: 14,
    color: '#9333EA',
    fontWeight: '600',
  },
  addCustomButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#9333EA',
    borderStyle: 'dashed',
  },
  addCustomIcon: {
    fontSize: 24,
    color: '#9333EA',
    marginRight: 8,
    fontWeight: 'bold',
  },
  addCustomText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#9333EA',
  },
  customActivityCard: {
    backgroundColor: '#FDF4FF',
    borderWidth: 2,
    borderColor: '#E9D5FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  suggestedSection: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  activityCard: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  activityMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  frequency: {
    fontSize: 13,
    color: '#6B7280',
  },
  duration: {
    fontSize: 13,
    color: '#6B7280',
  },
  categoryBadge: {
    fontSize: 12,
    color: '#9333EA',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  customActivityActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  addToPlanButton: {
    backgroundColor: '#9333EA',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 12,
  },
  addToPlanText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  scheduleButton: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  scheduleButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  findProvidersButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  findProvidersButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  removeButton: {
    backgroundColor: '#FEE2E2',
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  removeButtonText: {
    color: '#DC2626',
    fontSize: 18,
    fontWeight: 'bold',
  },
  calendarButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  recurrenceOptions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  recurrenceButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  recurrenceButtonActive: {
    backgroundColor: '#9333EA',
    borderColor: '#9333EA',
  },
  recurrenceText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  recurrenceTextActive: {
    color: 'white',
  },
  helpText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: -8,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#9333EA',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
  pickerCard: { backgroundColor: '#FDF4FF', borderWidth: 2, borderColor: '#E9D5FF', borderRadius: 12, padding: 16, marginBottom: 16 },
  pickerTitle: { fontSize: 16, fontWeight: 'bold', color: '#6B21A8', marginBottom: 6 },
  pickerText: { fontSize: 13, color: '#6B7280', marginBottom: 12, lineHeight: 18 },
  pickerChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pickerChip: { backgroundColor: 'white', borderWidth: 1, borderColor: '#D8B4FE', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  pickerChipText: { fontSize: 13, color: '#7C3AED', fontWeight: '600' },
  pickerSearch: { marginTop: 14, backgroundColor: '#9333EA', borderRadius: 10, padding: 12, alignItems: 'center' },
  pickerSearchText: { color: 'white', fontSize: 14, fontWeight: '600' },
  pickerNote: { fontSize: 13, color: '#6B7280', marginBottom: 12 },
  pickerChange: { color: '#9333EA', fontWeight: '700', textDecorationLine: 'underline' },
});