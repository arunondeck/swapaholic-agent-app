import React from 'react';
import { Card } from '../../components/Card';
import { ScreenShell } from '../../components/ScreenShell';
import { plans } from '../../data/mockData';

export const SwapPlansScreen = ({ pop }) => (
  <ScreenShell title="Subscription Plans" subtitle="Select and buy subscription" onBack={pop} backgroundColor="#ffe4e1">
    {plans.map((plan) => (
      <Card key={plan} title={plan} subtitle="[Select Plan] [Buy Plan]" />
    ))}
    <Card title="Buy Extra Points" subtitle="50 / 100 / 200 points packs" />
  </ScreenShell>
);
