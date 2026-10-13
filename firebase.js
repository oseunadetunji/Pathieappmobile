import { initializeApp, getApps, getApp } from 'firebase/app';
import { Platform } from 'react-native';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDE1-GkUbENUYE8OekVkP7QQzpRs0mbFcs",
  authDomain: "pathie-398b0.firebaseapp.com",
  projectId: "pathie-398b0",
  storageBucket: "pathie-398b0.firebasestorage.app",
  messagingSenderId: "100948176658",
  appId: "1:100948176658:web:0cf0a86085eadd58c43817",
  measurementId: "G-zFGJ02M6YH"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Web uses default persistence; native needs AsyncStorage-backed persistence
const auth = Platform.OS === 'web'
  ? getAuth(app)
  : initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });

const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app, 'us-central1');

export { auth, db, storage, functions };