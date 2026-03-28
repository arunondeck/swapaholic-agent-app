import React, { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { formatRemainingItems, getPickupStatus } from '../../api/swapOpsApi';
import { ProductCard } from '../../components/ProductCard';
import { Row } from '../../components/Row';
import { ScreenShell } from '../../components/ScreenShell';
import { useLoader } from '../../context/LoaderContext';
import { useSwapStore } from '../../store/swapStore';
import { styles } from '../../styles/commonStyles';

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
      const profilePromise = fetchCustomerProfileIfNeeded(customerEmail);
      const pickupPromise = fetchCustomerPickupDetailIfNeeded(customerEmail, pickupId);
      const hasUsableCache = canUseCache(profileEntry) && canUseCache(pickupEntry);

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
  }, [canUseCache, customerEmail, fetchCustomerPickupDetailIfNeeded, fetchCustomerProfileIfNeeded, pickupEntry, pickupId, profileEntry, withLoader]);

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
