import React from 'react';
import { Card } from '../../components/Card';
import { OpsSummary } from '../../components/OpsSummary';
import { ScreenShell } from '../../components/ScreenShell';

export const OpsModeScreen = ({ push, pop }) => (
  <ScreenShell title="Ops Mode" subtitle="Today's sales and marketplace summary" onBack={pop} backgroundColor="#dcfce7">
    <OpsSummary />

    <Card title="Sales Reports" subtitle="Daily and range-based sales reports" onPress={() => push('opsSalesReports')} />
    <Card title="Products List" subtitle="UI placeholder" onPress={() => push('opsProducts')} />
    <Card title="Customer List" subtitle="UI placeholder" onPress={() => push('opsCustomers')} />
    <Card title="Subscriptions List" subtitle="UI placeholder" onPress={() => push('opsSubscriptions')} />
  </ScreenShell>
);
