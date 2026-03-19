import React from 'react';
import { TextInput } from 'react-native';
import { Card } from '../../components/Card';
import { ScreenShell } from '../../components/ScreenShell';
import { styles } from '../../styles/commonStyles';

export const PickupCardsScreen = ({ pop }) => (
  <ScreenShell title="Pickup Cards" subtitle="QR-linked to subscriptions" onBack={pop}>
    <Card title="Subscription #SUB-2001" subtitle="Pickup Card: PK-9009 • [Print Card]" />
    <Card title="Scan Pickup Card QR" subtitle="Opens linked subscription and add swap products" />
    <TextInput style={styles.input} placeholder="QR scan result placeholder" placeholderTextColor="#8b8b8b" />
  </ScreenShell>
);
