import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Modal, Alert } from 'react-native';
import { auth, db } from '../../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Calendar } from 'react-native-calendars';
import { showAlert } from '../utils/crossAlert';

export default function CalendarScreen() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [note, setNote] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [markedDates, setMarkedDates] = useState({});

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

   const q = query(collection(db, 'activities'), where('userId', '==', userId));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activitiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setActivities(activitiesData);
      updateMarkedDates(activitiesData);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const updateMarkedDates = (activitiesData) => {
    const marked = {};
    activitiesData.forEach(activity => {
      const date = activity.scheduledDate?.toDate ? 
        activity.scheduledDate.toDate().toISOString().split('T')[0] :
        new Date().toISOString().split('T')[0];
      
      if (!marked[date]) {
        marked[date] = { dots: [] };
      }
      
      marked[date].dots.push({
        color: activity.completed ? '#10B981' : '#9333EA',
      });
      
      marked[date].marked = true;
    });

    // Add selection styling if date is selected
    if (selectedDate && marked[selectedDate]) {
      marked[selectedDate].selected = true;
      marked[selectedDate].selectedColor = '#9333EA';
    } else if (selectedDate) {
      marked[selectedDate] = { selected: true, selectedColor: '#E5E7EB' };
    }

    setMarkedDates(marked);
  };

  const toggleComplete = async (activity) => {
    try {
      await updateDoc(doc(db, 'activities', activity.id), {
        completed: !activity.completed,
        completedAt: !activity.completed ? new Date() : null
      });
    } catch (error) {
      showAlert('Error', error.message);
    }
  };

  const openNoteModal = (activity) => {
    setSelectedActivity(activity);
    setNote(activity.notes || '');
    setShowNoteModal(true);
  };

  const saveNote = async () => {
    if (!selectedActivity) return;
    
    try {
     await updateDoc(doc(db, 'activities', selectedActivity.id), { notes: note });
      setShowNoteModal(false);
      showAlert('Success', 'Note saved!');
    } catch (error) {
      showAlert('Error', error.message);
    }
  };

  const deleteActivity = async (activityId) => {
    showAlert(
      'Delete Activity',
      'Are you sure you want to delete this activity?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
            await deleteDoc(doc(db, 'activities', activityId));
            } catch (error) {
              showAlert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  const getActivitiesForDate = (date) => {
    return activities.filter(activity => {
      const activityDate = activity.scheduledDate?.toDate ? 
        activity.scheduledDate.toDate().toISOString().split('T')[0] :
        new Date().toISOString().split('T')[0];
      return activityDate === date;
    }).sort((a, b) => {
      // Sort by completion status, then by creation time
      if (a.completed === b.completed) {
        return a.createdAt?.toDate() - b.createdAt?.toDate();
      }
      return a.completed ? 1 : -1;
    });
  };

  const completedCount = activities.filter(a => a.completed).length;
  const totalCount = activities.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const formatDateDisplay = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateStr = date.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    if (dateStr === todayStr) return 'Today';
    if (dateStr === tomorrowStr) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: 'numeric' 
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{completedCount}/{totalCount}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{completionRate}%</Text>
            <Text style={styles.statLabel}>Progress</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalCount - completedCount}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
        </View>

        {/* Calendar */}
        <View style={styles.calendarContainer}>
          <Calendar
            markedDates={markedDates}
            onDayPress={(day) => {
              setSelectedDate(day.dateString);
              updateMarkedDates(activities);
            }}
            markingType={'multi-dot'}
            theme={{
              todayTextColor: '#9333EA',
              selectedDayBackgroundColor: '#9333EA',
              selectedDayTextColor: 'white',
              arrowColor: '#9333EA',
              monthTextColor: '#1F2937',
              textMonthFontWeight: 'bold',
            }}
          />
        </View>

        {/* Selected Date Activities */}
        {selectedDate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {formatDateDisplay(selectedDate)}
            </Text>
            
            {getActivitiesForDate(selectedDate).length === 0 ? (
              <View style={styles.emptyDateState}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyText}>No activities scheduled</Text>
              </View>
            ) : (
              getActivitiesForDate(selectedDate).map((activity) => (
                <View 
                  key={activity.id}
                  style={[
                    styles.activityCard,
                    activity.completed && styles.activityCardCompleted
                  ]}
                >
                  <View style={styles.activityHeader}>
                    <View style={styles.activityInfo}>
                      <Text style={styles.activityName}>{activity.activityName}</Text>
                      <Text style={styles.childName}>👤 {activity.childName}</Text>
                      <Text style={styles.providerName}>📍 {activity.providerName}</Text>
                      {activity.notes && (
                        <Text style={styles.activityNote}>📝 {activity.notes}</Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.checkButton,
                        activity.completed && styles.checkButtonCompleted
                      ]}
                      onPress={() => toggleComplete(activity)}
                    >
                      <Text style={styles.checkIcon}>{activity.completed ? '✓' : ''}</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.activityActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => openNoteModal(activity)}
                    >
                      <Text style={styles.actionButtonText}>📝 Add Note</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => deleteActivity(activity.id)}
                    >
                      <Text style={[styles.actionButtonText, styles.deleteButtonText]}>🗑️ Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* All Upcoming Activities */}
        {!selectedDate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>All Upcoming Activities</Text>
            {activities.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📅</Text>
                <Text style={styles.emptyText}>No activities scheduled yet</Text>
                <Text style={styles.emptySubtext}>Add activities from the activity plan!</Text>
              </View>
            ) : (
              Object.entries(
                activities.reduce((groups, activity) => {
                  const date = activity.scheduledDate?.toDate ? 
                    activity.scheduledDate.toDate().toISOString().split('T')[0] :
                    new Date().toISOString().split('T')[0];
                  if (!groups[date]) groups[date] = [];
                  groups[date].push(activity);
                  return groups;
                }, {})
              )
              .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
              .map(([date, dateActivities]) => (
                <View key={date} style={styles.dateGroup}>
                  <TouchableOpacity 
                    style={styles.dateHeader}
                    onPress={() => setSelectedDate(date)}
                  >
                    <Text style={styles.dateTitle}>{formatDateDisplay(date)}</Text>
                    <Text style={styles.dateCount}>{dateActivities.length} {dateActivities.length === 1 ? 'activity' : 'activities'}</Text>
                  </TouchableOpacity>
                  
                  {dateActivities.slice(0, 2).map((activity) => (
                    <TouchableOpacity
                      key={activity.id}
                      style={[
                        styles.activityCard,
                        activity.completed && styles.activityCardCompleted
                      ]}
                      onPress={() => setSelectedDate(date)}
                    >
                      <View style={styles.activityHeader}>
                        <View style={styles.activityInfo}>
                          <Text style={styles.activityName}>{activity.activityName}</Text>
                          <Text style={styles.childName}>👤 {activity.childName}</Text>
                        </View>
                        <TouchableOpacity
                          style={[
                            styles.checkButton,
                            activity.completed && styles.checkButtonCompleted
                          ]}
                          onPress={(e) => {
                            e.stopPropagation();
                            toggleComplete(activity);
                          }}
                        >
                          <Text style={styles.checkIcon}>{activity.completed ? '✓' : ''}</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))}
                  
                  {dateActivities.length > 2 && (
                    <TouchableOpacity
                      style={styles.showMoreButton}
                      onPress={() => setSelectedDate(date)}
                    >
                      <Text style={styles.showMoreText}>
                        Show {dateActivities.length - 2} more {dateActivities.length - 2 === 1 ? 'activity' : 'activities'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Note Modal */}
      <Modal
        visible={showNoteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNoteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Note</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="How did it go? Any observations?"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={4}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowNoteModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveNote}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingTop: 50,
  },
  content: {
    flex: 1,
  },
  statsCard: {
    backgroundColor: '#9333EA',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: '#E9D5FF',
    marginTop: 4,
  },
  calendarContainer: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
  },
  dateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  dateCount: {
    fontSize: 14,
    color: '#9333EA',
    fontWeight: '600',
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  activityCardCompleted: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  childName: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  providerName: {
    fontSize: 14,
    color: '#6B7280',
  },
  activityNote: {
    fontSize: 13,
    color: '#7C3AED',
    marginTop: 8,
    fontStyle: 'italic',
  },
  checkButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkButtonCompleted: {
    backgroundColor: '#10B981',
  },
  checkIcon: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  activityActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
  },
  deleteButtonText: {
    color: '#DC2626',
  },
  showMoreButton: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  showMoreText: {
    fontSize: 14,
    color: '#9333EA',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyDateState: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
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
    fontSize: 16,
    fontWeight: 'bold',
  },
});
