import React from 'react';
import { Card } from '../../components/Card';
import { ScreenShell } from '../../components/ScreenShell';

export const SwapModeScreen = ({ push, pop }) => (
  <ScreenShell title="Swap" subtitle="Customer login, pickups, subscriptions, and checkout" onBack={pop} backgroundColor="#ffe4e1">
    <Card title="Customer Login" subtitle="Enter email and open customer summary" onPress={() => push('customerPortal')} />
    <Card title="Scan Pickups" subtitle="Open pickup scan and linked pickup flows" onPress={() => push('pickupCards')} />
    <Card title="View Subscriptions" subtitle="Browse swap subscription plans" onPress={() => push('swapPlans')} />
    <Card title="Checkout" subtitle="Scan products and redeem customer points" onPress={() => push('checkout')} />
  </ScreenShell>
);
