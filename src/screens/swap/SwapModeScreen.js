import React from 'react';
import { Card } from '../../components/Card';
import { ScreenShell } from '../../components/ScreenShell';

export const SwapModeScreen = ({ push, pop }) => (
  <ScreenShell title="Swap Mode" subtitle="Pickup cards, swaps, approvals, and point checkout" onBack={pop}>
    <Card title="Subscription Plans" subtitle="List + purchase UI" onPress={() => push('swapPlans')} />
    <Card title="Pickup Cards" subtitle="Generate + print + scan card QR" onPress={() => push('pickupCards')} />
    <Card title="Swap Product Inspection" subtitle="Assign points after manual check" onPress={() => push('inspection')} />
    <Card title="Customer Approval" subtitle="Customer approves/rejects points" onPress={() => push('approval')} />
    <Card title="Print Approved Swap Tags" subtitle="Separate queue for approved products" onPress={() => push('swapTags')} />
    <Card title="Checkout Using Points" subtitle="Enter email, scan products, and checkout" onPress={() => push('checkout')} />
    <Card title="Customer App Screens" subtitle="Email login, subscriptions, pickups, products, points" onPress={() => push('customerPortal')} />
  </ScreenShell>
);
