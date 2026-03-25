import React, { useState } from 'react';
import { ActivityIndicator, Image, SafeAreaView, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import appConfig from '../../../app.json';
import { useAppSessionStore } from '../../store/appSessionStore';
import { styles } from '../../styles/commonStyles';

const APP_NAME = process.env.EXPO_PUBLIC_APP_NAME || appConfig.expo?.name || 'Swapaholic Agent';
const APP_VERSION = appConfig.expo?.version || '0.0.1';
const LOGO_URL =
  process.env.EXPO_PUBLIC_BOOTH_LOGO_URL ||
  'https://images.pexels.com/photos/5632402/pexels-photo-5632402.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop';

export const BoothLoginScreen = ({ pop }) => {
  const login = useAppSessionStore((state) => state.login);
  const loading = useAppSessionStore((state) => state.loading);
  const storeError = useAppSessionStore((state) => state.error);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const onLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password');
      return;
    }

    try {
      setError('');
      await login(email.trim(), password);
      pop();
    } catch (loginError) {
      setError(loginError.message || 'Network error. Please try again.');
    }
  };

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.loginPage}>
      <SafeAreaView style={styles.loginSafeArea}>
        <StatusBar barStyle="light-content" />
        <ScrollView contentContainerStyle={styles.loginScrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.loginContainer}>
            <View style={styles.loginBranding}>
              <Text style={styles.loginAppName}>{APP_NAME}</Text>
              <View style={styles.loginLogoContainer}>
                <Image source={{ uri: LOGO_URL }} style={styles.loginLogo} />
              </View>
              <Text style={styles.loginVersion}>Version {APP_VERSION}</Text>
            </View>

            <View style={styles.loginCard}>
              <View style={styles.loginCardHeader}>
                <Text style={styles.loginCardTitle}>Sign in</Text>
                {/* <Text style={styles.loginCardSubtitle}>Sign in to continue</Text> */}
              </View>

              <View style={styles.loginCardContent}>
                <View style={styles.loginFormGroup}>
                  <Text style={styles.loginFormLabel}>Email</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholder="Enter your email"
                    placeholderTextColor="#adb5bd"
                    editable={!loading}
                    returnKeyType="next"
                    style={styles.loginFormInput}
                  />
                </View>

                <View style={styles.loginFormGroup}>
                  <Text style={styles.loginFormLabel}>Password</Text>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholder="Enter your password"
                    placeholderTextColor="#adb5bd"
                    editable={!loading}
                    onSubmitEditing={onLogin}
                    style={styles.loginFormInput}
                  />
                </View>

                {error || storeError ? (
                  <View style={styles.loginErrorMessage}>
                    <Text style={styles.loginErrorIcon}>!</Text>
                    <Text style={styles.loginErrorText}>{error || storeError}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                  onPress={onLogin}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.loginButtonText}>Sign In</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};
