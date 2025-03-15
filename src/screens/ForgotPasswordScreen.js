import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Animated,
  StatusBar
} from 'react-native';
import {
  TextInput,
  Button,
  Surface,
  Text,
  useTheme,
  IconButton,
  Divider,
  ActivityIndicator
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');
const LOGO_SIZE = width * 0.3;

const ForgotPasswordScreen = ({ navigation }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const logoAnimation = useRef(new Animated.Value(0)).current;
  const formAnimation = useRef(new Animated.Value(0)).current;
  const lottieRef = useRef(null);

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [resetSent, setResetSent] = useState(false);

  const { resetPassword, error: authError } = useAuth();

  React.useEffect(() => {
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

  React.useEffect(() => {
    if (authError) {
      setErrors({ auth: authError });
    }
  }, [authError]);

  const validateForm = () => {
    const newErrors = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (error) {
      setErrors({ auth: error.message });
    } finally {
      setLoading(false);
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
      <StatusBar barStyle="dark-content" />
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
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>Enter your email to receive a password reset link</Text>
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

              {resetSent ? (
                <View style={styles.successContainer}>
                  <Icon name="check-circle" size={48} color={theme.colors.primary} />
                  <Text style={styles.successText}>
                    Password reset link has been sent to your email address.
                  </Text>
                  <Button
                    mode="contained"
                    onPress={() => navigation.navigate('Login')}
                    style={[styles.button, { backgroundColor: theme.colors.primary }]}
                    contentStyle={styles.buttonContent}
                    labelStyle={styles.buttonLabel}
                  >
                    Back to Login
                  </Button>
                </View>
              ) : (
                <>
                  <Button
                    mode="contained"
                    onPress={handleResetPassword}
                    loading={loading}
                    disabled={loading}
                    style={[styles.button, { backgroundColor: theme.colors.primary }]}
                    contentStyle={styles.buttonContent}
                    labelStyle={styles.buttonLabel}
                  >
                    Send Reset Link
                  </Button>

                  <Button
                    mode="text"
                    onPress={() => navigation.navigate('Login')}
                    style={styles.backButton}
                    labelStyle={{ color: theme.colors.primary }}
                  >
                    Back to Login
                  </Button>
                </>
              )}
            </Surface>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
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
  backButton: {
    marginTop: 8,
  },
  successContainer: {
    alignItems: 'center',
    padding: 16,
  },
  successText: {
    marginTop: 16,
    textAlign: 'center',
    color: '#4CAF50',
    fontSize: 16,
  },
});

export default ForgotPasswordScreen; 