import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { formatRemainingItems, getPickupsForSubscription } from '../../api/swapOpsApi';
import { Row } from '../../components/Row';
import { ScreenShell } from '../../components/ScreenShell';
import { SwappedInItemsSection } from '../../components/SwappedInItemsSection';
import { useLoader } from '../../utils/LoaderContextShared';
import { useSwapStore } from '../../store/swapStore';
import { styles } from '../../styles/commonStyles';
import { getRemainingItemsCount } from '../../utils/subscriptionMetrics';
import {
  formatSubscriptionDate,
  formatSubscriptionDateTime,
  getSubscriptionKind,
  getSubscriptionStatusDisplay,
  getSubscriptionTypeLabel,
} from '../../utils/subscriptionDisplay';

export const CustomerSubscriptionDetailScreen = ({ pop, push, customerEmail, subscriptionId, backToOverview = false }) => {
  const { withLoader } = useLoader();
  const profileEntry = useSwapStore((state) => state.currentCustomerData.profile);
  const activePackageEntry = useSwapStore((state) => state.currentCustomerData.activePackage);
  const subscriptionsEntry = useSwapStore((state) => state.currentCustomerData.subscriptions);
  const subscriptionDetailEntry = useSwapStore(
    (state) => state.currentCustomerData.subscriptionDetailsById[String(subscriptionId || '')] || null
  );
  const fetchCustomerProfileIfNeeded = useSwapStore((state) => state.fetchCustomerProfileIfNeeded);
  const fetchCustomerSubscriptionsIfNeeded = useSwapStore((state) => state.fetchCustomerSubscriptionsIfNeeded);
  const fetchCustomerSubscriptionDetailIfNeeded = useSwapStore((state) => state.fetchCustomerSubscriptionDetailIfNeeded);
  const canUseCache = useSwapStore((state) => state.isCustomerCacheUsable);
  const customer = profileEntry.data;
  const activeSubscription = activePackageEntry.data;
  /** @type {import('../../types/swapTypes').SwapSubscription[]} */
  const subscriptions = Array.isArray(subscriptionsEntry.data) ? subscriptionsEntry.data : [];
  /** @type {import('../../types/swapTypes').SwapSubscription | null} */
  const subscription =
    (String(activeSubscription?.id || '') === String(subscriptionId || '') ? activeSubscription : null) ||
    subscriptionDetailEntry?.data ||
    subscriptions.find((entry) => String(entry?.id || '') === String(subscriptionId || '')) ||
    null;
  const error = profileEntry.error || subscriptionsEntry.error || '';
  /** @type {[import('../../types/swapTypes').SwapPickup[], Function]} */
  const [subscriptionPickups, setSubscriptionPickups] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const state = useSwapStore.getState();
      const latestProfileEntry = state.currentCustomerData.profile;
      const latestSubscriptionsEntry = state.currentCustomerData.subscriptions;
      const latestSubscriptionDetailEntry = state.currentCustomerData.subscriptionDetailsById[String(subscriptionId || '')] || null;
      const profilePromise = fetchCustomerProfileIfNeeded(customerEmail);
      const subscriptionsPromise = fetchCustomerSubscriptionsIfNeeded(customerEmail);
      const detailPromise = subscriptionId
        ? fetchCustomerSubscriptionDetailIfNeeded(customerEmail, subscriptionId)
        : Promise.resolve(null);
      const hasUsableCache =
        canUseCache(latestProfileEntry) &&
        canUseCache(latestSubscriptionsEntry) &&
        (
          String(activeSubscription?.id || '') === String(subscriptionId || '') ||
          !subscriptionId ||
          canUseCache(latestSubscriptionDetailEntry)
        );

      try {
        if (hasUsableCache) {
          await Promise.all([profilePromise, subscriptionsPromise, detailPromise]);
        } else {
          await withLoader(Promise.all([profilePromise, subscriptionsPromise, detailPromise]), 'Loading subscription details...');
        }
      } catch {
        // Store entries capture fetch errors for rendering.
      }
    };

    loadData();
  }, [
    activeSubscription?.id,
    canUseCache,
    customerEmail,
    fetchCustomerProfileIfNeeded,
    fetchCustomerSubscriptionDetailIfNeeded,
    fetchCustomerSubscriptionsIfNeeded,
    subscriptionId,
    withLoader,
  ]);

  const displayId = subscription?.uniqueId || subscription?.id || 'NA';
  const subscriptionKind = getSubscriptionKind(subscription);
  const statusDisplay = getSubscriptionStatusDisplay(subscription);
  const latestPickup = subscriptionPickups[0] || null;
  const pickupDisplayId = latestPickup?.unique_id_c || latestPickup?.id || 'NA';
  const pickupAcceptedItems = Array.isArray(latestPickup?.subscribe)
    ? latestPickup.subscribe[0]?.number_of_accepted_items_c || String(subscription?.acceptedItems || 0)
    : String(subscription?.acceptedItems || 0);
  const pickupItems = subscriptionPickups.flatMap((pickup) => (Array.isArray(pickup?.items) ? pickup.items : []));
  const remainingItems = getRemainingItemsCount(subscription?.numberOfItems || 0, pickupItems);
  const handleBack = () => {
    if (backToOverview) {
      push('customerOverview', { email: customerEmail });
      return;
    }
    pop();
  };

  useEffect(() => {
    if (subscriptionKind !== 'flexi' || !subscription?.id) {
      setSubscriptionPickups([]);
      return;
    }

    let active = true;

    const loadPickups = async () => {
      try {
        const pickups = await withLoader(
          getPickupsForSubscription(customerEmail, subscription.id),
          'Loading subscription pickup items...'
        );
        if (!active) {
          return;
        }

        const orderedPickups = [...pickups].sort((left, right) => {
          const leftTime = new Date(left?.date_entered || left?.date || 0).getTime();
          const rightTime = new Date(right?.date_entered || right?.date || 0).getTime();
          return rightTime - leftTime;
        });
        setSubscriptionPickups(orderedPickups);
      } catch {
        if (active) {
          setSubscriptionPickups([]);
        }
      }
    };

    loadPickups();

    return () => {
      active = false;
    };
  }, [customerEmail, subscription?.id, subscriptionKind, withLoader]);

  if (!customer || !subscription) {
      return (
      <ScreenShell title="Subscription" subtitle={error || 'Loading subscription details...'} onBack={handleBack} backgroundColor="#ffe4e1">
        <Text>{error || 'Loading...'}</Text>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      title={displayId}
      subtitle={`${customer.name} subscription details`}
      onBack={handleBack}
      backgroundColor="#ffe4e1"
    >
      <View style={styles.listItem}>
        <Row label="Plan" value={subscription.plan} />
        {/* <Row label="Type" value={getSubscriptionTypeLabel(subscription)} /> */}
        <Row label="Activated" value={formatSubscriptionDateTime(subscription.startDate)} />
        <Row label="Expiry Date" value={formatSubscriptionDate(subscription.renewalDate)} />
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Status</Text>
          <Text style={[styles.rowValue, statusDisplay.isExpired ? styles.subscriptionStatusExpired : null]}>{statusDisplay.text}</Text>
        </View>
        {subscriptionKind === 'buy-points' ? <Row label="Number Of Points" value={String(subscription.numberOfPoints || 0)} /> : null}
        {subscriptionKind === 'flexi' ? <Row label="Number Of Items" value={String(subscription.numberOfItems || 0)} /> : null}
        <View style={styles.subscriptionDetailBlock}>
          <Text style={styles.rowLabel}>Description</Text>
          <Text style={styles.subscriptionDetailValue}>{subscription.description || 'NA'}</Text>
        </View>
        {subscriptionKind === 'flexi' ? <View style={styles.subscriptionDetailDivider} /> : null}
        {subscriptionKind === 'flexi' ? <Row label="Pickup Id" value={pickupDisplayId} /> : null}
        {subscriptionKind === 'flexi' ? <Row label="Accepted Items" value={String(pickupAcceptedItems || 0)} /> : null}
        {subscriptionKind === 'flexi' ? <Row label="Rejected Items" value={String(subscription.rejectedItems || 0)} /> : null}
        {subscriptionKind === 'flexi' ? <Row label="Items Swapped" value={String(subscription.itemsSwapped || 0)} /> : null}
        {subscriptionKind === 'flexi' ? <Row label="Deliveries Done" value={String(subscription.deliveriesDone || 0)} /> : null}
        {subscriptionKind === 'flexi' ? (
          <Row label="Items Remaining" value={formatRemainingItems(remainingItems)} />
        ) : null}
      </View>

      {subscriptionKind === 'flexi' ? <SwappedInItemsSection items={pickupItems} /> : null}

      {subscriptionKind === 'flexi' && remainingItems > 0 ? (
        <TouchableOpacity
          onPress={() =>
            push('customerItemEntry', {
              email: customer.email,
              sourceType: 'subscription',
              sourceId: subscription.id,
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
