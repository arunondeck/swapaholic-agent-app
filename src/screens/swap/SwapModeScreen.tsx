import React, { useEffect } from 'react';
import { Card } from '../../components/Card';
import { ScreenShell } from '../../components/ScreenShell';
import { useSwapStore } from '../../store/swapStore';

export const SwapModeScreen = ({ push, pop }) => {
  const fetchAllSubscriptions = useSwapStore((state) => state.fetchAllSubscriptions);

  useEffect(() => {
    fetchAllSubscriptions().catch(() => null);
  }, [fetchAllSubscriptions]);

  return (
    <ScreenShell title="Swap" subtitle="Customer login, pickups, subscriptions, and checkout" onBack={pop} backgroundColor="#ffe4e1">
      <Card title="Swapper Login" subtitle="Enter email and open customer summary" onPress={() => push('customerPortal')} />
      {/* <Card title="Scan Pickups" subtitle="Open pickup scan and linked pickup flows" onPress={() => push('pickupCards')} /> */}
      {/* <Card title="View Subscriptions" subtitle="Browse swap subscription plans" onPress={() => push('swapPlans')} /> */}
      <Card title="Buy Points Checkout" subtitle="Scan products and process non-customer checkout" onPress={() => push('checkout', { mode: 'nonCustomer' })} />
    </ScreenShell>
  );
};
