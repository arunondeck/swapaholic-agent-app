import React from 'react';
import { Card } from '../../components/Card';
import { ScreenShell } from '../../components/ScreenShell';

export const OpsSubscriptionsScreen = ({ pop }) => (
  <ScreenShell title="Ops • Subscriptions" subtitle="Placeholder list screen" onBack={pop}>
    <Card title="No functionality yet" subtitle="Use this screen for future subscription operations." />
  </ScreenShell>
);
