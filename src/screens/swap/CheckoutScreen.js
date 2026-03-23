import React, { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { getCustomerCheckoutCart, getCustomerProfile } from '../../api/swapOpsApi';
import { Card } from '../../components/Card';
import { Row } from '../../components/Row';
import { ScreenShell } from '../../components/ScreenShell';
import { useLoader } from '../../context/LoaderContext';
import { styles } from '../../styles/commonStyles';

export const CheckoutScreen = ({ pop, customerEmail }) => {
  const [customer, setCustomer] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [error, setError] = useState('');
  const { withLoader } = useLoader();

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        setError('');
        const [profile, checkoutCart] = await withLoader(
          Promise.all([getCustomerProfile(customerEmail), getCustomerCheckoutCart(customerEmail)]),
          'Loading checkout...'
        );

        if (!active) {
          return;
        }

        setCustomer(profile);
        setCartItems(checkoutCart);
      } catch (loadError) {
        if (active) {
          setError(loadError.message || 'Failed to load checkout data');
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [customerEmail, withLoader]);

  if (!customer) {
    return (
      <ScreenShell title="Checkout with Points" subtitle={error || 'Loading checkout data...'} onBack={pop} backgroundColor="#ffe4e1">
        <Text>{error || 'Loading...'}</Text>
      </ScreenShell>
    );
  }

  const cartTotal = cartItems.reduce((sum, item) => sum + Number.parseInt(item.points, 10), 0);

  return (
    <ScreenShell title="Checkout with Points" subtitle="Enter customer email, scan items, redeem points" onBack={pop} backgroundColor="#ffe4e1">
      <TextInput
        defaultValue={customer.email}
        style={styles.input}
        placeholder="Customer email"
        placeholderTextColor="#8b8b8b"
      />
      <Card title="Scanner" subtitle="Ready to scan product QR codes into the cart" />
      {cartItems.map((item) => (
        <View key={item.sku} style={styles.listItem}>
          <Row label="SKU" value={item.sku} />
          <Row label="Item" value={item.name} />
          <Row label="Size" value={item.size} />
          <Row label="Points" value={item.points} />
        </View>
      ))}
      <Card
        title="Cart Summary"
        subtitle={`${cartItems.length} items | Total: ${cartTotal} pts | Available balance: ${customer.points}`}
      />
    </ScreenShell>
  );
};
