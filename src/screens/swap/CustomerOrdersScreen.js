import React, { useEffect } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { Row } from '../../components/Row';
import { ScreenShell } from '../../components/ScreenShell';
import { useLoader } from '../../context/LoaderContext';
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

export const CustomerOrdersScreen = ({ pop, push, customerEmail }) => {
  const { withLoader } = useLoader();
  const profileEntry = useSwapStore((state) => state.currentCustomerData.profile);
  const ordersEntry = useSwapStore((state) => state.currentCustomerData.orders);
  const fetchCustomerProfileIfNeeded = useSwapStore((state) => state.fetchCustomerProfileIfNeeded);
  const fetchCustomerOrdersIfNeeded = useSwapStore((state) => state.fetchCustomerOrdersIfNeeded);
  const canUseCache = useSwapStore((state) => state.isCustomerCacheUsable);
  const customer = profileEntry.data;
  const orders = Array.isArray(ordersEntry.data) ? ordersEntry.data : [];
  const error = profileEntry.error || ordersEntry.error || '';

  useEffect(() => {
    const loadData = async () => {
      const profilePromise = fetchCustomerProfileIfNeeded(customerEmail);
      const ordersPromise = fetchCustomerOrdersIfNeeded(customerEmail);
      const hasUsableCache = canUseCache(profileEntry) && canUseCache(ordersEntry);

      try {
        if (hasUsableCache) {
          await Promise.all([profilePromise, ordersPromise]);
        } else {
          await withLoader(Promise.all([profilePromise, ordersPromise]), 'Loading orders...');
        }
      } catch {
        // Store entries capture fetch errors for rendering.
      }
    };

    loadData();
  }, [canUseCache, customerEmail, fetchCustomerOrdersIfNeeded, fetchCustomerProfileIfNeeded, ordersEntry, profileEntry, withLoader]);

  if (!customer) {
    return (
      <ScreenShell title="Orders" subtitle={error || 'Loading order history...'} onBack={pop} backgroundColor="#ffe4e1">
        <Text>{error || 'Loading...'}</Text>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title="Orders" subtitle={`${customer.name} order history`} onBack={pop} backgroundColor="#ffe4e1">
      {orders.map((order) => (
        <TouchableOpacity
          key={order.id}
          onPress={() => push('customerOrderDetail', { email: customerEmail, orderId: order.id })}
          style={styles.pressableListItem}
        >
          <Row label="Order Id" value={order.unique_id_c || order.id} />
          <Row label="Date" value={formatOrderDate(order.order_date_c)} />
          <Row label="Total Price" value={`${Number.parseInt(String(order.order_cost_c || '0'), 10) || 0} pts`} />
          <Row label="Number of Items" value={String(order.total_items_c || order.order_line_items?.length || 0)} />
        </TouchableOpacity>
      ))}
    </ScreenShell>
  );
};
