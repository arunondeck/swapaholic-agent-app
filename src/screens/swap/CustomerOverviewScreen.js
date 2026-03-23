import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { getCustomerProfile } from '../../api/swapOpsApi';
import { Card } from '../../components/Card';
import { ScreenShell } from '../../components/ScreenShell';
import { useLoader } from '../../context/LoaderContext';
import { styles } from '../../styles/commonStyles';

const overviewStats = (customer) => [
  { label: 'Points', value: customer.points },
  { label: 'Active Package', value: customer.activePackage },
  { label: 'Points Expiry', value: customer.pointsExpiryDate },
  { label: 'Items Swapped In', value: String(customer.itemsSwappedIn) },
  { label: 'Items Swapped Out', value: String(customer.itemsSwappedOut) },
  { label: 'Orders Made', value: String(customer.ordersMade) },
];

export const CustomerOverviewScreen = ({ push, pop, customerEmail }) => {
  const [customer, setCustomer] = useState(null);
  const [error, setError] = useState('');
  const { withLoader } = useLoader();

  useEffect(() => {
    let active = true;

    const loadCustomer = async () => {
      try {
        setError('');
        const profile = await withLoader(getCustomerProfile(customerEmail), 'Loading customer...');
        if (active) {
          setCustomer(profile);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message || 'Failed to load customer');
        }
      }
    };

    loadCustomer();

    return () => {
      active = false;
    };
  }, [customerEmail, withLoader]);

  if (!customer) {
    return (
      <ScreenShell title="Customer" subtitle={error || 'Loading customer details...'} onBack={pop} backgroundColor="#ffe4e1">
        {error ? <Text>{error}</Text> : null}
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title={customer.name} subtitle={customer.email} onBack={pop} backgroundColor="#ffe4e1">
      <View style={styles.statsGrid}>
        {overviewStats(customer).map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
          </View>
        ))}
      </View>

      <Card
        title="Subscriptions"
        subtitle={`List all subscriptions bought by ${customer.name}`}
        onPress={() => push('customerSubscriptions', { email: customer.email })}
      />
      <Card title="Pickups" subtitle="List all pickups by customer" onPress={() => push('customerPickups', { email: customer.email })} />
      <Card title="Orders" subtitle="List all orders by customer" onPress={() => push('customerOrders', { email: customer.email })} />
      <Card
        title="Items Swapped In"
        subtitle="List all items swapped in"
        onPress={() => push('customerSwappedIn', { email: customer.email })}
      />
      <Card
        title="Checkout Page"
        subtitle="Scanner and cart list for point checkout"
        onPress={() => push('checkout', { email: customer.email })}
      />
      <Card
        title="Buy Subscription"
        subtitle="Select a subscription and optionally add extra points"
        onPress={() => push('buySubscription', { email: customer.email })}
      />
    </ScreenShell>
  );
};
