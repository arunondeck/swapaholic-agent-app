import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Row } from '../../components/Row';
import { ScreenShell } from '../../components/ScreenShell';
import { formatRemainingItems, getCustomerPickup, getCustomerProfile, getPickupStatus } from '../../data/mockData';
import { styles } from '../../styles/commonStyles';

export const CustomerPickupDetailScreen = ({ pop, push, customerEmail, pickupId }) => {
  const customer = getCustomerProfile(customerEmail);
  const pickup = getCustomerPickup(customerEmail, pickupId);

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
      {pickup.items.map((item) => (
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
