import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth,
  getReactNativePersistence
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyDwTwPZvOvWJpzDvXg6JP7CNiQfB7HD2l8",
  authDomain: "expense-tracking-app-d96df.firebaseapp.com",
  projectId: "expense-tracking-app-d96df",
  storageBucket: "expense-tracking-app-d96df.firebasestorage.app",
  messagingSenderId: "21132781185",
  appId: "1:21132781185:web:45fd6cdddb938c4ca30f80"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore with cache settings
const db = getFirestore(app);

// Note: We're no longer using enableIndexedDbPersistence
// Instead, we'll configure cache settings when needed in the app
// For example, when initializing a collection reference:
// const collectionRef = collection(db, 'collection');
// collectionRef.settings({ cacheSizeBytes: CACHE_SIZE_UNLIMITED });

// Initialize Storage
const storage = getStorage(app);

export { auth, db, storage };
export default app; 