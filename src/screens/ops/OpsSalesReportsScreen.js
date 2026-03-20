import React from 'react';
import { Card } from '../../components/Card';
import { ScreenShell } from '../../components/ScreenShell';

export const OpsSalesReportsScreen = ({ pop }) => (
  <ScreenShell title="Sales Reports" subtitle="Placeholder list screen" onBack={pop} backgroundColor="#dcfce7">
    <Card title="No functionality yet" subtitle="Use this screen for future daily and historical sales reports." />
  </ScreenShell>
);
