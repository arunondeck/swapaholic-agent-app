import React, { useEffect } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { formatRemainingItems } from '../../api/swapOpsApi';
import { Row } from '../../components/Row';
import { ScreenShell } from '../../components/ScreenShell';
import { useLoader } from '../../context/LoaderContext';
import { useSwapStore } from '../../store/swapStore';
import { styles } from '../../styles/commonStyles';

export const CustomerSubscriptionsScreen = ({ pop, push, customerEmail }) => {
  const { withLoader } = useLoader();
  const profileEntry = useSwapStore((state) => state.currentCustomerData.profile);
  const subscriptionsEntry = useSwapStore((state) => state.currentCustomerData.subscriptions);
  const fetchCustomerProfileIfNeeded = useSwapStore((state) => state.fetchCustomerProfileIfNeeded);
  const fetchCustomerSubscriptionsIfNeeded = useSwapStore((state) => state.fetchCustomerSubscriptionsIfNeeded);
  const canUseCache = useSwapStore((state) => state.isCustomerCacheUsable);
  const customer = profileEntry.data;
  const subscriptions = Array.isArray(subscriptionsEntry.data) ? subscriptionsEntry.data : [];
  const error = profileEntry.error || subscriptionsEntry.error || '';

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
      {subscriptions.map((subscription) => (
        <TouchableOpacity
          key={subscription.id}
          onPress={() => push('customerSubscriptionDetail', { email: customer.email, subscriptionId: subscription.id })}
          style={styles.pressableListItem}
        >
          <Row label="Subscription Id" value={subscription.id} />
          <Row label="Plan" value={subscription.plan} />
          <Row label="Status" value={subscription.status} />
          <Row label="Start Date" value={subscription.startDate} />
          <Row label="Renewal Date" value={subscription.renewalDate} />
          <Row label="Items Remaining" value={formatRemainingItems(subscription.itemsRemaining)} />
        </TouchableOpacity>
      ))}
    </ScreenShell>
  );
};
