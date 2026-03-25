import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ScreenShell } from '../../components/ScreenShell';
import { useBoothAuthStore } from '../../store/boothAuthStore';
import { styles } from '../../styles/commonStyles';

export const BoothLoginScreen = ({ pop }) => {
  const login = useBoothAuthStore((state) => state.login);
  const loading = useBoothAuthStore((state) => state.loading);
  const storeError = useBoothAuthStore((state) => state.error);
  const user = useBoothAuthStore((state) => state.user);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const onLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Enter both email and password.');
      return;
    }

    try {
      setError('');
      await login(email.trim(), password);
      pop();
    } catch (loginError) {
      setError(loginError.message || 'Unable to sign in.');
    }
  };

  return (
    <ScreenShell title="Booth Login" subtitle="Sign in to the live booth GraphQL backend" onBack={pop} backgroundColor="#e0f2fe">
      <View style={styles.formCard}>
        <Text style={styles.selectLabel}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="seller@swapaholic.com"
          placeholderTextColor="#94a3b8"
          style={styles.input}
        />
        <Text style={styles.selectLabel}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Password"
          placeholderTextColor="#94a3b8"
          style={styles.input}
        />
        {error || storeError ? <Text style={[styles.helperText, { color: '#dc2626' }]}>{error || storeError}</Text> : null}
        <TouchableOpacity style={[styles.primaryButton, loading && styles.primaryButtonDisabled]} onPress={onLogin} disabled={loading}>
          <Text style={styles.primaryButtonText}>{loading ? 'Signing In...' : 'Sign In'}</Text>
        </TouchableOpacity>
      </View>

      {user ? (
        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Current Session</Text>
          <Text style={styles.cardSubtitle}>{user.first_name || user.username || user.email}</Text>
          <Text style={styles.helperText}>{user.email || 'No email available'}</Text>
        </View>
      ) : null}
    </ScreenShell>
  );
};
