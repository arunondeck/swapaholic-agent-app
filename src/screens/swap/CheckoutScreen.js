import React from 'react';
import { TextInput } from 'react-native';
import { Card } from '../../components/Card';
import { ScreenShell } from '../../components/ScreenShell';
import { styles } from '../../styles/commonStyles';

export const CheckoutScreen = ({ pop }) => (
  <ScreenShell title="Checkout with Points" subtitle="Enter customer email, scan items, redeem points" onBack={pop}>
    <TextInput style={styles.input} placeholder="Customer email" placeholderTextColor="#8b8b8b" />
    <Card title="Scan Product QR" subtitle="Add products to cart" />
    <Card title="Cart (UI only)" subtitle="3 items • Total: 120 pts • [Checkout]" />
  </ScreenShell>
);
