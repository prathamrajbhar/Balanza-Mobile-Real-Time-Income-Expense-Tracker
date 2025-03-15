import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp,
  serverTimestamp,
  enableNetwork,
  disableNetwork
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../services/firebase';
import { useAuth } from './AuthContext';
import { Alert, Platform } from 'react-native';

const TransactionContext = createContext();

export const useTransactions = () => useContext(TransactionContext);

export const TransactionProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const { user } = useAuth();

  // Handle online/offline state
  const goOffline = async () => {
    try {
      await disableNetwork(db);
      setIsOffline(true);
    } catch (error) {
      console.error('Error going offline:', error);
    }
  };

  const goOnline = async () => {
    try {
      await enableNetwork(db);
      setIsOffline(false);
    } catch (error) {
      console.error('Error going online:', error);
    }
  };

  useEffect(() => {
    if (user) {
      getTransactions();
    } else {
      setTransactions([]);
    }
  }, [user]);

  const getTransactions = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const transactionsRef = collection(db, 'users', user.uid, 'transactions');
      const q = query(transactionsRef, orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const transactionsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        // Handle date conversion safely
        let date;
        try {
          date = data.date?.toDate?.() || new Date(data.date);
        } catch (error) {
          console.warn('Date conversion error:', error);
          date = new Date(); // Fallback to current date
        }
        
        return {
          id: doc.id,
          ...data,
          date
        };
      });
      
      setTransactions(transactionsData);
      
      // If we successfully got data while offline, show a notification
      if (isOffline) {
        console.log('Viewing cached data while offline');
      }
    } catch (error) {
      console.error('Error getting transactions:', error);
      setError('Failed to load transactions. Please try again.');
      
      if (error.code === 'unavailable' && !isOffline) {
        console.log('Network error detected, switching to offline mode');
        setIsOffline(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (transactionData, receiptImage = null) => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Ensure date is properly formatted for Firestore
      let formattedDate;
      try {
        // Convert any date format to a JavaScript Date first
        const jsDate = new Date(transactionData.date);
        // Then convert to Firestore Timestamp
        formattedDate = Timestamp.fromDate(jsDate);
      } catch (error) {
        console.error('Error formatting date:', error);
        formattedDate = Timestamp.fromDate(new Date()); // Fallback to current date
      }
      
      // Format data for Firestore
      const formattedData = {
        ...transactionData,
        date: formattedDate,
        createdAt: serverTimestamp(),
        userId: user.uid
      };
      
      // Upload receipt image if provided
      if (receiptImage) {
        try {
          // Generate a unique filename since Expo ImagePicker doesn't provide a name
          const filename = `receipt_${Date.now()}.jpg`;
          const imageRef = ref(storage, `receipts/${user.uid}/${filename}`);
          
          // Get the image data as a blob
          const response = await fetch(receiptImage.uri);
          const blob = await response.blob();
          
          // Upload the image
          await uploadBytes(imageRef, blob);
          const downloadURL = await getDownloadURL(imageRef);
          
          formattedData.receiptUrl = downloadURL;
        } catch (error) {
          console.error('Error uploading receipt image:', error);
          // Continue without the receipt image if upload fails
          Alert.alert(
            'Image Upload Failed',
            'Your transaction will be saved without the receipt image.'
          );
        }
      }
      
      // Add transaction to Firestore
      const transactionsRef = collection(db, 'users', user.uid, 'transactions');
      const docRef = await addDoc(transactionsRef, formattedData);
      
      // Add to local state with JavaScript Date for UI
      const newTransaction = {
        id: docRef.id,
        ...formattedData,
        date: new Date(transactionData.date) // Use JavaScript Date for UI
      };
      
      setTransactions(prevTransactions => [newTransaction, ...prevTransactions]);
      
      return newTransaction;
    } catch (error) {
      console.error('Error adding transaction:', error);
      setError('Failed to add transaction. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateTransaction = async (id, transactionData, receiptImage = null) => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Ensure date is properly formatted for Firestore
      let formattedDate;
      try {
        // Convert any date format to a JavaScript Date first
        const jsDate = new Date(transactionData.date);
        // Then convert to Firestore Timestamp
        formattedDate = Timestamp.fromDate(jsDate);
      } catch (error) {
        console.error('Error formatting date:', error);
        formattedDate = Timestamp.fromDate(new Date()); // Fallback to current date
      }
      
      // Format data for Firestore
      const formattedData = {
        ...transactionData,
        date: formattedDate,
        updatedAt: serverTimestamp()
      };
      
      // Upload new receipt image if provided
      if (receiptImage) {
        try {
          // Delete old receipt if exists
          const oldTransaction = transactions.find(t => t.id === id);
          if (oldTransaction?.receiptUrl) {
            try {
              const oldImageRef = ref(storage, oldTransaction.receiptUrl);
              await deleteObject(oldImageRef);
            } catch (deleteError) {
              console.error('Error deleting old receipt:', deleteError);
              // Continue even if old image deletion fails
            }
          }
          
          // Generate a unique filename since Expo ImagePicker doesn't provide a name
          const filename = `receipt_${Date.now()}.jpg`;
          const imageRef = ref(storage, `receipts/${user.uid}/${filename}`);
          
          // Get the image data as a blob
          const response = await fetch(receiptImage.uri);
          const blob = await response.blob();
          
          // Upload the image
          await uploadBytes(imageRef, blob);
          const downloadURL = await getDownloadURL(imageRef);
          
          formattedData.receiptUrl = downloadURL;
        } catch (error) {
          console.error('Error uploading receipt image:', error);
          // Continue without the receipt image if upload fails
          Alert.alert(
            'Image Upload Failed',
            'Your transaction will be updated without the new receipt image.'
          );
        }
      }
      
      // Update transaction in Firestore
      const transactionRef = doc(db, 'users', user.uid, 'transactions', id);
      await updateDoc(transactionRef, formattedData);
      
      // Update local state with JavaScript Date for UI
      setTransactions(prevTransactions => 
        prevTransactions.map(transaction => 
          transaction.id === id 
            ? { 
                ...transaction, 
                ...formattedData, 
                date: new Date(transactionData.date) // Use JavaScript Date for UI
              } 
            : transaction
        )
      );
      
      return { id, ...formattedData, date: new Date(transactionData.date) };
    } catch (error) {
      console.error('Error updating transaction:', error);
      setError('Failed to update transaction. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteTransaction = async (id) => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Delete receipt image if exists
      const transaction = transactions.find(t => t.id === id);
      if (transaction?.receiptUrl) {
        try {
          const imageRef = ref(storage, transaction.receiptUrl);
          await deleteObject(imageRef);
        } catch (error) {
          console.error('Error deleting receipt:', error);
        }
      }
      
      // Delete transaction from Firestore
      const transactionRef = doc(db, 'users', user.uid, 'transactions', id);
      await deleteDoc(transactionRef);
      
      // Update local state
      setTransactions(prevTransactions => 
        prevTransactions.filter(transaction => transaction.id !== id)
      );
      
      return id;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      setError('Failed to delete transaction. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getTransactionsByCategory = async (category) => {
    if (!user) return [];
    
    setLoading(true);
    setError(null);
    
    try {
      const transactionsRef = collection(db, 'users', user.uid, 'transactions');
      const q = query(
        transactionsRef, 
        where('category', '==', category),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate?.() || new Date(doc.data().date)
      }));
    } catch (error) {
      console.error('Error getting transactions by category:', error);
      setError('Failed to load transactions. Please try again.');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getTransactionsByDateRange = async (startDate, endDate) => {
    if (!user) return [];
    
    setLoading(true);
    setError(null);
    
    try {
      const transactionsRef = collection(db, 'users', user.uid, 'transactions');
      const q = query(
        transactionsRef, 
        where('date', '>=', Timestamp.fromDate(new Date(startDate))),
        where('date', '<=', Timestamp.fromDate(new Date(endDate))),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate?.() || new Date(doc.data().date)
      }));
    } catch (error) {
      console.error('Error getting transactions by date range:', error);
      setError('Failed to load transactions. Please try again.');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getTransactionsByType = async (type) => {
    if (!user) return [];
    
    setLoading(true);
    setError(null);
    
    try {
      const transactionsRef = collection(db, 'users', user.uid, 'transactions');
      const q = query(
        transactionsRef, 
        where('type', '==', type),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate?.() || new Date(doc.data().date)
      }));
    } catch (error) {
      console.error('Error getting transactions by type:', error);
      setError('Failed to load transactions. Please try again.');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const value = {
    transactions,
    loading,
    error,
    isOffline,
    getTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionsByCategory,
    getTransactionsByDateRange,
    getTransactionsByType,
    goOnline,
    goOffline
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};

export default TransactionContext; 