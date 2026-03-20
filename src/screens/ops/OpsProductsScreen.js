import React from 'react';
import { Card } from '../../components/Card';
import { ScreenShell } from '../../components/ScreenShell';

export const OpsProductsScreen = ({ pop }) => (
  <ScreenShell title="Ops • Products" subtitle="Placeholder list screen" onBack={pop} backgroundColor="#dcfce7">
    <Card title="No functionality yet" subtitle="Use this screen for future product operations." />
  </ScreenShell>
);
