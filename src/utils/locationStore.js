import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc, deleteField } from 'firebase/firestore';
import { auth, db } from '../../firebase';

// The parent's search location. Kept on the device for speed and in their account
// (users/{uid}.location) so it follows them to a new phone or browser.
const KEY = 'userLocation';

export async function saveLocation(locationData) {
  await AsyncStorage.setItem(KEY, JSON.stringify(locationData));
  try {
    const uid = auth.currentUser?.uid;
    if (uid) await setDoc(doc(db, 'users', uid), { location: locationData }, { merge: true });
  } catch (e) {
    console.warn('Could not sync location to account:', e?.message);
  }
}

export async function getLocation() {
  try {
    const local = await AsyncStorage.getItem(KEY);
    if (local) return JSON.parse(local);
    const uid = auth.currentUser?.uid;
    if (!uid) return null;
    const snap = await getDoc(doc(db, 'users', uid));
    const remote = snap.exists() ? snap.data().location : null;
    if (remote && typeof remote.latitude === 'number') {
      await AsyncStorage.setItem(KEY, JSON.stringify(remote));
      return remote;
    }
  } catch (e) {
    console.warn('Could not load location:', e?.message);
  }
  return null;
}

export async function clearLocation() {
  await AsyncStorage.removeItem(KEY);
  try {
    const uid = auth.currentUser?.uid;
    if (uid) await setDoc(doc(db, 'users', uid), { location: deleteField() }, { merge: true });
  } catch (e) {
    console.warn('Could not clear synced location:', e?.message);
  }
}
