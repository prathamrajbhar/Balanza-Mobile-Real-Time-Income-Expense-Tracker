import React, { createContext, useState, useContext, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../services/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { Alert, Platform } from 'react-native';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const USER_PERSISTENCE_KEY = '@user_persistence';
const USER_SETTINGS_KEY = '@user_settings';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Load persisted user settings
  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        const settings = await AsyncStorage.getItem(USER_SETTINGS_KEY);
        if (settings) {
          // Apply user settings (theme, notifications, etc.)
          const parsedSettings = JSON.parse(settings);
          // You can add logic here to apply settings
        }
      } catch (error) {
        console.error('Error loading user settings:', error);
      }
    };

    loadUserSettings();
  }, []);

  // Handle auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // Get additional user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data() || {};
          
          // Combine auth user with additional data
          const enrichedUser = {
            ...user,
            ...userData,
          };
          
          setUser(enrichedUser);
          await AsyncStorage.setItem(USER_PERSISTENCE_KEY, JSON.stringify(enrichedUser));
        } else {
          setUser(null);
          await AsyncStorage.removeItem(USER_PERSISTENCE_KEY);
        }
      } catch (error) {
        console.error('Error handling auth state change:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const signup = async (email, password, displayName) => {
    try {
      setError(null);
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile
      await updateProfile(user, { displayName });
      
      // Send email verification
      await sendEmailVerification(user);
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email,
        displayName,
        createdAt: new Date().toISOString(),
        settings: {
          theme: 'light',
          notifications: true,
        }
      });

      return user;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const login = async (email, password, rememberMe = false) => {
    try {
      setError(null);
      
      // Set the appropriate persistence based on rememberMe
      if (Platform.OS === 'web') {
        // Only for web platforms
        const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
        await setPersistence(auth, persistenceType);
      }
      
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      
      // Store user settings in AsyncStorage
      if (rememberMe) {
        await AsyncStorage.setItem(USER_SETTINGS_KEY, JSON.stringify({
          rememberMe: true,
          lastLogin: new Date().toISOString(),
          email: email // Store email for convenience
        }));
      } else {
        // Clear any previous remember me settings
        await AsyncStorage.removeItem(USER_SETTINGS_KEY);
      }
      
      // Update last login time in Firestore
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
          lastLogin: serverTimestamp()
        }, { merge: true });
      } catch (firestoreError) {
        console.warn('Failed to update last login time:', firestoreError);
        // Non-critical error, don't throw
      }

      return user;
    } catch (error) {
      console.error('Login error:', error);
      
      // Provide more user-friendly error messages
      let errorMessage = 'An error occurred during login. Please try again.';
      
      switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed login attempts. Please try again later or reset your password.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email format. Please enter a valid email address.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled. Please contact support.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection and try again.';
          break;
        default:
          errorMessage = error.message || 'An error occurred during login. Please try again.';
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
      await AsyncStorage.removeItem(USER_PERSISTENCE_KEY);
      await AsyncStorage.removeItem(USER_SETTINGS_KEY);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const resetPassword = async (email) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const updateUserProfile = async (updates) => {
    try {
      setError(null);
      await updateProfile(auth.currentUser, updates);
      
      // Update Firestore user document
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        ...updates,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Update local user state
      setUser(prevUser => ({
        ...prevUser,
        ...updates
      }));
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    error,
    signup,
    login,
    logout,
    resetPassword,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 