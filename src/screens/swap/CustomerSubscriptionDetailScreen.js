import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Row } from '../../components/Row';
import { ScreenShell } from '../../components/ScreenShell';
import { formatRemainingItems, getCustomerProfile, getCustomerSubscription } from '../../data/mockData';
import { styles } from '../../styles/commonStyles';

export const CustomerSubscriptionDetailScreen = ({ pop, push, customerEmail, subscriptionId }) => {
  const customer = getCustomerProfile(customerEmail);
  const subscription = getCustomerSubscription(customerEmail, subscriptionId);

  return (
    <ScreenShell
      title={subscription.id}
      subtitle={`${customer.name} subscription details`}
      onBack={pop}
      backgroundColor="#ffe4e1"
    >
      <View style={styles.listItem}>
        <Text style={styles.sectionTitle}>Subscription Details</Text>
        <Row label="Plan" value={subscription.plan} />
        <Row label="Status" value={subscription.status} />
        <Row label="Start Date" value={subscription.startDate} />
        <Row label="Renewal Date" value={subscription.renewalDate} />
        <Row label="Items Remaining" value={formatRemainingItems(subscription.itemsRemaining)} />
      </View>

      <Text style={styles.sectionTitle}>Items</Text>
      {subscription.items.map((item) => (
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

      {subscription.itemsRemaining > 0 ? (
        <TouchableOpacity
          onPress={() =>
            push('customerItemEntry', {
              email: customer.email,
              sourceType: 'subscription',
              sourceId: subscription.id,
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
