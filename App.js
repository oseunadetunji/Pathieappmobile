import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { auth } from './firebase';
import AppNavigator from './src/navigation/AppNavigator';
import { SubscriptionProvider } from './src/context/SubscriptionContext';
import * as Notifications from 'expo-notifications';
import { AlertHost } from './src/utils/crossAlert';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Web only: pin the app to the visible viewport so the bottom tab bar stays on
// screen on mobile browsers (otherwise the page grows with its content and the
// tab bar ends up below the fold). 100dvh tracks the browser toolbar on phones.
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent =
    'html,body{height:100%;overflow:hidden;overscroll-behavior:none}' +
    '#root{height:100%;height:100dvh;display:flex;flex-direction:column}';
  document.head.appendChild(style);
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for authentication state changes
    // Using compat mode - auth.onAuthStateChanged instead of onAuthStateChanged(auth, ...)
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    // Request notification permissions
    registerForPushNotifications();

    return unsubscribe;
  }, []);

  const registerForPushNotifications = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }
    } catch (error) {
      console.error('Error registering for notifications:', error);
    }
  };

  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <SubscriptionProvider>
      <StatusBar style="light" />
      <AppNavigator user={user} />
      <AlertHost />
    </SubscriptionProvider>
  );
}