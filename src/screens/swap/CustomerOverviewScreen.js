import React, { useEffect, useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { getLatestPickupForSubscription } from '../../api/swapOpsApi';
import { ScreenShell } from '../../components/ScreenShell';
import { useLoader } from '../../utils/LoaderContextShared';
import { buildCustomerUnreviewedItemsCacheKey, useSwapStore } from '../../store/swapStore';
import { styles } from '../../styles/commonStyles';
import { getSubscriptionKind } from '../../utils/subscriptionDisplay';

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

const getActiveSubscriptionDisplayName = (subscription, fallbackName = '') => {
  const planName = String(subscription?.plan || fallbackName || '').trim();
  const normalizedPlanName = planName.toLowerCase();
  const numberOfItems = Number.parseInt(String(subscription?.numberOfItems || 0), 10) || 0;
  const numberOfPoints = Number.parseInt(String(subscription?.numberOfPoints || 0), 10) || 0;

  if (!planName) {
    return fallbackName;
  }

  if (normalizedPlanName === 'buy points') {
    return `${planName} ${numberOfPoints} Points`;
  }

  if (normalizedPlanName === 'flexi swap shopper' || normalizedPlanName === 'flexi swqap shoppepr') {
    return `${planName} ${numberOfItems} Items`;
  }

  return planName;
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
  const subscriptionsEntry = useSwapStore((state) => state.currentCustomerData.subscriptions);
  const pickupsEntry = useSwapStore((state) => state.currentCustomerData.pickups);
  const reviewCacheKey = buildCustomerUnreviewedItemsCacheKey({ maxResults: 21, offset: 0, filters: [] });
  const pendingReviewEntry = useSwapStore((state) => state.currentCustomerData.unreviewedItemsByKey[reviewCacheKey] || null);
  const fetchCustomerProfileIfNeeded = useSwapStore((state) => state.fetchCustomerProfileIfNeeded);
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
  const subscriptions = Array.isArray(subscriptionsEntry.data) ? subscriptionsEntry.data : [];
  const pickups = Array.isArray(pickupsEntry.data) ? pickupsEntry.data : [];
  const error = profileEntry.error || activePackageEntry.error || subscriptionsEntry.error || pickupsEntry.error || pendingReviewEntry?.error || '';

  useEffect(() => {
    fetchShopSubscriptions().catch(() => null);
  }, [fetchShopSubscriptions]);

  useEffect(() => {
    const loadCustomer = async () => {
      const state = useSwapStore.getState();
      const latestProfileEntry = state.currentCustomerData.profile;
      const latestPickupsEntry = state.currentCustomerData.pickups;
      const latestPendingReviewEntry = state.currentCustomerData.unreviewedItemsByKey[reviewCacheKey] || null;
      const profilePromise = fetchCustomerProfileIfNeeded(activeEmail);
      const pickupsPromise = fetchCustomerPickupsIfNeeded(activeEmail);
      const unreviewedPromise = fetchCustomerUnreviewedItemsIfNeeded({
        maxResults: 21,
        offset: 0,
        customerEmail: activeEmail,
        authToken: activeToken,
      });
      const hasUsableCache =
        canUseCache(latestProfileEntry) &&
        canUseCache(latestPickupsEntry) &&
        canUseCache(latestPendingReviewEntry);

      try {
        const request = Promise.all([profilePromise, pickupsPromise, unreviewedPromise]);
        const [, , pendingReviewResponse] = hasUsableCache
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

  const activeSubscriptionFallback =
    subscriptions.find((entry) => String(entry?.status || '').trim().toLowerCase() === 'active') || null;
  const currentSubscription = activeSubscription || activeSubscriptionFallback || null;
  const itemsSwappedInSummary = useMemo(() => {
    const acceptedItems = Number.parseInt(
      String(currentSubscription?.acceptedItems ?? 0),
      10
    ) || 0;
    const totalItems = Number.parseInt(
      String(currentSubscription?.numberOfItems ?? 0),
      10
    ) || 0;
    return `${acceptedItems}/${totalItems}`;
  }, [currentSubscription]);

  if (!customer) {
    return (
      <ScreenShell title="Customer" subtitle={error || 'Loading customer details...'} onBack={pop} backgroundColor="#e7f7ef">
        {error ? <Text>{error}</Text> : null}
      </ScreenShell>
    );
  }

  const currentSubscriptionExpiry = parseDateValue(currentSubscription?.renewalDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isCurrentSubscriptionExpired = currentSubscriptionExpiry ? currentSubscriptionExpiry < today : false;
  const hasActiveShopSubscribe =
    Boolean(currentSubscription?.id) &&
    !isCurrentSubscriptionExpired &&
    String(currentSubscription?.status || '').trim().toLowerCase() === 'active';
  const latestSubscriptionId = currentSubscription?.id || '';
  const linkedPickup = findLatestPickupForSubscription(pickups, latestSubscriptionId);
  const displayedPackageName = currentSubscription?.id
    ? getActiveSubscriptionDisplayName(currentSubscription, customer.activePackage || '')
    : customer.activePackage || 'NA';
  const latestSubscriptionKind = getSubscriptionKind({
    plan: currentSubscription?.plan || '',
    subscriptionType: currentSubscription?.subscriptionType || '',
    subscriptionSubType: currentSubscription?.subscriptionSubType || '',
  });
  const displayedPackageSubtitle = isCurrentSubscriptionExpired
    ? 'Expired'
    : hasActiveShopSubscribe && currentSubscription
      ? `${currentSubscription.status} | Renews ${currentSubscription.renewalDate || 'NA'}`
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
                  if (latestSubscriptionKind === 'flexi' && linkedPickup?.id) {
                    push('customerPickupDetail', {
                      email: customer.email,
                      pickupId: linkedPickup.id,
                    });
                    return;
                  }

                  const pickupFromApi = latestSubscriptionKind === 'flexi'
                    ? await getLatestPickupForSubscription(customer.email, latestSubscriptionId).catch(() => null)
                    : null;

                  if (pickupFromApi?.id) {
                    primeCustomerPickupDetail(pickupFromApi.id, pickupFromApi);
                    push('customerPickupDetail', {
                      email: customer.email,
                      pickupId: pickupFromApi.id,
                    });
                    return;
                  }

                  if (currentSubscription?.id) {
                    push('customerSubscriptionDetail', {
                      email: customer.email,
                      subscriptionId: currentSubscription.id,
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
                isCurrentSubscriptionExpired ? styles.overviewTableValueExpired : null,
                canOpenLatestPackage ? styles.overviewTableLinkValue : null,
              ]}
            >
              {displayedPackageName}
            </Text>
            {displayedPackageSubtitle ? (
              <Text style={[styles.overviewTableHint, isCurrentSubscriptionExpired ? styles.overviewTableHintExpired : null]}>
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
