// @ts-nocheck
import React, { useEffect, useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Row } from '../../components/Row';
import { ScreenShell } from '../../components/ScreenShell';
import { useLoader } from '../../utils/LoaderContextShared';
import { useSwapStore } from '../../store/swapStore';
import { styles } from '../../styles/commonStyles';
import { formatPickupDate, getPickupCreatedAtTimestamp, getPickupRemainingItems, getPickupStatusDisplay } from '../../utils/pickupDisplay';

const formatTotalItems = (pickup) => String(pickup?.number_of_items_c || pickup?.totalItems || 0);

export const CustomerPickupsScreen = ({ pop, push, customerEmail }) => {
  const { withLoader } = useLoader();
  const profileEntry = useSwapStore((state) => state.currentCustomerData.profile);
  const pickupsEntry = useSwapStore((state) => state.currentCustomerData.pickups);
  const fetchCustomerProfileIfNeeded = useSwapStore((state) => state.fetchCustomerProfileIfNeeded);
  const fetchCustomerPickupsIfNeeded = useSwapStore((state) => state.fetchCustomerPickupsIfNeeded);
  const canUseCache = useSwapStore((state) => state.isCustomerCacheUsable);
  const customer = profileEntry.data;
  const pickups = Array.isArray(pickupsEntry.data) ? pickupsEntry.data : [];
  const error = profileEntry.error || pickupsEntry.error || '';
  const { pickupsWithRemainingItems, pickupsWithoutRemainingItems } = useMemo(() => {
    const sortedPickups = [...pickups];
    const withRemainingItems = [];
    const withoutRemainingItems = [];

    sortedPickups.forEach((pickup) => {
      if (getPickupRemainingItems(pickup) > 0) {
        withRemainingItems.push(pickup);
        return;
      }

      withoutRemainingItems.push(pickup);
    });

    withRemainingItems.sort((left, right) => getPickupCreatedAtTimestamp(left) - getPickupCreatedAtTimestamp(right));
    withoutRemainingItems.sort((left, right) => getPickupCreatedAtTimestamp(right) - getPickupCreatedAtTimestamp(left));

    return {
      pickupsWithRemainingItems: withRemainingItems,
      pickupsWithoutRemainingItems: withoutRemainingItems,
    };
  }, [pickups]);

  useEffect(() => {
    const loadData = async () => {
      const state = useSwapStore.getState();
      const latestProfileEntry = state.currentCustomerData.profile;
      const latestPickupsEntry = state.currentCustomerData.pickups;
      const profilePromise = fetchCustomerProfileIfNeeded(customerEmail);
      const pickupsPromise = fetchCustomerPickupsIfNeeded(customerEmail);
      const hasUsableCache = canUseCache(latestProfileEntry) && canUseCache(latestPickupsEntry);

      try {
        if (hasUsableCache) {
          await Promise.all([profilePromise, pickupsPromise]);
        } else {
          await withLoader(Promise.all([profilePromise, pickupsPromise]), 'Loading pickups...');
        }
        const latestState = useSwapStore.getState();
        console.log('[swapUi] CustomerPickupsScreen loaded', {
          customerEmail,
          pickupCount: Array.isArray(latestState.currentCustomerData.pickups?.data)
            ? latestState.currentCustomerData.pickups.data.length
            : 0,
          pickupsEntry: latestState.currentCustomerData.pickups,
        });
      } catch {
        // Store entries capture fetch errors for rendering.
      }
    };

    loadData();
  }, [canUseCache, customerEmail, fetchCustomerPickupsIfNeeded, fetchCustomerProfileIfNeeded, withLoader]);

  if (!customer) {
    return (
      <ScreenShell title="Pickups" subtitle={error || 'Loading pickup list...'} onBack={pop} backgroundColor="#ffe4e1">
        <Text>{error || 'Loading...'}</Text>
      </ScreenShell>
    );
  }

  const renderPickupCard = (pickup, activePickups = false) => {
    const statusDisplay = getPickupStatusDisplay(pickup);
    const remainingItems = getPickupRemainingItems(pickup);
    const hasRemainingItems = remainingItems > 0;

    return (
      <TouchableOpacity
        key={pickup.id}
        onPress={() => push('customerPickupDetail', { email: customer.email, pickupId: pickup.id })}
        style={styles.pressableListItem}
      >
        <Row label="Pickup ID" value={pickup.unique_id_c || pickup.id} />
        <Row label="Number of Items" value={formatTotalItems(pickup)} />
        <Row label="Trip Date" value={formatPickupDate(pickup)} />
        <View style={styles.row}>
          <Text style={[styles.rowLabel, hasRemainingItems ? styles.pickupRemainingLabelActive : null]}>Items Remaining</Text>
          <Text
            style={[
              styles.rowValue,
              hasRemainingItems ? styles.pickupRemainingValue : styles.pickupRemainingValueInactive,
            ]}
          >
            {String(remainingItems)}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Status</Text>
          <Text style={[styles.rowValue, statusDisplay.isCompleted ? styles.pickupStatusText : null]}>{statusDisplay.text}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenShell title="Pickups" subtitle={`${customer.name} pickup list`} onBack={pop} backgroundColor="#ffe4e1">
      {pickups.length === 0 ? <Text>{error || 'No pickups found for this customer.'}</Text> : null}
      {pickupsWithRemainingItems.length > 0 ? (
        <View style={styles.pickupSection}>
          {/* <Text style={styles.sectionTitle}>Items Remaining</Text>
          <Text style={styles.sectionSubtitle}>Ordered by created date ascending</Text> */}
          {pickupsWithRemainingItems.map(renderPickupCard)}
        </View>
      ) : null}
      {pickupsWithoutRemainingItems.length > 0 ? (
        <View style={styles.pickupSection}>
          {/* <Text style={styles.sectionTitle}>No Items Remaining</Text>
          <Text style={styles.sectionSubtitle}>Ordered by created date descending</Text> */}
          {pickupsWithoutRemainingItems.map(renderPickupCard)}
        </View>
      ) : null}
    </ScreenShell>
  );
};
