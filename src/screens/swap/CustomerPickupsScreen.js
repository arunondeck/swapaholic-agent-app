import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Row } from '../../components/Row';
import { ScreenShell } from '../../components/ScreenShell';
import { getCustomerProfile, getPickupStatus } from '../../data/mockData';
import { styles } from '../../styles/commonStyles';

export const CustomerPickupsScreen = ({ pop, push, customerEmail }) => {
  const customer = getCustomerProfile(customerEmail);

  return (
    <ScreenShell title="Pickups" subtitle={`${customer.name} pickup list`} onBack={pop} backgroundColor="#ffe4e1">
      {customer.pickups.map((pickup) => (
        <TouchableOpacity
          key={pickup.id}
          onPress={() => push('customerPickupDetail', { email: customer.email, pickupId: pickup.id })}
          style={styles.pressableListItem}
        >
          <Row label="Pickup Id" value={pickup.id} />
          <Row label="Status" value={getPickupStatus(pickup)} />
          <Row label="Date" value={pickup.date} />
          <Row label="Address" value={pickup.address} />
          <Row label="Total Items" value={String(pickup.totalItems)} />
          <Row label="Remaining Items" value={String(pickup.remainingItems)} />
        </TouchableOpacity>
      ))}
    </ScreenShell>
  );
};
