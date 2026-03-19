import React from 'react';
import { Card } from '../../components/Card';
import { ScreenShell } from '../../components/ScreenShell';

export const OpsModeScreen = ({ push, pop }) => (
  <ScreenShell title="Ops Mode" subtitle="Blank section pages for internal operations" onBack={pop}>
    <Card title="Products List" subtitle="UI placeholder" onPress={() => push('opsProducts')} />
    <Card title="Customers List" subtitle="UI placeholder" onPress={() => push('opsCustomers')} />
    <Card title="Subscriptions List" subtitle="UI placeholder" onPress={() => push('opsSubscriptions')} />
  </ScreenShell>
);
