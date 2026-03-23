import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { Card } from '../../components/Card';
import { ScreenShell } from '../../components/ScreenShell';
import { useLoader } from '../../context/LoaderContext';
import { useSwapStore } from '../../store/swapStore';

const toPlanLabel = (plan) => {
  const planName = plan?.name || plan?.plan || 'Subscription';
  const itemCount = Number.parseInt(String(plan?.number_of_items_c ?? 0), 10);
  if (!itemCount) {
    return planName;
  }
  return `${planName} - ${itemCount} pickup${itemCount === 1 ? '' : 's'} / month`;
};

export const SwapPlansScreen = ({ pop }) => {
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState('');
  const { withLoader } = useLoader();
  const allSubscriptions = useSwapStore((state) => state.allSubscriptions);
  const fetchAllSubscriptions = useSwapStore((state) => state.fetchAllSubscriptions);

  useEffect(() => {
    let active = true;

    const loadPlans = async () => {
      try {
        setError('');
        const subscriptions = allSubscriptions.length
          ? allSubscriptions
          : await withLoader(fetchAllSubscriptions(), 'Loading plans...');
        const subscriptionPlans = subscriptions.map(toPlanLabel);
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
  }, [allSubscriptions, fetchAllSubscriptions, withLoader]);

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
