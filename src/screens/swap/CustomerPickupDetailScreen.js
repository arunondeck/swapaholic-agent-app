import React, { useEffect, useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { formatRemainingItems, getCustomerPickupDetails, getCustomerProfile, getPickupStatus } from '../../api/swapOpsApi';
import { Row } from '../../components/Row';
import { ScreenShell } from '../../components/ScreenShell';
import { useLoader } from '../../context/LoaderContext';
import { styles } from '../../styles/commonStyles';

export const CustomerPickupDetailScreen = ({ pop, push, customerEmail, pickupId }) => {
  const [customer, setCustomer] = useState(null);
  const [pickup, setPickup] = useState(null);
  const [error, setError] = useState('');
  const { withLoader } = useLoader();

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        setError('');
        const [profile, pickupDetails] = await withLoader(
          Promise.all([
            getCustomerProfile(customerEmail),
            getCustomerPickupDetails(customerEmail, pickupId),
          ]),
          'Loading pickup details...'
        );

        if (!active) {
          return;
        }

        setCustomer(profile);
        setPickup(pickupDetails);
      } catch (loadError) {
        if (active) {
          setError(loadError.message || 'Failed to load pickup details');
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [customerEmail, pickupId, withLoader]);

  if (!customer || !pickup) {
    return (
      <ScreenShell title="Pickup" subtitle={error || 'Loading pickup details...'} onBack={pop} backgroundColor="#ffe4e1">
        <Text>{error || 'Loading...'}</Text>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title={pickup.id} subtitle={`${customer.name} pickup details`} onBack={pop} backgroundColor="#ffe4e1">
      <View style={styles.listItem}>
        <Text style={styles.sectionTitle}>Pickup Summary</Text>
        <Row label="Subscription" value={pickup.subscriptionId} />
        <Row label="Status" value={getPickupStatus(pickup)} />
        <Row label="Date" value={pickup.date} />
        <Row label="Total Items" value={String(pickup.totalItems)} />
        <Row label="Remaining Items" value={formatRemainingItems(pickup.remainingItems)} />
      </View>

      <Text style={styles.sectionTitle}>Items Swapped In</Text>
      {(pickup.items || []).map((item) => (
        <View key={item.id} style={styles.itemRow}>
          <Image source={{ uri: item.image }} style={styles.itemImage} />
          <View style={styles.itemDetails}>
            <Text style={styles.cardTitle}>{item.id}</Text>
            <Text style={styles.itemMeta}>Brand: {item.brand}</Text>
            <Text style={styles.itemMeta}>Category: {item.category}</Text>
            <Text style={styles.itemMeta}>Subcategory: {item.subcategory}</Text>
            <Text style={styles.itemMeta}>Size: {item.size}</Text>
          </View>
        </View>
      ))}

      {pickup.remainingItems > 0 ? (
        <TouchableOpacity
          onPress={() =>
            push('customerItemEntry', {
              email: customer.email,
              sourceType: 'pickup',
              sourceId: pickup.id,
            })
          }
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Add More Items</Text>
        </TouchableOpacity>
      ) : null}
    </ScreenShell>
  );
};
