import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity } from 'react-native';
import { ScreenShell } from '../../components/ScreenShell';
import { styles } from '../../styles/commonStyles';

export const CustomerPortalScreen = ({ push, pop }) => {
  const [email, setEmail] = useState('temp@swapsquad.app');
  const isEnabled = email.trim().length > 0;

  const openCustomer = () => {
    if (!isEnabled) {
      return;
    }

    push('customerOverview', { email });
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
    </ScreenShell>
  );
};
