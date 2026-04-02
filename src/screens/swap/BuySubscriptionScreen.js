import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { purchaseFlexiPlan } from '../../api/swapOpsApi';
import { Card } from '../../components/Card';
import { PaymentMethodModal } from '../../components/PaymentMethodModal';
import { ScreenShell } from '../../components/ScreenShell';
import { useLoader } from '../../utils/LoaderContextShared';
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

export const BuySubscriptionScreen = ({ push, pop, customerEmail }) => {
  const [itemCountInput, setItemCountInput] = useState('1');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [purchasedSubscriptionId, setPurchasedSubscriptionId] = useState('');
  const [successItemCount, setSuccessItemCount] = useState('0');
  const redirectTimeoutRef = useRef(null);
  const { setLoaderMessage, withLoader } = useLoader();
  const shopItemsSubscriptions = useSwapStore((state) => state.shopItemsSubscriptions);
  const fetchShopSubscriptions = useSwapStore((state) => state.fetchShopSubscriptions);
  const activeCustomer = useSwapStore((state) => state.activeCustomer);
  const profileEntry = useSwapStore((state) => state.currentCustomerData.profile);
  const activePackageEntry = useSwapStore((state) => state.currentCustomerData.activePackage);
  const subscriptionsEntry = useSwapStore((state) => state.currentCustomerData.subscriptions);
  const fetchCustomerPickupsIfNeeded = useSwapStore((state) => state.fetchCustomerPickupsIfNeeded);
  const fetchCustomerProfileIfNeeded = useSwapStore((state) => state.fetchCustomerProfileIfNeeded);
  const refreshCustomerSubscriptionState = useSwapStore((state) => state.refreshCustomerSubscriptionState);
  const canUseCache = useSwapStore((state) => state.isCustomerCacheUsable);
  const shopCustomerId = useAppSessionStore((state) => state.shopCustomerId);
  const customer = profileEntry.data;

  useEffect(() => {
    const loadData = async () => {
      const state = useSwapStore.getState();
      const latestProfileEntry = state.currentCustomerData.profile;
      const profilePromise = fetchCustomerProfileIfNeeded(customerEmail);
      const subscriptionsPromise = shopItemsSubscriptions.length
        ? Promise.resolve(shopItemsSubscriptions)
        : fetchShopSubscriptions().then((data) => data.shopItemsSubscriptions);
      const hasUsableCache = canUseCache(latestProfileEntry) && shopItemsSubscriptions.length > 0;

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
  }, [canUseCache, customerEmail, fetchCustomerProfileIfNeeded, fetchShopSubscriptions, shopItemsSubscriptions, withLoader]);

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
  const payloadSubscription = paymentSummary.payableSubscription;
  const unitPrice = paymentSummary.perItemPayable;
  const calculatedPrice = paymentSummary.cashPayable;
  const subscriptions = Array.isArray(subscriptionsEntry.data) ? subscriptionsEntry.data : [];
  const currentShopSubscription =
    activePackageEntry.data ||
    subscriptions.find((entry) => String(entry?.status || '').trim().toLowerCase() === 'active') ||
    null;

  useEffect(() => () => {
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
    }
  }, []);

  const openPurchasedSubscription = () => {
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = null;
    }

    if (!purchasedSubscriptionId) {
      return;
    }

    setSuccessModalVisible(false);
    push('customerSubscriptionDetail', {
      email: customerEmail,
      subscriptionId: purchasedSubscriptionId,
      backToOverview: true,
    });
  };

  if (!customer) {
    return (
      <ScreenShell title="Buy Flexi Plan" subtitle={error || 'Loading subscription options...'} onBack={pop} backgroundColor="#ffe4e1">
        <Text>{error || 'Loading...'}</Text>
      </ScreenShell>
    );
  }

  const openPaymentModal = () => {
    if (!selectedSubscription || !payloadSubscription) {
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

  const handleBuy = async (paymentMethod = selectedPaymentMethod) => {
    if (!paymentMethod || !selectedSubscription || !payloadSubscription) {
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

    try {
      setSubmitting(true);
      console.log('[swap] buy flexi payload', {
        itemCount,
        paymentMode: paymentMethod,
        srUserId,
        activeSubscriptionId: currentShopSubscription?.id || '',
        subscription: payloadSubscription,
      });
      const result = await withLoader(
        purchaseFlexiPlan({
          customerEmail,
          authToken: customerToken,
          srUserId,
          paymentMode: paymentMethod,
          subscription: payloadSubscription,
          activeSubscription: currentShopSubscription,
          onProgress: setLoaderMessage,
        }),
        'Purchasing your flexi plan'
      );

      await Promise.all([
        refreshCustomerSubscriptionState(customerEmail, { force: true }),
        fetchCustomerPickupsIfNeeded(customerEmail, { force: true }),
      ]);
      setSelectedPaymentMethod(paymentMethod);
      setNotice(`Flexi package of ${payloadSubscription?.number_of_items_c || itemCount} is purchased.`);
      setPurchasedSubscriptionId(result?.subscribeId || '');
      setSuccessItemCount(String(payloadSubscription?.number_of_items_c || itemCount || '0'));
      setSuccessModalVisible(true);
      redirectTimeoutRef.current = setTimeout(() => {
        openPurchasedSubscription();
      }, 2000);
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
          <Text style={styles.rowLabel}>Payload items</Text>
          <Text style={styles.rowValue}>{payloadSubscription?.number_of_items_c || '0'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Total price</Text>
          <Text style={styles.rowValue}>${calculatedPrice.toFixed(2)}</Text>
        </View>
      </View>

      {!!notice && <Card title="Notice" subtitle={notice} />}

      <TouchableOpacity
        onPress={openPaymentModal}
        style={[styles.primaryButton, (!selectedSubscription || !payloadSubscription) && styles.primaryButtonDisabled]}
        disabled={!selectedSubscription || !payloadSubscription}
      >
        <Text style={styles.primaryButtonText}>Make Payment</Text>
      </TouchableOpacity>

      <PaymentMethodModal
        visible={paymentModalVisible}
        paymentOptions={PAYMENT_OPTIONS}
        selectedMode={selectedPaymentMethod}
        title="Select Payment Mode"
        helperText="Choose payment mode for this flexi plan purchase."
        confirmLabel="Buy"
        submitting={submitting}
        onSelectMode={setSelectedPaymentMethod}
        onConfirm={() => {
          setPaymentModalVisible(false);
          handleBuy(selectedPaymentMethod);
        }}
        onCancel={() => {
          setPaymentModalVisible(false);
          setSelectedPaymentMethod('');
        }}
      />

      <Modal transparent visible={successModalVisible} animationType="fade" onRequestClose={openPurchasedSubscription}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)', justifyContent: 'center', padding: 20 }}>
          <View style={[styles.formCard, { gap: 14 }]}>
            <Text style={styles.cardTitle}>Flexi plan purchased</Text>
            <Text style={styles.helperText}>{`Flexi package of ${successItemCount} is purchased.`}</Text>
            <TouchableOpacity onPress={openPurchasedSubscription} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenShell>
  );
};
