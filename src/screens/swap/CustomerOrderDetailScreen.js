import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { SwapProductCard } from '../../components/SwapProductCard';
import { Row } from '../../components/Row';
import { ScreenShell } from '../../components/ScreenShell';
import { useLoader } from '../../utils/LoaderContextShared';
import { useSwapStore } from '../../store/swapStore';
import { styles } from '../../styles/commonStyles';

const formatOrderDate = (value) => {
  if (!value) {
    return 'NA';
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(parsedDate);
};

export const CustomerOrderDetailScreen = ({ pop, customerEmail, orderId }) => {
  const { withLoader } = useLoader();
  const profileEntry = useSwapStore((state) => state.currentCustomerData.profile);
  const orderEntry = useSwapStore((state) => state.currentCustomerData.orderDetailsById[String(orderId)] || null);
  const fetchCustomerProfileIfNeeded = useSwapStore((state) => state.fetchCustomerProfileIfNeeded);
  const fetchCustomerOrderDetailIfNeeded = useSwapStore((state) => state.fetchCustomerOrderDetailIfNeeded);
  const canUseCache = useSwapStore((state) => state.isCustomerCacheUsable);
  const customer = profileEntry.data;
  const order = orderEntry?.data || null;
  const error = profileEntry.error || orderEntry?.error || '';

  useEffect(() => {
    const loadData = async () => {
      const state = useSwapStore.getState();
      const latestProfileEntry = state.currentCustomerData.profile;
      const latestOrderEntry = state.currentCustomerData.orderDetailsById[String(orderId)] || null;
      const profilePromise = fetchCustomerProfileIfNeeded(customerEmail);
      const orderPromise = fetchCustomerOrderDetailIfNeeded(customerEmail, orderId);
      const hasUsableCache = canUseCache(latestProfileEntry) && canUseCache(latestOrderEntry);

      try {
        if (hasUsableCache) {
          await Promise.all([profilePromise, orderPromise]);
        } else {
          await withLoader(Promise.all([profilePromise, orderPromise]), 'Loading order details...');
        }
      } catch {
        // Store entries capture fetch errors for rendering.
      }
    };

    loadData();
  }, [canUseCache, customerEmail, fetchCustomerOrderDetailIfNeeded, fetchCustomerProfileIfNeeded, orderId, withLoader]);

  if (!customer || !order) {
    return (
      <ScreenShell title="Order" subtitle={error || 'Loading order details...'} onBack={pop} backgroundColor="#ffe4e1">
        <Text>{error || 'Loading...'}</Text>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      title={order.unique_id_c || order.id}
      subtitle={`${customer.name} order details`}
      onBack={pop}
      backgroundColor="#ffe4e1"
    >
      <View style={styles.listItem}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <Row label="Order Number" value={order.unique_id_c || order.id} />
        <Row label="Date" value={formatOrderDate(order.order_date_c)} />
        <Row label="Status" value={order.status_c || 'NA'} />
        <Row label="Total Price" value={`${Number.parseInt(String(order.order_cost_c || '0'), 10) || 0} pts`} />
        <Row label="Number of Items" value={String(order.total_items_c || order.order_line_items?.length || 0)} />
      </View>

      <Text style={styles.sectionTitle}>Items</Text>
      {(order.order_line_items || []).map((item) => (
        <SwapProductCard
          key={item.id}
          product={item}
          subtitle={`Item ID: ${item.unique_item_id_c || item.id} | ${item.category?.name || 'NA'} | ${item.style?.name || 'NA'}`}
        />
      ))}
    </ScreenShell>
  );
};
