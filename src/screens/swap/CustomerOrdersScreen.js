import React from 'react';
import { View } from 'react-native';
import { Row } from '../../components/Row';
import { ScreenShell } from '../../components/ScreenShell';
import { getCustomerProfile } from '../../data/mockData';
import { styles } from '../../styles/commonStyles';

export const CustomerOrdersScreen = ({ pop, customerEmail }) => {
  const customer = getCustomerProfile(customerEmail);

  return (
    <ScreenShell title="Orders" subtitle={`${customer.name} order history`} onBack={pop} backgroundColor="#ffe4e1">
      {customer.orders.map((order) => (
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
