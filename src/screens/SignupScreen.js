import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  Dimensions,
  Animated,
  TouchableOpacity,
  StatusBar,
  Image
} from 'react-native';
import { 
  TextInput, 
  Button, 
  Surface, 
  Text, 
  useTheme,
  IconButton,
  Divider,
  ActivityIndicator,
  Dialog,
  Portal
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');
const LOGO_SIZE = width * 0.3;

const SignupScreen = ({ navigation }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const logoAnimation = useRef(new Animated.Value(0)).current;
  const formAnimation = useRef(new Animated.Value(0)).current;
  const lottieRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [secureConfirmTextEntry, setSecureConfirmTextEntry] = useState(true);
  const [showSocialSignupDialog, setShowSocialSignupDialog] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  
  const { signup, error: authError } = useAuth();

  useEffect(() => {
    // Start animations when component mounts
    Animated.sequence([
      Animated.timing(logoAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(formAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Play lottie animation
    if (lottieRef.current) {
      setTimeout(() => {
        lottieRef.current?.play();
      }, 100);
    }
  }, []);

  useEffect(() => {
    if (authError) {
      setErrors({ auth: authError });
    }
  }, [authError]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      await signup(formData.email, formData.password, formData.name);
    } catch (error) {
      setErrors({ auth: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignup = (provider) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedProvider(provider.toLowerCase());
    setShowSocialSignupDialog(true);
  };

  const handleCloseDialog = () => {
    setShowSocialSignupDialog(false);
    setSelectedProvider(null);
  };

  const getSocialSignupMessage = (provider) => {
    switch (provider) {
      case 'google':
        return 'Google Sign Up is currently under development. We are working on implementing secure Google authentication. Please use email and password to sign up for now.';
      case 'apple':
        return 'Apple Sign Up is currently under development. We are working on implementing secure Apple authentication. Please use email and password to sign up for now.';
      case 'facebook':
        return 'Facebook Sign Up is currently under development. We are working on implementing secure Facebook authentication. Please use email and password to sign up for now.';
      default:
        return 'Social signup is currently under development. Please use email and password to sign up.';
    }
  };

  // Animation styles
  const logoFadeIn = {
    opacity: logoAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    }),
    transform: [
      {
        scale: logoAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1],
        }),
      },
      {
        translateY: logoAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [50, 0],
        }),
      },
    ],
  };

  const formFadeIn = {
    opacity: formAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    }),
    transform: [
      {
        translateY: formAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [30, 0],
        }),
      },
    ],
  };

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle={'dark-content'} 
        backgroundColor={'#F6F8FA'} 
      />
      
      <LinearGradient
        colors={['#F6F8FA', '#FFFFFF']}
        style={styles.gradient}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollView}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.headerContainer, logoFadeIn]}>
            <View style={styles.logoContainer}>
              <LottieView
                ref={lottieRef}
                source={require('../assets/animations/finance-animation.json')}
                style={styles.lottie}
                autoPlay
                loop
              />
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join us to start managing your finances</Text>
          </Animated.View>
          
          <Animated.View style={[styles.formContainer, formFadeIn]}>
            <Surface style={styles.formSurface}>
              <TextInput
                label="Full Name"
                value={formData.name}
                onChangeText={text => {
                  setFormData({ ...formData, name: text });
                  setErrors({ ...errors, name: null });
                }}
                mode="outlined"
                style={styles.input}
                error={!!errors.name}
                theme={{
                  colors: {
                    primary: theme.colors.primary,
                    text: '#333333',
                    placeholder: '#999999',
                    background: '#FFFFFF'
                  }
                }}
                left={<TextInput.Icon icon="account" color={'#666666'} />}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              
              <TextInput
                label="Email"
                value={formData.email}
                onChangeText={text => {
                  setFormData({ ...formData, email: text });
                  setErrors({ ...errors, email: null });
                }}
                mode="outlined"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                error={!!errors.email}
                theme={{
                  colors: {
                    primary: theme.colors.primary,
                    text: '#333333',
                    placeholder: '#999999',
                    background: '#FFFFFF'
                  }
                }}
                left={<TextInput.Icon icon="email" color={'#666666'} />}
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              
              <TextInput
                label="Password"
                value={formData.password}
                onChangeText={text => {
                  setFormData({ ...formData, password: text });
                  setErrors({ ...errors, password: null });
                }}
                mode="outlined"
                secureTextEntry={secureTextEntry}
                style={styles.input}
                error={!!errors.password}
                theme={{
                  colors: {
                    primary: theme.colors.primary,
                    text: '#333333',
                    placeholder: '#999999',
                    background: '#FFFFFF'
                  }
                }}
                left={<TextInput.Icon icon="lock" color={'#666666'} />}
                right={
                  <TextInput.Icon 
                    icon={secureTextEntry ? "eye" : "eye-off"} 
                    color={'#666666'} 
                    onPress={() => setSecureTextEntry(!secureTextEntry)} 
                  />
                }
              />
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              
              <TextInput
                label="Confirm Password"
                value={formData.confirmPassword}
                onChangeText={text => {
                  setFormData({ ...formData, confirmPassword: text });
                  setErrors({ ...errors, confirmPassword: null });
                }}
                mode="outlined"
                secureTextEntry={secureConfirmTextEntry}
                style={styles.input}
                error={!!errors.confirmPassword}
                theme={{
                  colors: {
                    primary: theme.colors.primary,
                    text: '#333333',
                    placeholder: '#999999',
                    background: '#FFFFFF'
                  }
                }}
                left={<TextInput.Icon icon="lock-check" color={'#666666'} />}
                right={
                  <TextInput.Icon 
                    icon={secureConfirmTextEntry ? "eye" : "eye-off"} 
                    color={'#666666'} 
                    onPress={() => setSecureConfirmTextEntry(!secureConfirmTextEntry)} 
                  />
                }
              />
              {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
              
              <Button
                mode="contained"
                onPress={handleSignup}
                loading={loading}
                disabled={loading}
                style={[styles.button, { backgroundColor: theme.colors.primary }]}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
              >
                Create Account
              </Button>
              
              <View style={styles.dividerContainer}>
                <Divider style={styles.divider} />
                <Text style={styles.orText}>Or sign up with</Text>
                <Divider style={styles.divider} />
              </View>
              
              <View style={styles.socialButtonsContainer}>
                <TouchableOpacity 
                  style={[styles.socialButton, { backgroundColor: '#FFFFFF' }]}
                  onPress={() => handleSocialSignup('google')}
                  disabled={loading}
                >
                  <Icon name="google" size={24} color="#DB4437" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.socialButton, { backgroundColor: '#FFFFFF' }]}
                  onPress={() => handleSocialSignup('apple')}
                  disabled={loading}
                >
                  <Icon name="apple" size={24} color="#000000" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.socialButton, { backgroundColor: '#FFFFFF' }]}
                  onPress={() => handleSocialSignup('facebook')}
                  disabled={loading}
                >
                  <Icon name="facebook" size={24} color="#4267B2" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.footerContainer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <Button
                  mode="text"
                  onPress={() => navigation.navigate('Login')}
                  labelStyle={{ color: theme.colors.primary }}
                  style={styles.footerButton}
                >
                  Sign In
                </Button>
              </View>
            </Surface>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
      
      <Portal>
        <Dialog
          visible={showSocialSignupDialog}
          onDismiss={handleCloseDialog}
          style={{ backgroundColor: '#FFFFFF' }}
        >
          <Dialog.Title>
            {selectedProvider === 'google' ? 'Google Sign Up' :
             selectedProvider === 'apple' ? 'Apple Sign Up' :
             selectedProvider === 'facebook' ? 'Facebook Sign Up' :
             'Social Sign Up'}
          </Dialog.Title>
          <Dialog.Content>
            <Text>
              {getSocialSignupMessage(selectedProvider)}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={handleCloseDialog}
              labelStyle={{ color: '#666666' }}
            >
              OK
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: LOGO_SIZE / 2,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  formContainer: {
    width: '100%',
  },
  formSurface: {
    padding: 24,
    borderRadius: 20,
    elevation: 4,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  input: {
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  errorText: {
    marginBottom: 16,
    color: '#EF4444',
    fontSize: 12,
  },
  button: {
    marginTop: 16,
    borderRadius: 12,
    elevation: 2,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  orText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#64748B',
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  footerText: {
    color: '#64748B',
    fontSize: 14,
  },
  footerButton: {
    marginLeft: 4,
  },
});

export default SignupScreen; 