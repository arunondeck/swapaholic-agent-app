import React, { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ProductCard } from '../../components/ProductCard';
import { Row } from '../../components/Row';
import { ScreenShell } from '../../components/ScreenShell';
import { useLoader } from '../../context/LoaderContext';
import { useSwapStore } from '../../store/swapStore';
import { styles } from '../../styles/commonStyles';

const formatDateTime = (dateValue, timeValue = '') => {
  const date = String(dateValue || '').trim();
  const time = String(timeValue || '').trim();

  if (date && time) {
    return `${date} | ${time}`;
  }

  return date || time || 'NA';
};

export const CustomerPickupDetailScreen = ({ pop, push, customerEmail, pickupId }) => {
  const { withLoader } = useLoader();
  const profileEntry = useSwapStore((state) => state.currentCustomerData.profile);
  const pickupEntry = useSwapStore((state) => state.currentCustomerData.pickupDetailsById[String(pickupId)] || null);
  const fetchCustomerProfileIfNeeded = useSwapStore((state) => state.fetchCustomerProfileIfNeeded);
  const fetchCustomerPickupDetailIfNeeded = useSwapStore((state) => state.fetchCustomerPickupDetailIfNeeded);
  const canUseCache = useSwapStore((state) => state.isCustomerCacheUsable);
  const customer = profileEntry.data;
  const pickup = pickupEntry?.data || null;
  const error = profileEntry.error || pickupEntry?.error || '';

  useEffect(() => {
    const loadData = async () => {
      const state = useSwapStore.getState();
      const latestProfileEntry = state.currentCustomerData.profile;
      const latestPickupEntry = state.currentCustomerData.pickupDetailsById[String(pickupId)] || null;
      const profilePromise = fetchCustomerProfileIfNeeded(customerEmail);
      const pickupPromise = fetchCustomerPickupDetailIfNeeded(customerEmail, pickupId);
      const hasUsableCache = canUseCache(latestProfileEntry) && canUseCache(latestPickupEntry);

      try {
        if (hasUsableCache) {
          await Promise.all([profilePromise, pickupPromise]);
        } else {
          await withLoader(Promise.all([profilePromise, pickupPromise]), 'Loading pickup details...');
        }
      } catch {
        // Store entries capture fetch errors for rendering.
      }
    };

    loadData();
  }, [canUseCache, customerEmail, fetchCustomerPickupDetailIfNeeded, fetchCustomerProfileIfNeeded, pickupId, withLoader]);

  if (!customer || !pickup) {
    return (
      <ScreenShell title="Pickup" subtitle={error || 'Loading pickup details...'} onBack={pop} backgroundColor="#ffe4e1">
        <Text>{error || 'Loading...'}</Text>
      </ScreenShell>
    );
  }

  const pickupUniqueId = pickup.unique_id_c || pickup.id || 'NA';
  const subscribe = Array.isArray(pickup.subscribe) ? pickup.subscribe[0] || null : null;
  const subscribeUniqueId = subscribe?.unique_id_c || subscribe?.id || pickup.subscriptionId || 'NA';
  const subscribeName = subscribe?.name || 'NA';
  const tripDateTime = formatDateTime(pickup.trip_date_c || pickup.date, pickup.trip_time_c);
  const enteredDateTime = formatDateTime(pickup.date_entered, '');

  return (
    <ScreenShell title={pickupUniqueId} subtitle={`${customer.name} pickup details`} onBack={pop} backgroundColor="#ffe4e1">
      <View style={styles.listItem}>
        <Text style={styles.sectionTitle}>Pickup Summary</Text>
        <Row label="Pickup ID" value={pickupUniqueId} />
        <Row label="Subscribe ID" value={subscribeUniqueId} />
        <Row label="Trip Date & Time" value={tripDateTime} />
        <Row label="Entered Date & Time" value={enteredDateTime} />
        <Row label="Subscribe Name" value={subscribeName} />
      </View>

      <Text style={styles.sectionTitle}>Items Swapped In</Text>
      {(pickup.items || []).map((item) => (
        <ProductCard
          key={item.id}
          product={item}
          subtitle={`Item ID: ${item.unique_item_id_c || item.id} | ${item.category?.name || 'NA'} | ${item.style?.name || 'NA'}`}
        />
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
