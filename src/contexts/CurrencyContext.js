import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Available currencies
export const availableCurrencies = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
];

// Default currency is Indian Rupee
const DEFAULT_CURRENCY = availableCurrencies[0]; // INR
const STORAGE_KEY = '@finance_app_currency';

// Create context
const CurrencyContext = createContext();

// Custom hook to use the currency context
export const useCurrency = () => useContext(CurrencyContext);

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [loading, setLoading] = useState(true);

  // Load saved currency from AsyncStorage
  const loadSavedCurrency = async () => {
    try {
      const savedCurrency = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedCurrency) {
        setCurrency(JSON.parse(savedCurrency));
      }
    } catch (error) {
      console.error('Error loading saved currency:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save currency to AsyncStorage
  const saveCurrency = async (currencyToSave) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(currencyToSave));
    } catch (error) {
      console.error('Error saving currency:', error);
    }
  };

  // Change currency
  const changeCurrency = (newCurrency) => {
    setCurrency(newCurrency);
    saveCurrency(newCurrency);
  };

  // Format amount with the selected currency
  const formatAmount = (amount) => {
    try {
      if (amount === undefined || amount === null) return `${currency.symbol}0.00`;
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount)) return `${currency.symbol}0.00`;
      
      return `${currency.symbol}${parsedAmount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    } catch (error) {
      console.error('Error formatting amount:', error);
      return `${currency.symbol}0.00`;
    }
  };

  // Load saved currency when component mounts
  useEffect(() => {
    loadSavedCurrency();
  }, []);

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        changeCurrency,
        formatAmount,
        loading,
        availableCurrencies,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}; 