import React, { useEffect, useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { getLatestPickupForSubscription } from '../../api/swapOpsApi';
import { ScreenShell } from '../../components/ScreenShell';
import { useLoader } from '../../context/LoaderContext';
import { buildCustomerUnreviewedItemsCacheKey, useSwapStore } from '../../store/swapStore';
import { styles } from '../../styles/commonStyles';

const getPendingReviewItems = (response) => {
  if (Array.isArray(response?.success?.data?.items)) {
    return response.success.data.items;
  }

  if (Array.isArray(response?.error?.data?.items)) {
    return response.error.data.items;
  }

  return [];
};

const getPendingReviewCount = (response) => {
  const successCount = Number(response?.success?.data?.total_count);
  if (!Number.isNaN(successCount) && successCount >= 0) {
    return successCount;
  }

  const errorCount = Number(response?.error?.data?.total_count);
  if (!Number.isNaN(errorCount) && errorCount >= 0) {
    return errorCount;
  }

  return getPendingReviewItems(response).length;
};

const parseDateValue = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getActivePackageDisplayName = (shopSubscribe, fallbackName = '') => {
  const subscriptionName = String(shopSubscribe?.subscription?.name || shopSubscribe?.name || fallbackName || '').trim();
  const normalizedSubscriptionName = subscriptionName.toLowerCase();

  if (!subscriptionName) {
    return fallbackName;
  }

  if (normalizedSubscriptionName === 'buy points') {
    const pointCount = Number.parseInt(String(shopSubscribe?.number_of_points_c || 0), 10) || 0;
    return `${subscriptionName} ${pointCount} Points`;
  }

  if (normalizedSubscriptionName === 'flexi swap shopper' || normalizedSubscriptionName === 'flexi swqap shoppepr') {
    const itemCount = Number.parseInt(String(shopSubscribe?.number_of_items_c || 0), 10) || 0;
    return `${subscriptionName} ${itemCount} Items`;
  }

  return subscriptionName;
};

const findLatestPickupForSubscription = (pickups, subscriptionId) => {
  const normalizedSubscriptionId = String(subscriptionId || '').trim();
  if (!normalizedSubscriptionId || !Array.isArray(pickups)) {
    return null;
  }

  return pickups.find((pickup) => String(pickup?.subscriptionId || '').trim() === normalizedSubscriptionId) || null;
};

export const CustomerOverviewScreen = ({ push, pop, customerEmail }) => {
  const activeCustomer = useSwapStore((state) => state.activeCustomer);
  const fetchShopSubscriptions = useSwapStore((state) => state.fetchShopSubscriptions);
  const profileEntry = useSwapStore((state) => state.currentCustomerData.profile);
  const activePackageEntry = useSwapStore((state) => state.currentCustomerData.activePackage);
  const pickupsEntry = useSwapStore((state) => state.currentCustomerData.pickups);
  const reviewCacheKey = buildCustomerUnreviewedItemsCacheKey({ maxResults: 21, offset: 0, filters: [] });
  const pendingReviewEntry = useSwapStore((state) => state.currentCustomerData.unreviewedItemsByKey[reviewCacheKey] || null);
  const fetchCustomerProfileIfNeeded = useSwapStore((state) => state.fetchCustomerProfileIfNeeded);
  const fetchCustomerActivePackageIfNeeded = useSwapStore((state) => state.fetchCustomerActivePackageIfNeeded);
  const fetchCustomerPickupsIfNeeded = useSwapStore((state) => state.fetchCustomerPickupsIfNeeded);
  const fetchCustomerUnreviewedItemsIfNeeded = useSwapStore((state) => state.fetchCustomerUnreviewedItemsIfNeeded);
  const primeCustomerPickupDetail = useSwapStore((state) => state.primeCustomerPickupDetail);
  const canUseCache = useSwapStore((state) => state.isCustomerCacheUsable);
  const activeEmail = customerEmail || activeCustomer?.email || '';
  const activeToken = activeCustomer?.token || activeCustomer?.loginResponse?.token || '';
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const [moreActionsOpen, setMoreActionsOpen] = useState(false);
  const { withLoader } = useLoader();
  const customer = profileEntry.data;
  const activeSubscription = activePackageEntry.data;
  const pickups = Array.isArray(pickupsEntry.data) ? pickupsEntry.data : [];
  const error = profileEntry.error || activePackageEntry.error || pickupsEntry.error || pendingReviewEntry?.error || '';

  useEffect(() => {
    fetchShopSubscriptions().catch(() => null);
  }, [fetchShopSubscriptions]);

  useEffect(() => {
    const loadCustomer = async () => {
      const state = useSwapStore.getState();
      const latestProfileEntry = state.currentCustomerData.profile;
      const latestActivePackageEntry = state.currentCustomerData.activePackage;
      const latestPickupsEntry = state.currentCustomerData.pickups;
      const latestPendingReviewEntry = state.currentCustomerData.unreviewedItemsByKey[reviewCacheKey] || null;
      const profilePromise = fetchCustomerProfileIfNeeded(activeEmail);
      const activePackagePromise = fetchCustomerActivePackageIfNeeded(activeEmail);
      const pickupsPromise = fetchCustomerPickupsIfNeeded(activeEmail);
      const unreviewedPromise = fetchCustomerUnreviewedItemsIfNeeded({
        maxResults: 21,
        offset: 0,
        customerEmail: activeEmail,
        authToken: activeToken,
      });
      const hasUsableCache =
        canUseCache(latestProfileEntry) &&
        canUseCache(latestActivePackageEntry) &&
        canUseCache(latestPickupsEntry) &&
        canUseCache(latestPendingReviewEntry);

      try {
        const request = Promise.all([profilePromise, activePackagePromise, pickupsPromise, unreviewedPromise]);
        const [, , , pendingReviewResponse] = hasUsableCache
          ? await request
          : await withLoader(request, 'Loading customer...');

        setPendingReviewCount(getPendingReviewCount(pendingReviewResponse));
      } catch {
        const pendingData = getPendingReviewItems(latestPendingReviewEntry?.data);
        setPendingReviewCount(pendingData.length);
      }
    };

    loadCustomer();
  }, [
    activeEmail,
    activeToken,
    canUseCache,
    fetchCustomerActivePackageIfNeeded,
    fetchCustomerPickupsIfNeeded,
    fetchCustomerProfileIfNeeded,
    fetchCustomerUnreviewedItemsIfNeeded,
    primeCustomerPickupDetail,
    reviewCacheKey,
    withLoader,
  ]);

  useEffect(() => {
    if (pendingReviewEntry?.data) {
      setPendingReviewCount(getPendingReviewCount(pendingReviewEntry.data));
    } else if (!canUseCache(pendingReviewEntry)) {
      setPendingReviewCount(0);
    }
  }, [canUseCache, pendingReviewEntry]);

  const shopSubscribe = customer?.customerSubscribe?.shop_subscribe || null;
  const itemsSwappedInSummary = useMemo(() => {
    const acceptedItems = Number.parseInt(String(shopSubscribe?.number_of_accepted_items_c || 0), 10) || 0;
    const totalItems = Number.parseInt(String(shopSubscribe?.number_of_items_c || 0), 10) || 0;
    return `${acceptedItems}/${totalItems}`;
  }, [shopSubscribe]);

  if (!customer) {
    return (
      <ScreenShell title="Customer" subtitle={error || 'Loading customer details...'} onBack={pop} backgroundColor="#e7f7ef">
        {error ? <Text>{error}</Text> : null}
      </ScreenShell>
    );
  }

  const shopSubscribeExpiry = parseDateValue(shopSubscribe?.expiry_date_c);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isShopSubscribeExpired = shopSubscribeExpiry ? shopSubscribeExpiry < today : false;
  const hasActiveShopSubscribe = Boolean(shopSubscribe && !isShopSubscribeExpired);
  const latestSubscriptionId = shopSubscribe?.id || activeSubscription?.id || '';
  const linkedPickup = findLatestPickupForSubscription(pickups, latestSubscriptionId);
  const displayedPackageName = getActivePackageDisplayName(shopSubscribe, customer.activePackage || activeSubscription?.plan || '');
  const displayedPackageSubtitle = isShopSubscribeExpired
    ? 'Expired'
    : hasActiveShopSubscribe && activeSubscription
      ? `${activeSubscription.status} | Renews ${activeSubscription.renewalDate || 'NA'}`
      : '';
  const canOpenLatestPackage = Boolean(displayedPackageName && latestSubscriptionId);

  return (
    <ScreenShell title={customer.name} subtitle={customer.email} onBack={pop} backgroundColor="#e7f7ef">
      <View style={styles.overviewTable}>
        <View style={styles.overviewTableRow}>
          <View style={[styles.overviewTableCell, styles.overviewTableCellWithDivider]}>
            <Text style={styles.overviewTableLabel}>Total Points</Text>
            <Text style={styles.overviewTableValue}>{customer.points}</Text>
          </View>
          <View style={styles.overviewTableCell}>
            <Text style={styles.overviewTableLabel}>Points Expiry</Text>
            <Text style={styles.overviewTableValue}>{customer.pointsExpiryDate}</Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={canOpenLatestPackage ? 0.8 : 1}
          onPress={
            canOpenLatestPackage
              ? async () => {
                  if (linkedPickup?.id) {
                    push('customerPickupDetail', {
                      email: customer.email,
                      pickupId: linkedPickup.id,
                    });
                    return;
                  }

                  const pickupFromApi = await getLatestPickupForSubscription(customer.email, latestSubscriptionId).catch(() => null);

                  if (pickupFromApi?.id) {
                    primeCustomerPickupDetail(pickupFromApi.id, pickupFromApi);
                    push('customerPickupDetail', {
                      email: customer.email,
                      pickupId: pickupFromApi.id,
                    });
                    return;
                  }

                  if (activeSubscription?.id) {
                    push('customerSubscriptionDetail', {
                      email: customer.email,
                      subscriptionId: activeSubscription.id,
                    });
                  }
                }
              : undefined
          }
          style={[styles.overviewTableRow, styles.overviewTableRowBorder]}
        >
          <View style={styles.overviewTableCell}>
            <Text style={styles.overviewTableLabel}>Latest Package</Text>
            <Text
              style={[
                styles.overviewTableValue,
                isShopSubscribeExpired ? styles.overviewTableValueExpired : null,
                canOpenLatestPackage ? styles.overviewTableLinkValue : null,
              ]}
            >
              {displayedPackageName}
            </Text>
            {displayedPackageSubtitle ? (
              <Text style={[styles.overviewTableHint, isShopSubscribeExpired ? styles.overviewTableHintExpired : null]}>
                {displayedPackageSubtitle}
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>

        <View style={[styles.overviewTableRow, styles.overviewTableRowBorder]}>
          <View style={styles.overviewTableCell}>
            <Text style={styles.overviewTableLabel}>Items Swapped In</Text>
            <Text style={styles.overviewTableValue}>{itemsSwappedInSummary}</Text>
            <Text style={styles.overviewTableHint}>Accepted items / package total</Text>
          </View>
        </View>
      </View>

      <View style={styles.overviewActionGrid}>
        <TouchableOpacity style={styles.overviewActionButton} onPress={() => push('checkout', { email: customer.email, mode: 'customer' })}>
          <Text style={styles.overviewActionTitle}>Checkout</Text>
          <Text style={styles.overviewActionSubtitle}>Checkout with points</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.overviewActionButton} onPress={() => push('buySubscription', { email: customer.email })}>
          <Text style={styles.overviewActionTitle}>Buy Flexi Plan</Text>
          <Text style={styles.overviewActionSubtitle}>Buy a flexi item plan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.overviewActionButton}
          onPress={() => {
            push('customerPickups', { email: customer.email });
          }}
        >
          <Text style={styles.overviewActionTitle}>Swap In</Text>
          <Text style={styles.overviewActionSubtitle}>Add items to subscription or pickup</Text>
        </TouchableOpacity>

        {/* {pendingReviewCount > 0 ? ( */}
          <TouchableOpacity style={styles.overviewActionButton} onPress={() => push('approval', { email: customer.email })}>
            <Text style={styles.overviewActionTitle}>Review Points</Text>
            <Text style={styles.overviewActionSubtitle}>
              {pendingReviewCount} item{pendingReviewCount === 1 ? '' : 's'} pending review
            </Text>
          </TouchableOpacity>
        {/* ) : null} */}
      </View>

      <View style={styles.overviewDivider} />

      <View style={styles.overviewMoreActionsPanel}>
        <TouchableOpacity style={styles.overviewMoreActionsHeader} onPress={() => setMoreActionsOpen((current) => !current)}>
          <Text style={styles.overviewMoreActionsTitle}>More Actions</Text>
          <Text style={styles.overviewMoreActionsToggle}>{moreActionsOpen ? 'Hide' : 'Show'}</Text>
        </TouchableOpacity>

        {moreActionsOpen ? (
          <View style={styles.overviewMoreActionsBody}>
            <TouchableOpacity style={styles.overviewSecondaryActionButton} onPress={() => push('customerSwappedIn', { email: customer.email })}>
              <Text style={styles.overviewSecondaryActionText}>All Items Swapped In</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.overviewSecondaryActionButton} onPress={() => push('customerOrders', { email: customer.email })}>
              <Text style={styles.overviewSecondaryActionText}>All Items Swapped Out</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.overviewSecondaryActionButton} onPress={() => push('customerSubscriptions', { email: customer.email })}>
              <Text style={styles.overviewSecondaryActionText}>All Subscriptions</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.overviewSecondaryActionButton} onPress={() => push('customerPickups', { email: customer.email })}>
              <Text style={styles.overviewSecondaryActionText}>All Pickups</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </ScreenShell>
  );
};
