import React from 'react';
import { TextInput } from 'react-native';
import { Card } from '../../components/Card';
import { ScreenShell } from '../../components/ScreenShell';
import { styles } from '../../styles/commonStyles';

export const PickupCardsScreen = ({ pop }) => (
  <ScreenShell title="Scan Pickups" subtitle="Scan pickup IDs and open linked swap flows" onBack={pop} backgroundColor="#ffe4e1">
    <Card title="Subscription #SUB-2001" subtitle="Pickup Card: PK-9009 • [Print Card]" />
    <Card title="Scan Pickup Card QR" subtitle="Opens linked pickup and add swap products" />
    <TextInput style={styles.input} placeholder="QR scan result placeholder" placeholderTextColor="#8b8b8b" />
  </ScreenShell>
);
