import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { getCustomerOrders, getCustomerProfile } from '../../api/swapOpsApi';
import { Row } from '../../components/Row';
import { ScreenShell } from '../../components/ScreenShell';
import { useLoader } from '../../context/LoaderContext';
import { styles } from '../../styles/commonStyles';

export const CustomerOrdersScreen = ({ pop, customerEmail }) => {
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const { withLoader } = useLoader();

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        setError('');
        const [profile, orderList] = await withLoader(
          Promise.all([getCustomerProfile(customerEmail), getCustomerOrders(customerEmail)]),
          'Loading orders...'
        );

        if (!active) {
          return;
        }

        setCustomer(profile);
        setOrders(orderList);
      } catch (loadError) {
        if (active) {
          setError(loadError.message || 'Failed to load orders');
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
      <ScreenShell title="Orders" subtitle={error || 'Loading order history...'} onBack={pop} backgroundColor="#ffe4e1">
        <Text>{error || 'Loading...'}</Text>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title="Orders" subtitle={`${customer.name} order history`} onBack={pop} backgroundColor="#ffe4e1">
      {orders.map((order) => (
        <View key={order.id} style={styles.listItem}>
          <Row label="Order Id" value={order.id} />
          <Row label="Status" value={order.status} />
          <Row label="Date" value={order.date} />
          <Row label="Items" value={order.itemCount} />
          <Row label="Total" value={order.total} />
        </View>
      ))}
    </ScreenShell>
  );
};
