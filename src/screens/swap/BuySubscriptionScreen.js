import React, { useState } from 'react';
import { Text, TextInput } from 'react-native';
import { Card } from '../../components/Card';
import { ScreenShell } from '../../components/ScreenShell';
import { getCustomerProfile, plans } from '../../data/mockData';
import { styles } from '../../styles/commonStyles';

export const BuySubscriptionScreen = ({ pop, customerEmail }) => {
  const customer = getCustomerProfile(customerEmail);
  const [selectedPlan, setSelectedPlan] = useState(plans[1]);
  const [pointsToBuy, setPointsToBuy] = useState('');

  return (
    <ScreenShell title="Buy Subscription" subtitle={`Purchase flow for ${customer.name}`} onBack={pop} backgroundColor="#ffe4e1">
      <Text style={styles.selectLabel}>Select Subscription</Text>
      {plans.map((plan) => (
        <Card
          key={plan}
          active={selectedPlan === plan}
          onPress={() => setSelectedPlan(plan)}
          subtitle={selectedPlan === plan ? 'Selected subscription' : 'Tap to select'}
          title={plan}
        />
      ))}

      <TextInput
        keyboardType="numeric"
        onChangeText={setPointsToBuy}
        placeholder="Optional extra points"
        placeholderTextColor="#8b8b8b"
        style={styles.inputWithSpacing}
        value={pointsToBuy}
      />

      <Card
        title="Purchase Summary"
        subtitle={`${customer.email} • ${selectedPlan}${pointsToBuy ? ` • Extra points: ${pointsToBuy}` : ' • No extra points added'}`}
      />
    </ScreenShell>
  );
};
