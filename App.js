import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { 
  Provider as PaperProvider, 
  DefaultTheme as PaperDefaultTheme
} from 'react-native-paper';
import { 
  DefaultTheme as NavigationDefaultTheme
} from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import merge from 'deepmerge';
import * as Updates from 'expo-updates';

// Contexts
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { TransactionProvider } from './src/contexts/TransactionContext';
import { CurrencyProvider } from './src/contexts/CurrencyContext';
import { BudgetProvider } from './src/contexts/BudgetContext';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import DrawerNavigator from './src/navigation/DrawerNavigator';
import AddTransactionScreen from './src/screens/AddTransactionScreen';
import TransactionDetailScreen from './src/screens/TransactionDetailScreen';

// Create custom theme
const CustomDefaultTheme = merge(PaperDefaultTheme, NavigationDefaultTheme);

const appTheme = {
  ...CustomDefaultTheme,
  colors: {
    ...CustomDefaultTheme.colors,
    primary: '#4CAF50',
    accent: '#7B68EE',
    background: '#F6F8FA',
    surface: '#FFFFFF',
    text: '#333333',
    error: '#FF5252',
    success: '#4CAF50',
    warning: '#FFC107',
    info: '#2196F3',
  },
};

const Stack = createStackNavigator();

// Add update checking function
async function checkForUpdates() {
  try {
    // Skip update check in development
    if (__DEV__) {
      console.log('Skipping update check in development');
      return false;
    }
    
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
      return true;
    }
    return false;
  } catch (error) {
    console.log('Error checking for updates:', error);
    return false;
  }
}

const AppContent = () => {
  const { user } = useAuth();
  const theme = appTheme;

  useEffect(() => {
    // Auto-check for updates on app start
    checkForUpdates();
  }, []);

  return (
    <PaperProvider theme={theme}>
      <StatusBar 
        barStyle={'dark-content'} 
        backgroundColor={theme.colors.background} 
      />
      <NavigationContainer theme={theme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {user ? (
            <>
              <Stack.Screen name="Main" component={DrawerNavigator} />
              <Stack.Screen 
                name="AddTransaction" 
                component={AddTransactionScreen} 
                options={{
                  headerShown: true,
                  title: 'Add Transaction',
                  headerStyle: {
                    backgroundColor: theme.colors.primary,
                  },
                  headerTintColor: '#fff',
                }}
              />
              <Stack.Screen 
                name="TransactionDetail" 
                component={TransactionDetailScreen} 
                options={{
                  headerShown: false,
                }}
              />
            </>
          ) : (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Signup" component={SignupScreen} />
              <Stack.Screen 
                name="ForgotPassword" 
                component={ForgotPasswordScreen}
                options={{
                  headerShown: true,
                  title: 'Reset Password',
                  headerStyle: {
                    backgroundColor: theme.colors.primary,
                  },
                  headerTintColor: '#fff',
                }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
};

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <CurrencyProvider>
            <TransactionProvider>
              <BudgetProvider>
                <AppContent />
              </BudgetProvider>
            </TransactionProvider>
          </CurrencyProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;