import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Platform,
  Alert,
  StatusBar,
  KeyboardAvoidingView
} from 'react-native';
import {
  Surface,
  Text,
  useTheme,
  Button,
  IconButton,
  TextInput,
  Avatar,
  Divider,
  Switch,
  Dialog,
  Portal,
  Card,
  HelperText,
  Menu
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';

const ProfileScreen = ({ navigation }) => {
  const theme = useTheme();
  const { user, updateUserProfile, resetPassword } = useAuth();
  
  // Basic user info
  const [name, setName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  
  // Additional user info
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState(user?.location || '');
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth ? new Date(user.dateOfBirth) : null);
  const [occupation, setOccupation] = useState(user?.occupation || '');
  const [website, setWebsite] = useState(user?.website || '');
  
  // UI state
  const [editing, setEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Form state
  const [profileImage, setProfileImage] = useState(null);
  
  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Define consistent colors
  const colors = {
    text: '#000000',
    textSecondary: '#666666',
    border: '#E0E0E0',
    primary: theme.colors.primary,
    iconColor: '#666666'
  };

  React.useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handlePickImage = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
        return;
      }
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      // Validate inputs
      const validationErrors = {};
      
      if (!name.trim()) {
        validationErrors.name = 'Name is required';
      }
      
      if (website && !isValidUrl(website)) {
        validationErrors.website = 'Please enter a valid URL';
      }
      
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setLoading(false);
        return;
      }
      
      // Prepare data for Firebase
      const updates = {
        displayName: name,
        photoURL: profileImage || user?.photoURL,
        // Additional user data
        bio,
        location,
        dateOfBirth: dateOfBirth ? dateOfBirth.toISOString() : null,
        occupation,
        website,
        // Add timestamp for when profile was last updated
        lastUpdated: new Date().toISOString()
      };
      
      await updateUserProfile(updates);
      setEditing(false);
      setErrors({});
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      await resetPassword(user.email);
      Alert.alert('Success', 'Password reset email sent. Please check your inbox.');
      setShowPasswordModal(false);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };
  
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDateOfBirth(selectedDate);
    }
  };
  
  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };
  
  const formatDate = (date) => {
    if (!date) return 'Not set';
    return date.toLocaleDateString();
  };

  // Animation styles
  const animatedStyle = {
    opacity: fadeAnim,
    transform: [{ translateY: slideAnim }]
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={editing ? handlePickImage : null}
            disabled={!editing}
            style={styles.avatarWrapper}
          >
            <Avatar.Image
              source={
                profileImage
                  ? { uri: profileImage }
                  : user?.photoURL
                    ? { uri: user.photoURL }
                    : require('../assets/default-avatar.png')
              }
              size={90}
              style={styles.avatar}
            />
            {editing && (
              <View style={styles.editAvatarButton}>
                <Icon name="camera" size={16} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
          
          {!editing && (
            <Text style={styles.userName}>
              {user?.displayName || 'User'}
            </Text>
          )}
        </View>

        <Animated.View style={[animatedStyle, styles.profileContainer]}>
          <Card style={styles.profileCard}>
            {editing ? (
              <Card.Content style={styles.editForm}>
                <Text style={styles.sectionTitle}>Edit Profile</Text>
                
                <TextInput
                  label="Full Name"
                  value={name}
                  onChangeText={setName}
                  mode="outlined"
                  style={styles.input}
                  error={!!errors.name}
                  theme={{ 
                    roundness: 8,
                    colors: { 
                      primary: colors.primary,
                      text: colors.text,
                      placeholder: colors.textSecondary,
                    }
                  }}
                  left={<TextInput.Icon icon="account" color={colors.iconColor} />}
                />
                {errors.name && <HelperText type="error">{errors.name}</HelperText>}
                
                <TextInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  mode="outlined"
                  style={styles.input}
                  disabled={true}
                  theme={{ 
                    roundness: 8,
                    colors: { 
                      primary: colors.primary,
                      text: colors.text,
                      placeholder: colors.textSecondary,
                    }
                  }}
                  left={<TextInput.Icon icon="email" color={colors.iconColor} />}
                />
                
                <TextInput
                  label="Phone Number"
                  value={phone}
                  onChangeText={setPhone}
                  mode="outlined"
                  style={styles.input}
                  keyboardType="phone-pad"
                  theme={{ 
                    roundness: 8,
                    colors: { 
                      primary: colors.primary,
                      text: colors.text,
                      placeholder: colors.textSecondary,
                    }
                  }}
                  left={<TextInput.Icon icon="phone" color={colors.iconColor} />}
                />
                
                <TextInput
                  label="Bio"
                  value={bio}
                  onChangeText={setBio}
                  mode="outlined"
                  style={styles.input}
                  multiline
                  numberOfLines={3}
                  theme={{ 
                    roundness: 8,
                    colors: { 
                      primary: colors.primary,
                      text: colors.text,
                      placeholder: colors.textSecondary,
                    }
                  }}
                  left={<TextInput.Icon icon="text" color={colors.iconColor} />}
                />
                
                <TextInput
                  label="Location"
                  value={location}
                  onChangeText={setLocation}
                  mode="outlined"
                  style={styles.input}
                  theme={{ 
                    roundness: 8,
                    colors: { 
                      primary: colors.primary,
                      text: colors.text,
                      placeholder: colors.textSecondary,
                    }
                  }}
                  left={<TextInput.Icon icon="map-marker" color={colors.iconColor} />}
                />
                
                <TouchableOpacity 
                  onPress={() => setShowDatePicker(true)}
                  style={styles.datePickerButton}
                >
                  <View style={styles.datePickerContainer}>
                    <Icon name="calendar" size={20} color={colors.iconColor} style={styles.dateIcon} />
                    <View>
                      <Text style={styles.datePickerLabel}>Date of Birth</Text>
                      <Text style={styles.datePickerValue}>
                        {dateOfBirth ? formatDate(dateOfBirth) : 'Select date'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
                
                {showDatePicker && (
                  <DateTimePicker
                    value={dateOfBirth || new Date()}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                  />
                )}
                
                <TextInput
                  label="Occupation"
                  value={occupation}
                  onChangeText={setOccupation}
                  mode="outlined"
                  style={styles.input}
                  theme={{ 
                    roundness: 8,
                    colors: { 
                      primary: colors.primary,
                      text: colors.text,
                      placeholder: colors.textSecondary,
                    }
                  }}
                  left={<TextInput.Icon icon="briefcase" color={colors.iconColor} />}
                />
                
                <TextInput
                  label="Website"
                  value={website}
                  onChangeText={setWebsite}
                  mode="outlined"
                  style={styles.input}
                  error={!!errors.website}
                  keyboardType="url"
                  theme={{ 
                    roundness: 8,
                    colors: { 
                      primary: colors.primary,
                      text: colors.text,
                      placeholder: colors.textSecondary,
                    }
                  }}
                  left={<TextInput.Icon icon="web" color={colors.iconColor} />}
                />
                {errors.website && <HelperText type="error">{errors.website}</HelperText>}
                
                <View style={styles.actionButtons}>
                  <Button
                    mode="outlined"
                    onPress={() => {
                      setEditing(false);
                      setErrors({});
                    }}
                    style={[styles.actionButton, styles.cancelButton]}
                    labelStyle={{ color: colors.textSecondary }}
                    contentStyle={{ height: 44 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleSaveProfile}
                    loading={loading}
                    style={[styles.actionButton]}
                    contentStyle={{ height: 44 }}
                    labelStyle={{ fontWeight: '600' }}
                  >
                    Save Changes
                  </Button>
                </View>
              </Card.Content>
            ) : (
              <Card.Content>
                <Text style={styles.sectionTitle}>Personal Information</Text>
                
                <View style={styles.infoSection}>
                  <View style={styles.infoItem}>
                    <Icon name="email-outline" size={20} color={colors.iconColor} style={styles.infoIcon} />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>
                        Email Address
                      </Text>
                      <Text style={styles.infoValue}>
                        {user?.email || 'Not set'}
                      </Text>
                    </View>
                  </View>
                  
                  <Divider style={styles.itemDivider} />
                  
                  <View style={styles.infoItem}>
                    <Icon name="phone-outline" size={20} color={colors.iconColor} style={styles.infoIcon} />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>
                        Phone Number
                      </Text>
                      <Text style={styles.infoValue}>
                        {user?.phoneNumber || 'Not set'}
                      </Text>
                    </View>
                  </View>
                  
                  {user?.bio && (
                    <>
                      <Divider style={styles.itemDivider} />
                      <View style={styles.infoItem}>
                        <Icon name="text" size={20} color={colors.iconColor} style={styles.infoIcon} />
                        <View style={styles.infoContent}>
                          <Text style={styles.infoLabel}>
                            Bio
                          </Text>
                          <Text style={styles.infoValue}>
                            {user.bio}
                          </Text>
                        </View>
                      </View>
                    </>
                  )}
                  
                  {user?.location && (
                    <>
                      <Divider style={styles.itemDivider} />
                      <View style={styles.infoItem}>
                        <Icon name="map-marker-outline" size={20} color={colors.iconColor} style={styles.infoIcon} />
                        <View style={styles.infoContent}>
                          <Text style={styles.infoLabel}>
                            Location
                          </Text>
                          <Text style={styles.infoValue}>
                            {user.location}
                          </Text>
                        </View>
                      </View>
                    </>
                  )}
                  
                  {user?.dateOfBirth && (
                    <>
                      <Divider style={styles.itemDivider} />
                      <View style={styles.infoItem}>
                        <Icon name="calendar-outline" size={20} color={colors.iconColor} style={styles.infoIcon} />
                        <View style={styles.infoContent}>
                          <Text style={styles.infoLabel}>
                            Date of Birth
                          </Text>
                          <Text style={styles.infoValue}>
                            {new Date(user.dateOfBirth).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                    </>
                  )}
                  
                  {user?.occupation && (
                    <>
                      <Divider style={styles.itemDivider} />
                      <View style={styles.infoItem}>
                        <Icon name="briefcase-outline" size={20} color={colors.iconColor} style={styles.infoIcon} />
                        <View style={styles.infoContent}>
                          <Text style={styles.infoLabel}>
                            Occupation
                          </Text>
                          <Text style={styles.infoValue}>
                            {user.occupation}
                          </Text>
                        </View>
                      </View>
                    </>
                  )}
                  
                  {user?.website && (
                    <>
                      <Divider style={styles.itemDivider} />
                      <View style={styles.infoItem}>
                        <Icon name="web" size={20} color={colors.iconColor} style={styles.infoIcon} />
                        <View style={styles.infoContent}>
                          <Text style={styles.infoLabel}>
                            Website
                          </Text>
                          <Text style={[styles.infoValue, styles.linkText]}>
                            {user.website}
                          </Text>
                        </View>
                      </View>
                    </>
                  )}
                  
                  <Divider style={styles.itemDivider} />
                  
                  <View style={styles.infoItem}>
                    <Icon name="calendar-outline" size={20} color={colors.iconColor} style={styles.infoIcon} />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>
                        Member Since
                      </Text>
                      <Text style={styles.infoValue}>
                        {user?.metadata?.creationTime 
                          ? new Date(user.metadata.creationTime).toLocaleDateString() 
                          : 'Unknown'}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <Button
                  mode="contained"
                  onPress={() => setEditing(true)}
                  style={styles.editButton}
                  icon="account-edit-outline"
                  contentStyle={{ height: 44 }}
                  labelStyle={{ fontWeight: '600' }}
                >
                  Edit Profile
                </Button>
              </Card.Content>
            )}
          </Card>
        </Animated.View>

        <Animated.View style={[animatedStyle, { marginTop: 16 }]}>
          <Card style={styles.settingsCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>
                Account Settings
              </Text>
              
              <TouchableOpacity 
                style={styles.settingsItem}
                onPress={() => setShowPasswordModal(true)}
              >
                <View style={styles.settingsItemLeft}>
                  <Icon name="lock-outline" size={20} color={colors.iconColor} style={styles.settingsIcon} />
                  <Text style={styles.settingsItemText}>
                    Change Password
                  </Text>
                </View>
                <Icon name="chevron-right" size={20} color={colors.iconColor} />
              </TouchableOpacity>
              
              <Divider style={styles.settingsDivider} />
              
              <View style={styles.settingsItem}>
                <View style={styles.settingsItemLeft}>
                  <Icon name="bell-outline" size={20} color={colors.iconColor} style={styles.settingsIcon} />
                  <Text style={styles.settingsItemText}>
                    Push Notifications
                  </Text>
                </View>
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  color={colors.primary}
                />
              </View>
              
              <Divider style={styles.settingsDivider} />
              
              <TouchableOpacity style={styles.settingsItem}>
                <View style={styles.settingsItemLeft}>
                  <Icon name="shield-account-outline" size={20} color={colors.iconColor} style={styles.settingsIcon} />
                  <Text style={styles.settingsItemText}>
                    Privacy Settings
                  </Text>
                </View>
                <Icon name="chevron-right" size={20} color={colors.iconColor} />
              </TouchableOpacity>
              
              <Divider style={styles.settingsDivider} />
              
              <TouchableOpacity style={styles.settingsItem}>
                <View style={styles.settingsItemLeft}>
                  <Icon name="help-circle-outline" size={20} color={colors.iconColor} style={styles.settingsIcon} />
                  <Text style={styles.settingsItemText}>
                    Help & Support
                  </Text>
                </View>
                <Icon name="chevron-right" size={20} color={colors.iconColor} />
              </TouchableOpacity>
            </Card.Content>
          </Card>
        </Animated.View>
        
        <View style={styles.footer}>
          <TouchableOpacity>
            <Text style={styles.logoutText}>
              <Icon name="logout" size={16} color={colors.textSecondary} /> Log Out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Portal>
        <Dialog
          visible={showPasswordModal}
          onDismiss={() => setShowPasswordModal(false)}
          style={{ borderRadius: 12 }}
        >
          <Dialog.Title style={styles.dialogTitle}>
            Reset Password
          </Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogContent}>
              We'll send a password reset link to your email address:
            </Text>
            <Text style={styles.dialogEmail}>{user?.email}</Text>
          </Dialog.Content>
          <Dialog.Actions style={styles.dialogActions}>
            <Button 
              onPress={() => setShowPasswordModal(false)}
              labelStyle={{ color: colors.textSecondary }}
              style={styles.dialogButton}
            >
              Cancel
            </Button>
            <Button 
              mode="contained"
              onPress={handleResetPassword}
              style={[styles.dialogButton]}
            >
              Send Reset Link
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  avatarWrapper: {
    marginBottom: 8,
  },
  avatar: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#000000',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 8,
  },
  profileContainer: {
    marginTop: -20,
    marginHorizontal: 16,
  },
  profileCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000000',
  },
  infoSection: {
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoIcon: {
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  linkText: {
    color: '#1976D2',
    textDecorationLine: 'underline',
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  editButton: {
    borderRadius: 8,
    marginTop: 8,
  },
  editForm: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
  },
  datePickerButton: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    marginRight: 16,
  },
  datePickerLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  datePickerValue: {
    fontSize: 16,
    color: '#000000',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
  },
  cancelButton: {
    marginRight: 12,
    borderColor: '#E0E0E0',
  },
  settingsCard: {
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsIcon: {
    marginRight: 16,
  },
  settingsItemText: {
    fontSize: 16,
    color: '#000000',
  },
  settingsDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  footer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  logoutText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  dialogContent: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 8,
  },
  dialogEmail: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  dialogActions: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  dialogButton: {
    marginLeft: 8,
    borderRadius: 8,
  },
});

export default ProfileScreen; 