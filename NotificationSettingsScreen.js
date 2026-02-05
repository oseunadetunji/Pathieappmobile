import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

export default function NotificationSettingsScreen({ navigation }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState('1day'); // '1day', '1hour', '30min'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
    checkPermissions();
  }, []);

  const loadSettings = async () => {
    try {
      const enabled = await AsyncStorage.getItem('notifications_enabled');
      const time = await AsyncStorage.getItem('reminder_time');
      
      if (enabled !== null) setNotificationsEnabled(JSON.parse(enabled));
      if (time !== null) setReminderTime(time);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      setNotificationsEnabled(false);
    }
  };

  const toggleNotifications = async (value) => {
    if (value) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive activity reminders.'
        );
        return;
      }
    }

    setNotificationsEnabled(value);
    await AsyncStorage.setItem('notifications_enabled', JSON.stringify(value));
    
    Alert.alert(
      'Success',
      value ? 'Activity reminders enabled' : 'Activity reminders disabled'
    );
  };

  const selectReminderTime = async (time) => {
    setReminderTime(time);
    await AsyncStorage.setItem('reminder_time', time);
    
    const timeLabels = {
      '1day': '1 day before',
      '1hour': '1 hour before',
      '30min': '30 minutes before'
    };
    
    Alert.alert('Success', `Reminder time set to ${timeLabels[time]}`);
  };

  const reminderOptions = [
    { value: '1day', label: '1 day before', icon: '📅' },
    { value: '1hour', label: '1 hour before', icon: '⏰' },
    { value: '30min', label: '30 minutes before', icon: '⏱️' },
  ];

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Enable/Disable Notifications */}
        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Activity Reminders</Text>
              <Text style={styles.settingDescription}>
                Get notified about upcoming scheduled activities
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#D1D5DB', true: '#C084FC' }}
              thumbColor={notificationsEnabled ? '#9333EA' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Reminder Time Selection */}
        {notificationsEnabled && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reminder Time</Text>
            <Text style={styles.sectionDescription}>
              Choose when to receive reminders before activities
            </Text>

            {reminderOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.timeOption,
                  reminderTime === option.value && styles.timeOptionSelected
                ]}
                onPress={() => selectReminderTime(option.value)}
              >
                <Text style={styles.timeIcon}>{option.icon}</Text>
                <Text style={[
                  styles.timeLabel,
                  reminderTime === option.value && styles.timeLabelSelected
                ]}>
                  {option.label}
                </Text>
                {reminderTime === option.value && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            Reminders help you and your child stay on top of scheduled activities. You can change these settings anytime.
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  settingRow: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  timeOption: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeOptionSelected: {
    borderColor: '#9333EA',
    backgroundColor: '#FDF4FF',
  },
  timeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  timeLabel: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  timeLabelSelected: {
    color: '#9333EA',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 20,
    color: '#9333EA',
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
});