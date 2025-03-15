import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTransactions } from './TransactionContext';
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
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../services/firebase';

const BudgetContext = createContext();

export const useBudget = () => useContext(BudgetContext);

export const BudgetProvider = ({ children }) => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { transactions } = useTransactions();
  const user = auth.currentUser;

  // Load budgets from Firestore
  const loadBudgets = async () => {
    try {
      setLoading(true);
      if (!user) {
        setLoading(false);
        return;
      }

      const budgetsRef = collection(db, 'users', user.uid, 'budgets');
      const budgetsQuery = query(budgetsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(budgetsQuery);
      
      const loadedBudgets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        amount: parseFloat(doc.data().amount),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));
      
      setBudgets(loadedBudgets);
    } catch (error) {
      console.error('Error loading budgets:', error);
      Alert.alert('Error', 'Failed to load budgets');
    } finally {
      setLoading(false);
    }
  };

  // Add a new budget
  const addBudget = async (budgetData) => {
    try {
      if (!user) {
        Alert.alert('Error', 'You must be logged in to create a budget');
        return;
      }

      const newBudget = {
        ...budgetData,
        amount: parseFloat(budgetData.amount),
        spent: 0,
        createdAt: serverTimestamp(),
        userId: user.uid,
      };

      const budgetsRef = collection(db, 'users', user.uid, 'budgets');
      const docRef = await addDoc(budgetsRef, newBudget);
      
      // Add the new budget to state with a JavaScript Date for createdAt
      setBudgets(prevBudgets => [
        { 
          id: docRef.id, 
          ...newBudget,
          createdAt: new Date() // Use JS Date for the UI since serverTimestamp() is null until written to Firestore
        },
        ...prevBudgets
      ]);

      return docRef.id;
    } catch (error) {
      console.error('Error adding budget:', error);
      Alert.alert('Error', 'Failed to add budget');
      return null;
    }
  };

  // Update an existing budget
  const updateBudget = async (budgetId, budgetData) => {
    try {
      if (!user) {
        Alert.alert('Error', 'You must be logged in to update a budget');
        return false;
      }

      const updatedBudget = {
        ...budgetData,
        amount: parseFloat(budgetData.amount),
        updatedAt: serverTimestamp(),
      };

      const budgetRef = doc(db, 'users', user.uid, 'budgets', budgetId);
      await updateDoc(budgetRef, updatedBudget);
      
      setBudgets(prevBudgets => 
        prevBudgets.map(budget => 
          budget.id === budgetId 
            ? { 
                ...budget, 
                ...updatedBudget,
                updatedAt: new Date() // Use JS Date for the UI
              } 
            : budget
        )
      );

      return true;
    } catch (error) {
      console.error('Error updating budget:', error);
      Alert.alert('Error', 'Failed to update budget');
      return false;
    }
  };

  // Delete a budget
  const deleteBudget = async (budgetId) => {
    try {
      if (!user) {
        Alert.alert('Error', 'You must be logged in to delete a budget');
        return false;
      }

      const budgetRef = doc(db, 'users', user.uid, 'budgets', budgetId);
      await deleteDoc(budgetRef);
      
      setBudgets(prevBudgets => 
        prevBudgets.filter(budget => budget.id !== budgetId)
      );

      return true;
    } catch (error) {
      console.error('Error deleting budget:', error);
      Alert.alert('Error', 'Failed to delete budget');
      return false;
    }
  };

  // Calculate spending for each budget based on transactions
  const calculateBudgetSpending = () => {
    if (!budgets.length || !transactions.length) return;

    const updatedBudgets = budgets.map(budget => {
      // Get current month start and end dates
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      
      // Filter transactions by category and date range
      const relevantTransactions = transactions.filter(transaction => {
        const transactionDate = transaction.date instanceof Date 
          ? transaction.date 
          : transaction.date?.toDate?.() 
          ? transaction.date.toDate() 
          : new Date(transaction.date);

        return (
          transaction.type === 'expense' &&
          transaction.category.toLowerCase() === budget.category.toLowerCase() &&
          transactionDate >= monthStart &&
          transactionDate <= monthEnd
        );
      });
      
      // Calculate total spent
      const spent = relevantTransactions.reduce((total, transaction) => {
        const amount = typeof transaction.amount === 'string' 
          ? parseFloat(transaction.amount) 
          : transaction.amount;
        return total + (isNaN(amount) ? 0 : amount);
      }, 0);

      // Update budget in Firestore with new spent amount
      const budgetRef = doc(db, 'users', user.uid, 'budgets', budget.id);
      updateDoc(budgetRef, { 
        spent,
        lastCalculated: serverTimestamp()
      }).catch(error => {
        console.error('Error updating budget spent amount:', error);
      });
      
      return {
        ...budget,
        spent,
        remaining: budget.amount - spent,
        progress: spent / budget.amount,
        lastCalculated: new Date()
      };
    });
    
    setBudgets(updatedBudgets);
  };

  // Load budgets when component mounts or user changes
  useEffect(() => {
    if (user) {
      loadBudgets();
    } else {
      setBudgets([]);
      setLoading(false);
    }
  }, [user]);

  // Recalculate budget spending when transactions or budgets change
  useEffect(() => {
    if (budgets.length && transactions.length) {
      calculateBudgetSpending();
    }
  }, [transactions, budgets.length]);

  return (
    <BudgetContext.Provider
      value={{
        budgets,
        loading,
        addBudget,
        updateBudget,
        deleteBudget,
        loadBudgets,
        calculateBudgetSpending,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
}; 