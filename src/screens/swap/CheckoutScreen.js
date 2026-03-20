import React from 'react';
import { TextInput, View } from 'react-native';
import { Card } from '../../components/Card';
import { Row } from '../../components/Row';
import { ScreenShell } from '../../components/ScreenShell';
import { getCustomerProfile } from '../../data/mockData';
import { styles } from '../../styles/commonStyles';

export const CheckoutScreen = ({ pop, customerEmail }) => {
  const customer = getCustomerProfile(customerEmail);
  const cartTotal = customer.checkoutCart.reduce((sum, item) => sum + Number.parseInt(item.points, 10), 0);

  return (
    <ScreenShell title="Checkout with Points" subtitle="Enter customer email, scan items, redeem points" onBack={pop} backgroundColor="#ffe4e1">
      <TextInput
        defaultValue={customer.email}
        style={styles.input}
        placeholder="Customer email"
        placeholderTextColor="#8b8b8b"
      />
      <Card title="Scanner" subtitle="Ready to scan product QR codes into the cart" />
      {customer.checkoutCart.map((item) => (
        <View key={item.sku} style={styles.listItem}>
          <Row label="SKU" value={item.sku} />
          <Row label="Item" value={item.name} />
          <Row label="Size" value={item.size} />
          <Row label="Points" value={item.points} />
        </View>
      ))}
      <Card
        title="Cart Summary"
        subtitle={`${customer.checkoutCart.length} items • Total: ${cartTotal} pts • Available balance: ${customer.points}`}
      />
    </ScreenShell>
  );
};
