import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity } from 'react-native';
import { authenticateCustomer } from '../../api/swapOpsApi';
import { ScreenShell } from '../../components/ScreenShell';
import { useLoader } from '../../utils/LoaderContextShared';
import { useSwapStore } from '../../store/swapStore';
import { styles } from '../../styles/commonStyles';

export const CustomerPortalScreen = ({ push, pop }) => {
  const activeCustomer = useSwapStore((state) => state.activeCustomer);
  const setActiveCustomerSession = useSwapStore((state) => state.setActiveCustomerSession);
  const [email, setEmail] = useState(activeCustomer?.email || 'arun.chembilath@gmail.com');
  const [error, setError] = useState('');
  const { withLoader } = useLoader();
  const isEnabled = email.trim().length > 0;

  const openCustomer = async () => {
    if (!isEnabled) {
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
      setError('');
      const session = await withLoader(authenticateCustomer(normalizedEmail, { forceRefresh: true }), 'Logging in customer...');
      setActiveCustomerSession(session);
      push('customerOverview', { email: normalizedEmail });
    } catch (loginError) {
      setError(loginError.message || 'Customer login failed');
    }
  };

  return (
    <ScreenShell title="Customer Login" subtitle="Enter email and continue to the customer summary" onBack={pop} backgroundColor="#ffe4e1">
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        onChangeText={setEmail}
        onSubmitEditing={openCustomer}
        placeholder="Customer email"
        placeholderTextColor="#8b8b8b"
        returnKeyType="go"
        style={styles.input}
        value={email}
      />
      <TouchableOpacity
        disabled={!isEnabled}
        onPress={openCustomer}
        style={[styles.primaryButton, !isEnabled && styles.primaryButtonDisabled]}
      >
        <Text style={styles.primaryButtonText}>Enter</Text>
      </TouchableOpacity>
      {activeCustomer?.email ? <Text style={styles.helperText}>Active customer: {activeCustomer.email}</Text> : null}
      {error ? <Text style={styles.helperText}>{error}</Text> : null}
    </ScreenShell>
  );
};
