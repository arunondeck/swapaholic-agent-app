import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { getCustomerPickups, getCustomerProfile, getPickupStatus } from '../../api/swapOpsApi';
import { Row } from '../../components/Row';
import { ScreenShell } from '../../components/ScreenShell';
import { useLoader } from '../../context/LoaderContext';
import { styles } from '../../styles/commonStyles';

export const CustomerPickupsScreen = ({ pop, push, customerEmail }) => {
  const [customer, setCustomer] = useState(null);
  const [pickups, setPickups] = useState([]);
  const [error, setError] = useState('');
  const { withLoader } = useLoader();

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        setError('');
        const [profile, pickupList] = await withLoader(
          Promise.all([getCustomerProfile(customerEmail), getCustomerPickups(customerEmail)]),
          'Loading pickups...'
        );

        if (!active) {
          return;
        }

        setCustomer(profile);
        setPickups(pickupList);
      } catch (loadError) {
        if (active) {
          setError(loadError.message || 'Failed to load pickups');
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
      <ScreenShell title="Pickups" subtitle={error || 'Loading pickup list...'} onBack={pop} backgroundColor="#ffe4e1">
        <Text>{error || 'Loading...'}</Text>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title="Pickups" subtitle={`${customer.name} pickup list`} onBack={pop} backgroundColor="#ffe4e1">
      {pickups.map((pickup) => (
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
