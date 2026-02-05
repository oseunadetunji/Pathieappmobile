// Using Firebase v9 compat mode for React Native compatibility
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDE1-GkUbENUYE8OekVkP7QQzpRs0mbFcs",
  authDomain: "pathie-398b0.firebaseapp.com",
  projectId: "pathie-398b0",
  storageBucket: "pathie-398b0.firebasestorage.app",
  messagingSenderId: "100948176658",
  appId: "1:100948176658:web:0cf0a86085eadd58c43817",
  measurementId: "G-zFGJ02M6YH"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

export { auth, db, storage };
