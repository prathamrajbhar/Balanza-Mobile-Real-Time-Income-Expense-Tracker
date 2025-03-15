import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Image, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  Dimensions,
  Animated,
  TouchableOpacity,
  StatusBar
} from 'react-native';
import { 
  TextInput, 
  Button, 
  Surface, 
  Text, 
  Checkbox, 
  HelperText, 
  Portal, 
  Dialog, 
  useTheme,
  IconButton,
  Divider,
  Switch,
  ActivityIndicator
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import * as LocalAuthentication from 'expo-local-authentication';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');
const LOGO_SIZE = width * 0.3;

const LoginScreen = ({ navigation }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const animation = useRef(new Animated.Value(0)).current;
  const logoAnimation = useRef(new Animated.Value(0)).current;
  const formAnimation = useRef(new Animated.Value(0)).current;
  const lottieRef = useRef(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [resetPasswordEmail, setResetPasswordEmail] = useState('');
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [showSocialLoginDialog, setShowSocialLoginDialog] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [error, setError] = useState(null);
  
  const { login, resetPassword, error: authError } = useAuth();

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

    // Check if biometric authentication is available
    checkBiometricAvailability();
  }, []);

  useEffect(() => {
    if (authError) {
      setErrors({ auth: authError });
    }
  }, [authError]);

  const checkBiometricAvailability = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setIsBiometricAvailable(compatible && enrolled);
  };

  const handleBiometricAuth = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to continue',
        fallbackLabel: 'Use password',
      });
      
      if (result.success) {
        // In a real app, you would retrieve the saved credentials
        // and log in automatically
        setLoading(true);
        // Simulate login with saved credentials
        setTimeout(() => {
          login('saved@email.com', 'savedPassword', true);
          setLoading(false);
        }, 1000);
      }
    } catch (error) {
      console.log('Biometric authentication error:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    try {
      setError(null);
      setLoading(true);

      // Basic validation
      if (!email.trim()) {
        setError('Please enter your email address');
        return;
      }

      if (!password.trim()) {
        setError('Please enter your password');
        return;
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setError('Please enter a valid email address');
        return;
      }

      // Password length validation
      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }

      // Attempt login
      await login(email.trim(), password, rememberMe);
      
      // If login is successful, the navigation will be handled by the AuthContext
      // and the user will be redirected to the main app
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message);
      // Provide haptic feedback for error
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordEmail) {
      setErrors({ reset: 'Please enter your email address' });
      return;
    }

    try {
      await resetPassword(resetPasswordEmail);
      setResetSent(true);
    } catch (error) {
      setErrors({ reset: error.message });
    }
  };

  const handleSocialLogin = (provider) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedProvider(provider.toLowerCase());
    setShowSocialLoginDialog(true);
  };

  const handleCloseDialog = () => {
    setShowSocialLoginDialog(false);
    setSelectedProvider(null);
  };

  const getSocialLoginMessage = (provider) => {
    switch (provider) {
      case 'google':
        return 'Google Sign In is currently under development. We are working on implementing secure Google authentication. Please use email and password to sign in for now.';
      case 'apple':
        return 'Apple Sign In is currently under development. We are working on implementing secure Apple authentication. Please use email and password to sign in for now.';
      case 'facebook':
        return 'Facebook Sign In is currently under development. We are working on implementing secure Facebook authentication. Please use email and password to sign in for now.';
      default:
        return 'Social login is currently under development. Please use email and password to sign in.';
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
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue managing your finances</Text>
          </Animated.View>
          
          <Animated.View style={[styles.formContainer, formFadeIn]}>
            <Surface style={styles.formSurface}>
              <TextInput
                label="Email"
                value={email}
                onChangeText={text => {
                  setEmail(text);
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
                value={password}
                onChangeText={text => {
                  setPassword(text);
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
              
              <Button
                mode="text"
                onPress={() => navigation.navigate('ForgotPassword')}
                style={styles.forgotPasswordButton}
                labelStyle={{ color: theme.colors.primary }}
              >
                Forgot Password?
              </Button>
              
              <Button
                mode="contained"
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                style={[styles.button, { backgroundColor: theme.colors.primary }]}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
              >
                Sign In
              </Button>
              
              <View style={styles.dividerContainer}>
                <Divider style={styles.divider} />
                <Text style={styles.orText}>Or continue with</Text>
                <Divider style={styles.divider} />
              </View>
              
              <View style={styles.socialButtonsContainer}>
                <TouchableOpacity 
                  style={[styles.socialButton, { backgroundColor: '#FFFFFF' }]}
                  onPress={() => handleSocialLogin('google')}
                  disabled={loading}
                >
                  <Icon name="google" size={24} color="#DB4437" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.socialButton, { backgroundColor: '#FFFFFF' }]}
                  onPress={() => handleSocialLogin('apple')}
                  disabled={loading}
                >
                  <Icon name="apple" size={24} color="#000000" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.socialButton, { backgroundColor: '#FFFFFF' }]}
                  onPress={() => handleSocialLogin('facebook')}
                  disabled={loading}
                >
                  <Icon name="facebook" size={24} color="#4267B2" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.footerContainer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <Button
                  mode="text"
                  onPress={() => navigation.navigate('Signup')}
                  labelStyle={{ color: theme.colors.primary }}
                  style={styles.footerButton}
                >
                  Sign Up
                </Button>
              </View>
            </Surface>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
      
      <Portal>
        <Dialog
          visible={showSocialLoginDialog}
          onDismiss={handleCloseDialog}
          style={{ backgroundColor: '#FFFFFF' }}
        >
          <Dialog.Title>
            {selectedProvider === 'google' ? 'Google Sign In' :
             selectedProvider === 'apple' ? 'Apple Sign In' :
             selectedProvider === 'facebook' ? 'Facebook Sign In' :
             'Social Sign In'}
          </Dialog.Title>
          <Dialog.Content>
            <Text>
              {getSocialLoginMessage(selectedProvider)}
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
  forgotPasswordButton: {
    marginTop: 8,
    alignSelf: 'flex-end',
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

export default LoginScreen; 