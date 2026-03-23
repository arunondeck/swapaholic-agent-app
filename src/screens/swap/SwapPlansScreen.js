import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { getSwapPlans } from '../../api/swapOpsApi';
import { Card } from '../../components/Card';
import { ScreenShell } from '../../components/ScreenShell';
import { useLoader } from '../../context/LoaderContext';

export const SwapPlansScreen = ({ pop }) => {
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState('');
  const { withLoader } = useLoader();

  useEffect(() => {
    let active = true;

    const loadPlans = async () => {
      try {
        setError('');
        const subscriptionPlans = await withLoader(getSwapPlans(), 'Loading plans...');
        if (active) {
          setPlans(subscriptionPlans);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message || 'Failed to load plans');
        }
      }
    };

    loadPlans();

    return () => {
      active = false;
    };
  }, [withLoader]);

  return (
    <ScreenShell title="Subscription Plans" subtitle={error || 'Select and buy subscription'} onBack={pop} backgroundColor="#ffe4e1">
      {error ? <Text>{error}</Text> : null}
      {plans.map((plan) => (
        <Card key={plan} title={plan} subtitle="[Select Plan] [Buy Plan]" />
      ))}
      <Card title="Buy Extra Points" subtitle="50 / 100 / 200 points packs" />
    </ScreenShell>
  );
};
