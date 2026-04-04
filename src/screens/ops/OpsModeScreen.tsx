import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Card } from '../../components/Card';
import { OpsSummary } from '../../components/OpsSummary';
import { ScreenShell } from '../../components/ScreenShell';
import { styles } from '../../styles/commonStyles';

const OPS_PASSWORD = process.env.EXPO_PUBLIC_OPS_PASSWORD || '';

export const OpsModeScreen = ({ push, pop }) => {
  const [opsPassword, setOpsPassword] = useState('');
  const [opsError, setOpsError] = useState('');
  const [opsUnlocked, setOpsUnlocked] = useState(false);

  const onOpenOps = () => {
    if (!OPS_PASSWORD) {
      setOpsError('EXPO_PUBLIC_OPS_PASSWORD is not configured.');
      return;
    }

    if (opsPassword !== OPS_PASSWORD) {
      setOpsError('Incorrect password.');
      return;
    }

    setOpsError('');
    setOpsUnlocked(true);
    setOpsPassword('');
  };

  return (
    <ScreenShell title="Ops Mode" subtitle="Today's sales and marketplace summary" onBack={pop} backgroundColor="#f2f7e6">
      {opsUnlocked ? (
        <>
          <OpsSummary headerVariant="plain" />
          <Card title="Sales Reports" subtitle="Daily and range-based sales reports" onPress={() => push('opsSalesReports')} />
          <Card title="Products List" subtitle="UI placeholder" onPress={() => push('opsProducts')} />
          <Card title="Customer List" subtitle="UI placeholder" onPress={() => push('opsCustomers')} />
          <Card title="Subscriptions List" subtitle="UI placeholder" onPress={() => push('opsSubscriptions')} />
        </>
      ) : (
        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Ops Access</Text>
          <Text style={styles.cardSubtitle}>Enter the ops password to unlock this section.</Text>
          <TextInput
            value={opsPassword}
            onChangeText={(value) => {
              setOpsPassword(value);
              if (opsError) {
                setOpsError('');
              }
            }}
            secureTextEntry
            placeholder="Ops password"
            placeholderTextColor="#94a3b8"
            onSubmitEditing={onOpenOps}
            style={styles.input}
          />
          {opsError ? <Text style={styles.helperText}>{opsError}</Text> : null}
          <TouchableOpacity style={styles.primaryButton} onPress={onOpenOps}>
            <Text style={styles.primaryButtonText}>Unlock Ops</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScreenShell>
  );
};
