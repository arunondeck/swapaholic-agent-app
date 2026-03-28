import React, { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { formatRemainingItems } from '../../api/swapOpsApi';
import { ProductCard } from '../../components/ProductCard';
import { Row } from '../../components/Row';
import { ScreenShell } from '../../components/ScreenShell';
import { useLoader } from '../../context/LoaderContext';
import { useSwapStore } from '../../store/swapStore';
import { styles } from '../../styles/commonStyles';

export const CustomerSubscriptionDetailScreen = ({ pop, push, customerEmail, subscriptionId }) => {
  const { withLoader } = useLoader();
  const profileEntry = useSwapStore((state) => state.currentCustomerData.profile);
  const subscriptionEntry = useSwapStore((state) => state.currentCustomerData.subscriptionDetailsById[String(subscriptionId)] || null);
  const fetchCustomerProfileIfNeeded = useSwapStore((state) => state.fetchCustomerProfileIfNeeded);
  const fetchCustomerSubscriptionDetailIfNeeded = useSwapStore((state) => state.fetchCustomerSubscriptionDetailIfNeeded);
  const canUseCache = useSwapStore((state) => state.isCustomerCacheUsable);
  const customer = profileEntry.data;
  const subscription = subscriptionEntry?.data || null;
  const error = profileEntry.error || subscriptionEntry?.error || '';

  useEffect(() => {
    const loadData = async () => {
      const profilePromise = fetchCustomerProfileIfNeeded(customerEmail);
      const subscriptionPromise = fetchCustomerSubscriptionDetailIfNeeded(customerEmail, subscriptionId);
      const hasUsableCache = canUseCache(profileEntry) && canUseCache(subscriptionEntry);

      try {
        if (hasUsableCache) {
          await Promise.all([profilePromise, subscriptionPromise]);
        } else {
          await withLoader(Promise.all([profilePromise, subscriptionPromise]), 'Loading subscription details...');
        }
      } catch {
        // Store entries capture fetch errors for rendering.
      }
    };

    loadData();
  }, [canUseCache, customerEmail, fetchCustomerProfileIfNeeded, fetchCustomerSubscriptionDetailIfNeeded, profileEntry, subscriptionEntry, subscriptionId, withLoader]);

  if (!customer || !subscription) {
    return (
      <ScreenShell title="Subscription" subtitle={error || 'Loading subscription details...'} onBack={pop} backgroundColor="#ffe4e1">
        <Text>{error || 'Loading...'}</Text>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      title={subscription.id}
      subtitle={`${customer.name} subscription details`}
      onBack={pop}
      backgroundColor="#ffe4e1"
    >
      <View style={styles.listItem}>
        <Text style={styles.sectionTitle}>Subscription Details</Text>
        <Row label="Plan" value={subscription.plan} />
        <Row label="Status" value={subscription.status} />
        <Row label="Start Date" value={subscription.startDate} />
        <Row label="Renewal Date" value={subscription.renewalDate} />
        <Row label="Items Remaining" value={formatRemainingItems(subscription.itemsRemaining)} />
      </View>

      <Text style={styles.sectionTitle}>Items</Text>
      {(subscription.items || []).map((item) => (
        <ProductCard
          key={item.id}
          product={item}
          subtitle={`Item ID: ${item.unique_item_id_c || item.id} | ${item.category?.name || 'NA'} | ${item.style?.name || 'NA'}`}
        />
      ))}

      {subscription.itemsRemaining > 0 ? (
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
