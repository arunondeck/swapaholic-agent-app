import React from 'react';
import { Text } from 'react-native';
import { Card } from '../components/Card';
import { ScreenShell } from '../components/ScreenShell';
import { styles } from '../styles/commonStyles';

export const HomeScreen = ({ push }) => (
  <ScreenShell title="Swapaholic" subtitle="UI prototype • no backend logic yet">
    <Text style={styles.sectionTitle}>Choose Operation Mode</Text>
    <Card title="Booth Ops" subtitle="Store sellers, product approvals, and tag printing" onPress={() => push('booth')} />
    <Card title="Swap Mode" subtitle="Subscriptions, pickup cards, swap products, and points checkout" onPress={() => push('swap')} />
    <Card title="Ops Mode" subtitle="Internal lists (products, customers, subscriptions)" onPress={() => push('ops')} />
  </ScreenShell>
);
