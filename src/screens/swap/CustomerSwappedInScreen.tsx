import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { ProductCard } from '../../components/ProductCard';
import { ScreenShell } from '../../components/ScreenShell';
import { useLoader } from '../../utils/LoaderContextShared';
import { useSwapStore } from '../../store/swapStore';

export const CustomerSwappedInScreen = ({ pop, customerEmail }) => {
  const { withLoader } = useLoader();
  const profileEntry = useSwapStore((state) => state.currentCustomerData.profile);
  const swappedInItemsEntry = useSwapStore((state) => state.currentCustomerData.swappedInItems);
  const fetchCustomerProfileIfNeeded = useSwapStore((state) => state.fetchCustomerProfileIfNeeded);
  const fetchCustomerSwappedInItemsIfNeeded = useSwapStore((state) => state.fetchCustomerSwappedInItemsIfNeeded);
  const canUseCache = useSwapStore((state) => state.isCustomerCacheUsable);
  const customer = profileEntry.data;
  const items = Array.isArray(swappedInItemsEntry.data) ? swappedInItemsEntry.data : [];
  const error = profileEntry.error || swappedInItemsEntry.error || '';

  useEffect(() => {
    const loadData = async () => {
      const state = useSwapStore.getState();
      const latestProfileEntry = state.currentCustomerData.profile;
      const latestSwappedItemsEntry = state.currentCustomerData.swappedInItems;
      const profilePromise = fetchCustomerProfileIfNeeded(customerEmail);
      const swappedItemsPromise = fetchCustomerSwappedInItemsIfNeeded(customerEmail);
      const hasUsableCache = canUseCache(latestProfileEntry) && canUseCache(latestSwappedItemsEntry);

      try {
        if (hasUsableCache) {
          await Promise.all([profilePromise, swappedItemsPromise]);
        } else {
          await withLoader(Promise.all([profilePromise, swappedItemsPromise]), 'Loading swapped items...');
        }
      } catch {
        // Store entries capture fetch errors for rendering.
      }
    };

    loadData();
  }, [canUseCache, customerEmail, fetchCustomerProfileIfNeeded, fetchCustomerSwappedInItemsIfNeeded, withLoader]);

  if (!customer) {
    return (
      <ScreenShell title="Items Swapped In" subtitle={error || 'Loading swap-in list...'} onBack={pop} backgroundColor="#ffe4e1">
        <Text>{error || 'Loading...'}</Text>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title="Items Swapped In" subtitle={`${customer.name} swap-in list`} onBack={pop} backgroundColor="#ffe4e1">
      {items.map((item) => (
        <ProductCard key={item.id} product={item} subtitle={`Item ID: ${item.unique_item_id_c || item.id} | Category: ${item.category?.name || 'NA'}`} />
      ))}
    </ScreenShell>
  );
};
