import React, { useEffect, useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { formatRemainingItems } from '../../api/swapOpsApi';
import { Row } from '../../components/Row';
import { ScreenShell } from '../../components/ScreenShell';
import { useLoader } from '../../utils/LoaderContextShared';
import { useSwapStore } from '../../store/swapStore';
import { styles } from '../../styles/commonStyles';
import { formatSubscriptionDate, getSubscriptionKind, getSubscriptionStatusDisplay } from '../../utils/subscriptionDisplay';

const toWholeNumber = (value, fallback = 0) => {
  const parsed = Number.parseInt(String(value ?? fallback), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const parseSortDate = (value) => {
  if (!value) {
    return Number.NEGATIVE_INFINITY;
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
};

export const CustomerSubscriptionsScreen = ({ pop, push, customerEmail }) => {
  const { withLoader } = useLoader();
  const profileEntry = useSwapStore((state) => state.currentCustomerData.profile);
  const subscriptionsEntry = useSwapStore((state) => state.currentCustomerData.subscriptions);
  const fetchCustomerProfileIfNeeded = useSwapStore((state) => state.fetchCustomerProfileIfNeeded);
  const fetchCustomerSubscriptionsIfNeeded = useSwapStore((state) => state.fetchCustomerSubscriptionsIfNeeded);
  const canUseCache = useSwapStore((state) => state.isCustomerCacheUsable);
  const customer = profileEntry.data;
  /** @type {import('../../types/swapTypes').SwapSubscription[]} */
  const subscriptions = Array.isArray(subscriptionsEntry.data) ? subscriptionsEntry.data : [];
  const error = profileEntry.error || subscriptionsEntry.error || '';
  const orderedSubscriptions = useMemo(
    () =>
      [...subscriptions].sort((left, right) => parseSortDate(right?.renewalDate) - parseSortDate(left?.renewalDate)),
    [subscriptions]
  );

  useEffect(() => {
    const loadData = async () => {
      const state = useSwapStore.getState();
      const latestProfileEntry = state.currentCustomerData.profile;
      const latestSubscriptionsEntry = state.currentCustomerData.subscriptions;
      const profilePromise = fetchCustomerProfileIfNeeded(customerEmail);
      const subscriptionsPromise = fetchCustomerSubscriptionsIfNeeded(customerEmail);
      const hasUsableCache = canUseCache(latestProfileEntry) && canUseCache(latestSubscriptionsEntry);

      try {
        if (hasUsableCache) {
          await Promise.all([profilePromise, subscriptionsPromise]);
        } else {
          await withLoader(Promise.all([profilePromise, subscriptionsPromise]), 'Loading subscriptions...');
        }
      } catch {
        // Store entries capture fetch errors for rendering.
      }
    };

    loadData();
  }, [canUseCache, customerEmail, fetchCustomerProfileIfNeeded, fetchCustomerSubscriptionsIfNeeded, withLoader]);

  if (!customer) {
    return (
      <ScreenShell title="Subscriptions" subtitle={error || 'Loading subscription history...'} onBack={pop} backgroundColor="#ffe4e1">
        <Text>{error || 'Loading...'}</Text>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title="Subscriptions" subtitle={`${customer.name} subscription history`} onBack={pop} backgroundColor="#ffe4e1">
      {orderedSubscriptions.map((/** @type {import('../../types/swapTypes').SwapSubscription} */ subscription) => {
        const subscriptionKind = getSubscriptionKind(subscription);
        const totalItems = toWholeNumber(subscription.numberOfItems);
        const acceptedItems = toWholeNumber(subscription.acceptedItems);
        const remainingItems = Math.max(0, toWholeNumber(subscription.itemsRemaining, totalItems || 0));
        const derivedRemainingItems = totalItems > 0 ? Math.max(0, totalItems - acceptedItems) : remainingItems;
        const points = toWholeNumber(subscription.numberOfPoints);
        const displayId = subscription.uniqueId || subscription.id || 'NA';
        const statusDisplay = getSubscriptionStatusDisplay(subscription);

        return (
          <TouchableOpacity
            key={subscription.id}
            onPress={() => push('customerSubscriptionDetail', { email: customer.email, subscriptionId: subscription.id })}
            style={[styles.pressableListItem, statusDisplay.isCompleted ? styles.subscriptionCardCompleted : null]}
          >
            <View style={styles.subscriptionPlanRow}>
              <View style={styles.subscriptionPlanCopy}>
                <View style={styles.subscriptionIdentityBlock}>
                  <Text style={styles.rowLabel}>Subscription Id</Text>
                  <Text style={styles.subscriptionIdentityValue}>{displayId}</Text>
                </View>
                <Row label="Plan" value={subscription.plan} />
              </View>
              {subscriptionKind === 'buy-points' ? (
                <View style={styles.subscriptionBadge}>
                  <Text style={styles.subscriptionBadgeText}>Buy Points</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Status</Text>
              <Text style={[styles.rowValue, statusDisplay.isExpired ? styles.subscriptionStatusExpired : null]}>{statusDisplay.text}</Text>
            </View>
            <Row label="Start Date" value={formatSubscriptionDate(subscription.startDate)} />
            <Row label="Expiry Date" value={formatSubscriptionDate(subscription.renewalDate)} />
            {subscriptionKind === 'buy-points' ? <Row label="Points" value={`${points} points`} /> : null}
            {subscriptionKind !== 'buy-points' ? <Row label="Items" value={formatRemainingItems(totalItems)} /> : null}
            {subscriptionKind !== 'buy-points' ? (
              <Row label="Items Remaining" value={formatRemainingItems(derivedRemainingItems)} />
            ) : null}
          </TouchableOpacity>
        );
      })}
    </ScreenShell>
  );
};
