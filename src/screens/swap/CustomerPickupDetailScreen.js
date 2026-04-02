import React, { useEffect, useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Row } from '../../components/Row';
import { ScreenShell } from '../../components/ScreenShell';
import { SwappedInItemsSection } from '../../components/SwappedInItemsSection';
import { useLoader } from '../../utils/LoaderContextShared';
import { useSwapStore } from '../../store/swapStore';
import { styles } from '../../styles/commonStyles';
import { getRemainingItemsCount } from '../../utils/subscriptionMetrics';

const toNumber = (value, fallback = 0) => {
  const parsed = Number.parseInt(String(value ?? fallback), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const formatDateOnly = (value) => String(value || '').trim() || 'NA';

export const CustomerPickupDetailScreen = ({ pop, push, customerEmail, pickupId }) => {
  const { withLoader } = useLoader();
  const profileEntry = useSwapStore((state) => state.currentCustomerData.profile);
  const pickupEntry = useSwapStore((state) => state.currentCustomerData.pickupDetailsById[String(pickupId)] || null);
  const pickupRefreshRequest = useSwapStore((state) => state.currentCustomerData.pickupRefreshRequestsById[String(pickupId)] || null);
  const fetchCustomerProfileIfNeeded = useSwapStore((state) => state.fetchCustomerProfileIfNeeded);
  const fetchCustomerPickupDetailIfNeeded = useSwapStore((state) => state.fetchCustomerPickupDetailIfNeeded);
  const clearPickupDetailRefresh = useSwapStore((state) => state.clearPickupDetailRefresh);
  const canUseCache = useSwapStore((state) => state.isCustomerCacheUsable);
  const [isItemsRefreshing, setIsItemsRefreshing] = useState(false);
  const refreshTimeoutRef = useRef(null);
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

  useEffect(() => {
    if (!pickupRefreshRequest?.requestedAt) {
      return undefined;
    }

    setIsItemsRefreshing(true);
    refreshTimeoutRef.current = setTimeout(async () => {
      try {
        await fetchCustomerPickupDetailIfNeeded(customerEmail, pickupId, { force: true });
      } catch {
        // Store entry captures request errors for rendering.
      } finally {
        clearPickupDetailRefresh(pickupId);
        setIsItemsRefreshing(false);
      }
    }, 3000);

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [clearPickupDetailRefresh, customerEmail, fetchCustomerPickupDetailIfNeeded, pickupId, pickupRefreshRequest?.requestedAt]);

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
  const totalItems = toNumber(subscribe?.number_of_items_c, pickup.totalItems || 0);
  const acceptedItems = toNumber(subscribe?.number_of_accepted_items_c);
  const rejectedItems = toNumber(subscribe?.number_of_rejected_items_c);
  const remainingItems = getRemainingItemsCount(totalItems, pickup.items);
  const tripDate = formatDateOnly(pickup.trip_date_c || pickup.date);
  const enteredDate = formatDateOnly(pickup.date_entered);

  return (
    <ScreenShell title={subscribeName} subtitle="Pickup details for subscribe" onBack={pop} backgroundColor="#ffe4e1">
      <View style={styles.listItem}>
        <Text style={styles.sectionTitle}>Pickup Summary</Text>
        <Row label="Pickup ID" value={pickupUniqueId} />
        <Row label="Trip Date" value={tripDate} />
        <Row label="Subscribe Name" value={subscribeName} />
        <Row label="Number Of Items" value={String(totalItems)} />
        <Row label="Items Remaining" value={String(remainingItems)} />
      </View>

      <SwappedInItemsSection items={pickup.items || []} loading={isItemsRefreshing} />

      {remainingItems > 0 ? (
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
