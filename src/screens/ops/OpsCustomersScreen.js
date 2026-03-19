import React from 'react';
import { Card } from '../../components/Card';
import { ScreenShell } from '../../components/ScreenShell';

export const OpsCustomersScreen = ({ pop }) => (
  <ScreenShell title="Ops • Customers" subtitle="Placeholder list screen" onBack={pop}>
    <Card title="No functionality yet" subtitle="Use this screen for future customer operations." />
  </ScreenShell>
);
