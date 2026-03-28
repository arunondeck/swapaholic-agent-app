import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getCustomerProfile, saveShopSubscription } from '../../api/swapOpsApi';
import { Card } from '../../components/Card';
import { ScreenShell } from '../../components/ScreenShell';
import { useLoader } from '../../context/LoaderContext';
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
  const [customer, setCustomer] = useState(null);
  const [itemCountInput, setItemCountInput] = useState('1');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { withLoader } = useLoader();
  const shopPointsSubscriptions = useSwapStore((state) => state.shopPointsSubscriptions);
  const fetchShopPointsSubscriptions = useSwapStore((state) => state.fetchShopPointsSubscriptions);
  const activeCustomer = useSwapStore((state) => state.activeCustomer);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        setError('');
        const [profile, subscriptions] = await withLoader(
          Promise.all([
            getCustomerProfile(customerEmail),
            shopPointsSubscriptions.length ? Promise.resolve(shopPointsSubscriptions) : fetchShopPointsSubscriptions(),
          ]),
          'Loading subscription options...'
        );

        if (!active) {
          return;
        }

        setCustomer(profile);
        if (!subscriptions?.length) {
          setError('No points subscription is available right now.');
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message || 'Failed to load subscription data');
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [customerEmail, fetchShopPointsSubscriptions, shopPointsSubscriptions, withLoader]);

  const selectedSubscription = useMemo(
    () => shopPointsSubscriptions.find((subscription) => subscription?.type_c === 'points') || shopPointsSubscriptions[0] || null,
    [shopPointsSubscriptions]
  );
  const itemCount = useMemo(() => parseWholeNumber(itemCountInput), [itemCountInput]);
  const unitPrice = useMemo(() => Number.parseFloat(String(selectedSubscription?.price_c || '0')) || 0, [selectedSubscription?.price_c]);
  const calculatedPrice = useMemo(() => unitPrice * itemCount, [itemCount, unitPrice]);

  if (!customer) {
    return (
      <ScreenShell title="Buy Subscription" subtitle={error || 'Loading subscription options...'} onBack={pop} backgroundColor="#ffe4e1">
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

    const srUserId = activeCustomer?.loginResponse?.customer?.id || activeCustomer?.details?.id || customer?.id || '';
    const customerToken = activeCustomer?.token || activeCustomer?.loginResponse?.token || '';

    if (!srUserId) {
      setNotice('Unable to find the logged-in user id. Please login again.');
      return;
    }
    if (!customerToken) {
      setNotice('Unable to find the logged-in user token. Please login again.');
      return;
    }

    const payloadSubscription = {
      ...selectedSubscription,
      number_of_items_c: String(itemCount),
      cost_c: Number(calculatedPrice.toFixed(2)),
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
    <ScreenShell title="Buy Subscription" subtitle={`Purchase flow for ${customer.name}`} onBack={pop} backgroundColor="#ffe4e1">
      <Card title="Flexi Swap Shopper" subtitle={selectedSubscription?.name || 'Buy Points'} />
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
