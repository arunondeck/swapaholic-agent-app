import React from 'react';
import { TextInput } from 'react-native';
import { Card } from '../../components/Card';
import { ScreenShell } from '../../components/ScreenShell';
import { styles } from '../../styles/commonStyles';

export const CustomerPortalScreen = ({ pop }) => (
  <ScreenShell title="Customer Portal" subtitle="Email login + subscriptions + pickups + products + points" onBack={pop}>
    <TextInput style={styles.input} placeholder="Email login" placeholderTextColor="#8b8b8b" />
    <Card title="Total Points" subtitle="420 pts" />
    <Card title="My Subscriptions" subtitle="SUB-2001 (Active), SUB-1880 (Completed)" />
    <Card title="My Pickup Cards" subtitle="PK-9009, PK-8732" />
    <Card title="My Swap Products" subtitle="View product list and points approval status" />
    <Card title="Buy Subscription" subtitle="Choose from list and purchase" />
    <Card title="Buy Points" subtitle="Add point packs to wallet" />
  </ScreenShell>
);
