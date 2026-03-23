import React, { useEffect, useState } from 'react';
import { Text, TextInput } from 'react-native';
import { getCustomerProfile, getSwapPlans } from '../../api/swapOpsApi';
import { Card } from '../../components/Card';
import { ScreenShell } from '../../components/ScreenShell';
import { useLoader } from '../../context/LoaderContext';
import { styles } from '../../styles/commonStyles';

export const BuySubscriptionScreen = ({ pop, customerEmail }) => {
  const [customer, setCustomer] = useState(null);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [pointsToBuy, setPointsToBuy] = useState('');
  const [error, setError] = useState('');
  const { withLoader } = useLoader();

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        setError('');
        const [profile, planList] = await withLoader(
          Promise.all([getCustomerProfile(customerEmail), getSwapPlans()]),
          'Loading subscription options...'
        );

        if (!active) {
          return;
        }

        setCustomer(profile);
        setAvailablePlans(planList);
        setSelectedPlan((currentPlan) => currentPlan || planList[1] || planList[0] || '');
      } catch (loadError) {
        if (active) {
          setError(loadError.message || 'Failed to load subscription data');
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [customerEmail, withLoader]);

  if (!customer) {
    return (
      <ScreenShell title="Buy Subscription" subtitle={error || 'Loading subscription options...'} onBack={pop} backgroundColor="#ffe4e1">
        <Text>{error || 'Loading...'}</Text>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title="Buy Subscription" subtitle={`Purchase flow for ${customer.name}`} onBack={pop} backgroundColor="#ffe4e1">
      <Text style={styles.selectLabel}>Select Subscription</Text>
      {availablePlans.map((plan) => (
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
        subtitle={`${customer.email} | ${selectedPlan}${pointsToBuy ? ` | Extra points: ${pointsToBuy}` : ' | No extra points added'}`}
      />
    </ScreenShell>
  );
};
