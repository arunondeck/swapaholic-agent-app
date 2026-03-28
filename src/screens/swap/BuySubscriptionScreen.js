import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { saveShopSubscription } from '../../api/swapOpsApi';
import { Card } from '../../components/Card';
import { ScreenShell } from '../../components/ScreenShell';
import { useLoader } from '../../context/LoaderContext';
import { calculateBuyItemsPaymentSummary } from '../../services/checkoutPricingService';
import { useAppSessionStore } from '../../store/appSessionStore';
import { useSwapStore } from '../../store/swapStore';
import { styles } from '../../styles/commonStyles';

const PAYMENT_OPTIONS = [
  { id: 'cash', label: 'Cash' },
  { id: 'card', label: 'Card' },
  { id: 'paynow', label: 'PayNow' },
];

const parseWholeNumber = (value) => {
  const parsed = Number.parseInt(String(value || '0').replace(/[^\d-]/g, ''), 10);
  return Number.isNaN(parsed) ? 0 : Math.max(parsed, 0);
};

export const BuySubscriptionScreen = ({ pop, customerEmail }) => {
  const [itemCountInput, setItemCountInput] = useState('1');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { withLoader } = useLoader();
  const shopItemsSubscriptions = useSwapStore((state) => state.shopItemsSubscriptions);
  const fetchShopSubscriptions = useSwapStore((state) => state.fetchShopSubscriptions);
  const activeCustomer = useSwapStore((state) => state.activeCustomer);
  const profileEntry = useSwapStore((state) => state.currentCustomerData.profile);
  const fetchCustomerProfileIfNeeded = useSwapStore((state) => state.fetchCustomerProfileIfNeeded);
  const invalidateCustomerCache = useSwapStore((state) => state.invalidateCustomerCache);
  const canUseCache = useSwapStore((state) => state.isCustomerCacheUsable);
  const shopCustomerId = useAppSessionStore((state) => state.shopCustomerId);
  const customer = profileEntry.data;

  useEffect(() => {
    const loadData = async () => {
      const profilePromise = fetchCustomerProfileIfNeeded(customerEmail);
      const subscriptionsPromise = shopItemsSubscriptions.length
        ? Promise.resolve(shopItemsSubscriptions)
        : fetchShopSubscriptions().then((data) => data.shopItemsSubscriptions);
      const hasUsableCache = canUseCache(profileEntry) && shopItemsSubscriptions.length > 0;

      try {
        setError('');
        const [, subscriptions] = hasUsableCache
          ? await Promise.all([profilePromise, subscriptionsPromise])
          : await withLoader(Promise.all([profilePromise, subscriptionsPromise]), 'Loading subscription options...');
        if (!subscriptions?.length) {
          setError('No item subscription is available right now.');
        }
      } catch (loadError) {
        setError(loadError.message || 'Failed to load subscription data');
      }
    };

    loadData();
  }, [canUseCache, customerEmail, fetchCustomerProfileIfNeeded, fetchShopSubscriptions, profileEntry, shopItemsSubscriptions, withLoader]);

  const itemCount = useMemo(() => parseWholeNumber(itemCountInput), [itemCountInput]);
  const paymentSummary = useMemo(
    () =>
      calculateBuyItemsPaymentSummary({
        itemCount,
        shopItemsSubscriptions,
      }),
    [itemCount, shopItemsSubscriptions]
  );
  const selectedSubscription = paymentSummary.selectedSubscription;
  const unitPrice = paymentSummary.perItemPayable;
  const calculatedPrice = paymentSummary.cashPayable;

  if (!customer) {
    return (
      <ScreenShell title="Buy Flexi Plan" subtitle={error || 'Loading subscription options...'} onBack={pop} backgroundColor="#ffe4e1">
        <Text>{error || 'Loading...'}</Text>
      </ScreenShell>
    );
  }

  const openPaymentModal = () => {
    if (!selectedSubscription) {
      setNotice('No subscription available to purchase.');
      return;
    }

    if (itemCount <= 0) {
      setNotice('Please enter at least 1 item.');
      return;
    }

    setNotice('');
    setSelectedPaymentMethod('');
    setPaymentModalVisible(true);
  };

  const handleBuy = async () => {
    if (!selectedPaymentMethod || !selectedSubscription) {
      return;
    }

    const srUserId = shopCustomerId || '';
    const customerToken = activeCustomer?.token || activeCustomer?.loginResponse?.token || '';

    if (!srUserId) {
      setNotice('Unable to find the logged-in swap user id. Please refresh the app session.');
      return;
    }
    if (!customerToken) {
      setNotice('Unable to find the logged-in user token. Please login again.');
      return;
    }

    const payloadSubscription = {
      ...paymentSummary.payableSubscription,
    };

    try {
      setSubmitting(true);
      await withLoader(
        saveShopSubscription({
          paymentMode: selectedPaymentMethod,
          srUserId,
          authToken: customerToken,
          subscription: payloadSubscription,
        }),
        'Saving subscription purchase...'
      );

      invalidateCustomerCache(['profile', 'activePackage', 'subscriptions', 'subscriptionDetailsById']);
      setPaymentModalVisible(false);
      setSelectedPaymentMethod('');
      setNotice('Subscription purchased successfully.');
    } catch (submitError) {
      setNotice(submitError.message || 'Failed to purchase subscription.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenShell title="Buy Flexi Plan" subtitle={`Purchase flexi plan for ${customer.name}`} onBack={pop} backgroundColor="#ffe4e1">
      <Card title="Flexi Swap Shopper" subtitle={selectedSubscription?.name || 'Buy Items'} />
      <Text style={styles.selectLabel}>Number of items</Text>
      <TextInput
        keyboardType="numeric"
        onChangeText={setItemCountInput}
        placeholder="Enter number of items"
        placeholderTextColor="#8b8b8b"
        style={styles.inputWithSpacing}
        value={itemCountInput}
      />

      <View style={styles.formCard}>
        <Text style={styles.cardTitle}>Price Summary</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Price per item</Text>
          <Text style={styles.rowValue}>${unitPrice.toFixed(2)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Items</Text>
          <Text style={styles.rowValue}>{itemCount}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Total price</Text>
          <Text style={styles.rowValue}>${calculatedPrice.toFixed(2)}</Text>
        </View>
      </View>

      {!!notice && <Card title="Notice" subtitle={notice} />}

      <TouchableOpacity onPress={openPaymentModal} style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Make Payment</Text>
      </TouchableOpacity>

      <Modal transparent visible={paymentModalVisible} animationType="fade" onRequestClose={() => setPaymentModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)', justifyContent: 'center', padding: 20 }}>
          <View style={[styles.formCard, { gap: 14 }]}>
            <Text style={styles.cardTitle}>Select Payment Mode</Text>
            <Text style={styles.helperText}>Choose payment mode and continue to buy this subscription.</Text>
            <View style={styles.chipRow}>
              {PAYMENT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => setSelectedPaymentMethod(option.id)}
                  style={[styles.chip, selectedPaymentMethod === option.id && styles.chipActive]}
                >
                  <Text style={styles.chipText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.row}>
              <TouchableOpacity
                onPress={() => {
                  setPaymentModalVisible(false);
                  setSelectedPaymentMethod('');
                }}
                style={[styles.secondaryButton, { flex: 1 }]}
                disabled={submitting}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleBuy}
                style={[styles.primaryButton, { flex: 1 }, (!selectedPaymentMethod || submitting) && styles.primaryButtonDisabled]}
                disabled={!selectedPaymentMethod || submitting}
              >
                <Text style={styles.primaryButtonText}>{submitting ? 'Buying...' : 'Buy'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenShell>
  );
};
