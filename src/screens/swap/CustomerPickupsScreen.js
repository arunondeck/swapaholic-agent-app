import React, { useEffect } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { getPickupStatus } from '../../api/swapOpsApi';
import { Row } from '../../components/Row';
import { ScreenShell } from '../../components/ScreenShell';
import { useLoader } from '../../context/LoaderContext';
import { useSwapStore } from '../../store/swapStore';
import { styles } from '../../styles/commonStyles';

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
