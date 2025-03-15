import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Platform } from 'react-native';
import {
  List,
  Switch,
  Button,
  Divider,
  Surface,
  Text,
  Portal,
  Modal,
  TextInput,
  Dialog,
  useTheme,
  ActivityIndicator,
  Snackbar,
} from 'react-native-paper';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import { useCurrency, availableCurrencies } from '../contexts/CurrencyContext';
import * as Haptics from 'expo-haptics';
import * as Updates from 'expo-updates';

const SettingsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { user, logout, updateUserProfile, reauthenticate } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [biometricAuth, setBiometricAuth] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrencyDialog, setShowCurrencyDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const { currency, changeCurrency } = useCurrency();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    checkBiometricAvailability();
    loadSettings();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setIsBiometricAvailable(compatible && enrolled);
      
      if (compatible && enrolled) {
        const savedBiometric = await AsyncStorage.getItem('biometricAuth');
        setBiometricAuth(savedBiometric === 'true');
      }
    } catch (error) {
      console.error('Error checking biometric availability:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const savedNotifications = await AsyncStorage.getItem('notifications');
      setNotifications(savedNotifications !== 'false');
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleExportData = async () => {
    try {
      setIsLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Fetch user data from Firebase
      const userData = {
        profile: {
          email: user.email,
          displayName: user.displayName,
          createdAt: user.metadata.creationTime,
        },
        settings: {
          notifications,
          biometricAuth,
          currency: currency.code,
        },
        // Add more data as needed
      };

      const fileUri = `${FileSystem.documentDirectory}finance_data_${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(userData, null, 2));

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Finance Data',
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCache = async () => {
    try {
      setIsLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Clear AsyncStorage
      await AsyncStorage.clear();
      
      // Clear FileSystem cache
      const cacheDir = FileSystem.cacheDirectory;
      if (cacheDir) {
        await FileSystem.deleteAsync(cacheDir, { idempotent: true });
      }

      Alert.alert('Success', 'Cache cleared successfully');
    } catch (error) {
      console.error('Clear cache error:', error);
      Alert.alert('Error', 'Failed to clear cache. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricToggle = async (value) => {
    try {
      if (value) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authenticate to enable biometric login',
          fallbackLabel: 'Use password',
        });

        if (result.success) {
          setBiometricAuth(true);
          await AsyncStorage.setItem('biometricAuth', 'true');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          setBiometricAuth(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      } else {
        setBiometricAuth(false);
        await AsyncStorage.setItem('biometricAuth', 'false');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Biometric toggle error:', error);
      Alert.alert('Error', 'Failed to update biometric settings');
    }
  };

  const handleNotificationsToggle = async (value) => {
    try {
      setNotifications(value);
      await AsyncStorage.setItem('notifications', value.toString());
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Notifications toggle error:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      setIsLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Reauthenticate user
      const credential = auth.EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticate(credential);

      // Update password
      await user.updatePassword(newPassword);

      Alert.alert('Success', 'Password updated successfully');
      setShowChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Password change error:', error);
      Alert.alert('Error', error.message || 'Failed to update password');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

              // Reauthenticate before deletion
              const credential = auth.EmailAuthProvider.credential(
                user.email,
                currentPassword
              );
              await reauthenticate(credential);

              // Delete user data from AsyncStorage
              await AsyncStorage.clear();

              // Delete user account
              await user.delete();

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              console.error('Account deletion error:', error);
              Alert.alert('Error', error.message || 'Failed to delete account');
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSignOut = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await logout();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert('Error', 'Failed to sign out');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const checkForUpdates = async () => {
    try {
      setIsLoading(true);
      
      // Skip update check in development
      if (__DEV__) {
        setSnackbarMessage('Update checking is only available in production builds');
        setSnackbarVisible(true);
        setIsLoading(false);
        return;
      }
      
      const update = await Updates.checkForUpdateAsync();
      
      if (update.isAvailable) {
        setSnackbarMessage('Update found! Downloading...');
        setSnackbarVisible(true);
        
        await Updates.fetchUpdateAsync();
        
        setSnackbarMessage('Update downloaded! Restarting app...');
        setSnackbarVisible(true);
        
        // Give time for the user to see the message
        setTimeout(async () => {
          await Updates.reloadAsync();
        }, 2000);
      } else {
        setSnackbarMessage('You already have the latest version');
        setSnackbarVisible(true);
      }
    } catch (error) {
      console.log('Error checking for updates:', error);
      setSnackbarMessage('Error checking for updates');
      setSnackbarVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      <Surface style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Account Settings</Text>
        <List.Item
          title="Email"
          description={user?.email}
          left={(props) => <List.Icon {...props} icon="email" />}
        />
        <Divider />
        <List.Item
          title="Change Password"
          left={(props) => <List.Icon {...props} icon="key" />}
          onPress={() => setShowChangePassword(true)}
        />
        <Divider />
        <List.Item
          title="Delete Account"
          left={(props) => <List.Icon {...props} icon="delete" />}
          onPress={handleDeleteAccount}
        />
      </Surface>

      <Surface style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>App Settings</Text>
        <List.Item
          title="Notifications"
          description="Enable push notifications"
          left={(props) => <List.Icon {...props} icon="bell" color={colors.primary} />}
          right={() => (
            <Switch
              value={notifications}
              onValueChange={handleNotificationsToggle}
              color={colors.primary}
            />
          )}
        />
        <Divider />
        <List.Item
          title="Biometric Authentication"
          description="Use fingerprint or face ID to login"
          left={(props) => <List.Icon {...props} icon="fingerprint" color={colors.primary} />}
          right={() => (
            <Switch
              value={biometricAuth}
              onValueChange={handleBiometricToggle}
              color={colors.primary}
              disabled={!isBiometricAvailable}
            />
          )}
        />
        <Divider />
        <List.Item
          title="Currency"
          description={`Current: ${currency.code} (${currency.symbol})`}
          left={(props) => <List.Icon {...props} icon="currency-usd" color={colors.primary} />}
          onPress={() => setShowCurrencyDialog(true)}
          right={props => <MaterialIcons name="chevron-right" size={24} color={colors.text} />}
        />
        <Divider />
        <List.Item
          title="Check for Updates"
          description="Get the latest version of the app"
          left={(props) => <List.Icon {...props} icon="update" color={colors.primary} />}
          onPress={checkForUpdates}
          right={props => <MaterialIcons name="chevron-right" size={24} color={colors.text} />}
        />
      </Surface>

      <Surface style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Data Management</Text>
        <List.Item
          title="Export Data"
          description="Download your data as JSON"
          left={(props) => <List.Icon {...props} icon="download" color={colors.primary} />}
          onPress={handleExportData}
        />
        <Divider />
        <List.Item
          title="Clear Cache"
          description="Free up space by clearing cached data"
          left={(props) => <List.Icon {...props} icon="trash-can" color={colors.primary} />}
          onPress={handleClearCache}
        />
      </Surface>

      <Surface style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>About</Text>
        <List.Item
          title="Version"
          description="1.0.0"
          left={(props) => <List.Icon {...props} icon="information" color={colors.primary} />}
        />
        <Divider />
        <List.Item
          title="Terms of Service"
          left={(props) => <List.Icon {...props} icon="file-document" color={colors.primary} />}
          onPress={() => navigation.navigate('Terms')}
        />
        <Divider />
        <List.Item
          title="Privacy Policy"
          left={(props) => <List.Icon {...props} icon="shield" color={colors.primary} />}
          onPress={() => navigation.navigate('Privacy')}
        />
      </Surface>

      <Button
        mode="contained"
        onPress={handleSignOut}
        style={styles.signOutButton}
      >
        Sign Out
      </Button>

      {/* Currency Selection Dialog */}
      <Portal>
        <Dialog visible={showCurrencyDialog} onDismiss={() => setShowCurrencyDialog(false)}>
          <Dialog.Title>Select Currency</Dialog.Title>
          <Dialog.Content>
            <ScrollView style={{ maxHeight: 300 }}>
              {availableCurrencies.map((curr) => (
                <TouchableOpacity
                  key={curr.code}
                  style={[
                    styles.currencyOption,
                    currency.code === curr.code && { backgroundColor: colors.primary + '20' }
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    changeCurrency(curr);
                    setShowCurrencyDialog(false);
                  }}
                >
                  <Text style={{ fontWeight: currency.code === curr.code ? 'bold' : 'normal' }}>
                    {curr.code} - {curr.name} ({curr.symbol})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowCurrencyDialog(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Change Password Modal */}
      <Portal>
        <Modal
          visible={showChangePassword}
          onDismiss={() => setShowChangePassword(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>Change Password</Text>
          <TextInput
            label="Current Password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            style={styles.input}
            mode="outlined"
            error={!currentPassword}
          />
          <TextInput
            label="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            style={styles.input}
            mode="outlined"
            error={newPassword.length > 0 && newPassword.length < 6}
          />
          <TextInput
            label="Confirm New Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            style={styles.input}
            mode="outlined"
            error={confirmPassword.length > 0 && newPassword !== confirmPassword}
          />
          <Button
            mode="contained"
            onPress={handleChangePassword}
            style={styles.modalButton}
            loading={isLoading}
            disabled={isLoading}
          >
            Update Password
          </Button>
        </Modal>
      </Portal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  section: {
    margin: 16,
    borderRadius: 16,
    elevation: 4,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    padding: 16,
  },
  signOutButton: {
    margin: 16,
  },
  modal: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    marginBottom: 16,
  },
  modalButton: {
    marginTop: 8,
  },
  currencyOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});

export default SettingsScreen; 