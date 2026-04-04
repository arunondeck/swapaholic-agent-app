import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { findProductByQrCode, getCustomerOrderDetails, placeSwapCheckoutOrder } from '../../api/swapOpsApi';
import { Card } from '../../components/Card';
import { PaymentMethodModal } from '../../components/PaymentMethodModal';
import { ScreenShell } from '../../components/ScreenShell';
import { SwapProductItemWithActions } from '../../components/SwapProductItemWithActions';
import { useLoader } from '../../utils/LoaderContextShared';
import { useAppSessionStore } from '../../store/appSessionStore';
import { useSwapStore } from '../../store/swapStore';
import { styles } from '../../styles/commonStyles';
import { calculateCheckoutPaymentSummary } from '../../services/checkoutPricingService';

const PAYMENT_OPTIONS = [
  { id: 'cash', label: 'Cash' },
  { id: 'card', label: 'Card' },
  { id: 'paynow', label: 'PayNow' },
];

const parsePoints = (value) => {
  const parsed = Number.parseInt(String(value || '0').replace(/[^\d-]/g, ''), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const normalizeCartItem = (item, index = 0) => ({
  id: item.id || item.unique_item_id_c || `cart-item-${index}`,
  unique_item_id_c: item.unique_item_id_c || item.sku || '',
  name: item.name || 'Unnamed Product',
  size: item.size || '',
  brand: item.brand || '',
  thumbnail_c: item.thumbnail_c || item.thumbnail || item.image || item.images?.[0]?.name || '',
  points: String(item.points || (item.evaluated_points_c ? `${item.evaluated_points_c} pts` : '0')),
});

export const CheckoutScreen = ({ push, pop, customerEmail, mode = 'nonCustomer' }) => {
  const [customer, setCustomer] = useState(null);
  const [localCartItems, setLocalCartItems] = useState([]);
  const [error, setError] = useState('');
  const [scanText, setScanText] = useState('');
  const [manualPoints, setManualPoints] = useState('');
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { withLoader } = useLoader();
  const buyPointsEmail = useAppSessionStore((state) => state.buyPointsEmail);
  const shopPointsSubscriptions = useSwapStore((state) => state.shopPointsSubscriptions);
  const activeCustomer = useSwapStore((state) => state.activeCustomer);
  const cartEntry = useSwapStore((state) => state.currentCustomerData.checkoutCart);
  const fetchShopPointsSubscriptions = useSwapStore((state) => state.fetchShopPointsSubscriptions);
  const invalidateCustomerCache = useSwapStore((state) => state.invalidateCustomerCache);
  const fetchCustomerProfileIfNeeded = useSwapStore((state) => state.fetchCustomerProfileIfNeeded);
  const fetchCustomerCheckoutCartIfNeeded = useSwapStore((state) => state.fetchCustomerCheckoutCartIfNeeded);
  const setCustomerCheckoutCart = useSwapStore((state) => state.setCustomerCheckoutCart);
  const addCustomerCheckoutCartItem = useSwapStore((state) => state.addCustomerCheckoutCartItem);
  const removeCustomerCheckoutCartItem = useSwapStore((state) => state.removeCustomerCheckoutCartItem);
  const clearCustomerCheckoutCart = useSwapStore((state) => state.clearCustomerCheckoutCart);
  const canUseCache = useSwapStore((state) => state.isCustomerCacheUsable);
  const isCustomerMode = mode === 'customer';
  const cartItems = isCustomerMode ? (Array.isArray(cartEntry.data) ? cartEntry.data : []) : localCartItems;

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        setError('');
        if (!isCustomerMode) {
          setCustomer(null);
          setLocalCartItems([]);
          return;
        }

        const latestProfileEntry = useSwapStore.getState().currentCustomerData.profile;
        const latestCheckoutCartEntry = useSwapStore.getState().currentCustomerData.checkoutCart;
        const profilePromise = fetchCustomerProfileIfNeeded(customerEmail);
        const checkoutCartPromise = fetchCustomerCheckoutCartIfNeeded(customerEmail);
        const [profile, checkoutCart] = canUseCache(latestProfileEntry) && canUseCache(latestCheckoutCartEntry)
          ? await Promise.all([profilePromise, checkoutCartPromise])
          : await withLoader(Promise.all([profilePromise, checkoutCartPromise]), 'Loading checkout...');

        if (!active) {
          return;
        }

        setCustomer(profile);
        const normalizedCheckoutCart = (checkoutCart || []).map((item, index) => normalizeCartItem(item, index));
        const existingCart = Array.isArray(latestCheckoutCartEntry?.data) ? latestCheckoutCartEntry.data : [];
        const cartNeedsNormalization =
          normalizedCheckoutCart.length !== existingCart.length ||
          normalizedCheckoutCart.some((item, index) => existingCart[index]?.id !== item.id);

        if (cartNeedsNormalization) {
          setCustomerCheckoutCart(normalizedCheckoutCart);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message || 'Failed to load checkout data');
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [canUseCache, customerEmail, fetchCustomerProfileIfNeeded, isCustomerMode, withLoader]);

  useEffect(() => {
    fetchShopPointsSubscriptions().catch(() => null);
  }, [fetchShopPointsSubscriptions]);

  const availablePoints = useMemo(() => parsePoints(customer?.points), [customer?.points]);
  const cartTotal = useMemo(() => cartItems.reduce((sum, item) => sum + parsePoints(item.points), 0), [cartItems]);
  const paymentSummary = useMemo(
    () =>
      calculateCheckoutPaymentSummary({
        mode,
        cartTotal,
        availablePoints,
        shopPointsSubscriptions,
      }),
    [availablePoints, cartTotal, mode, shopPointsSubscriptions]
  );
  const pointsToBuy = paymentSummary.pointsToBuy;
  const cashPayable = paymentSummary.cashPayable;
  const checkoutLookupEmail = customer?.email || customerEmail || buyPointsEmail || '';
  const checkoutLookupToken = activeCustomer?.token || activeCustomer?.loginResponse?.token || '';
  const checkoutTitle = isCustomerMode ? 'Checkout with Points' : 'Buy Points Checkout';
  const checkoutSubtitle = isCustomerMode
    ? 'Scan items, add manual products, and redeem points'
    : 'Scan items, add manual products, and purchase points for checkout';
  const headerTitle = customer?.name || (isCustomerMode ? 'Customer checkout' : 'Non-customer checkout');
  const headerSubtitle = isCustomerMode
    ? `Available: ${availablePoints} pts`
    : `Buy-points user: ${buyPointsEmail || 'Not configured'} | Points required: ${pointsToBuy} pts`;

  if (isCustomerMode && !customer) {
    return (
      <ScreenShell title={checkoutTitle} subtitle={error || 'Loading checkout data...'} onBack={pop} backgroundColor="#ffe4e1">
        <Text>{error || 'Loading...'}</Text>
      </ScreenShell>
    );
  }

  const handleScan = async () => {
    setError('');
    const code = scanText.trim();
    if (!code) {
      return;
    }

    try {
      const product = await withLoader(findProductByQrCode(checkoutLookupEmail, code, checkoutLookupToken), 'Finding product...');

      if (!product) {
        return;
      }

      const productKey = product.unique_item_id_c || product.sku || product.id;

      if (cartItems.some((item) => (item.unique_item_id_c || item.id) === productKey)) {
        setScanText('');
        return;
      }

      const nextItem = normalizeCartItem(product, cartItems.length);
      if (isCustomerMode) {
        addCustomerCheckoutCartItem(nextItem);
      } else {
        setLocalCartItems((prev) => [...prev, nextItem]);
      }

      setScanText('');
    } catch (scanError) {
      setError(scanError.message || 'Failed to scan product.');
    }
  };

  const handleManualAdd = () => {
    setError('');
    const pointsValue = parsePoints(manualPoints);

    if (pointsValue <= 0) {
      setError('Enter valid points for the manual item.');
      return;
    }

    const nextItem = normalizeCartItem(
      {
        id: `manual-${Date.now()}`,
        name: 'Unlabelled item',
        points: `${pointsValue} pts`,
      },
      cartItems.length
    );

    if (isCustomerMode) {
      addCustomerCheckoutCartItem(nextItem);
    } else {
      setLocalCartItems((prev) => [...prev, nextItem]);
    }
    setManualPoints('');
    setManualModalVisible(false);
  };

  const removeItem = (id) => {
    if (isCustomerMode) {
      removeCustomerCheckoutCartItem(id);
      return;
    }

    setLocalCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const openPaymentModal = () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Add at least one item before placing the order.');
      return;
    }

    if (isCustomerMode && cashPayable <= 0) {
      handlePlaceOrder();
      return;
    }

    setSelectedPaymentMethod('');
    setPaymentModalVisible(true);
  };

  const handlePlaceOrder = async () => {
    if (submitting) {
      return;
    }

    if (!selectedPaymentMethod && cashPayable > 0) {
      return;
    }

    try {
      setSubmitting(true);
      const order = await withLoader(
        placeSwapCheckoutOrder({
          mode,
          email: customer?.email || customerEmail || '',
          items: cartItems,
          paymentMethod: selectedPaymentMethod,
          subscribeId: isCustomerMode
            ? customer?.customerSubscribe?.shop_subscribe?.id ||
              customer?.customerSubscribe?.subscribe?.id ||
              customer?.customerSubscribe?.event_subscribe?.id ||
              ''
            : '',
        }),
        'Placing order...'
      );
      console.log('[checkout] order placed', {
        mode,
        orderId: order?.id || '',
        paymentMethod: selectedPaymentMethod,
        email: order?.email || customer?.email || customerEmail || '',
      });

      invalidateCustomerCache(['orders', 'orderDetailsById', 'profile']);
      if (isCustomerMode) {
        await fetchCustomerProfileIfNeeded(customer?.email || customerEmail || '', { force: true });
        clearCustomerCheckoutCart();
      } else {
        setLocalCartItems([]);
      }
      setPaymentModalVisible(false);
      setSelectedPaymentMethod('');
      setScanText('');
      setManualPoints('');
      setError('');

      if (isCustomerMode && order?.id && push) {
        await withLoader(
          new Promise((resolve) => setTimeout(resolve, 1000)).then(() =>
            getCustomerOrderDetails(order?.email || customer?.email || customerEmail || '', order.id)
          ),
          'Loading order details...'
        );
        push('customerOrderDetail', {
          email: order?.email || customer?.email || customerEmail || '',
          orderId: order.id,
        });
        return;
      }

      Alert.alert('Order Placed', order?.id ? `Order ${order.id} was created successfully.` : 'Checkout completed successfully.');
    } catch (submitError) {
      console.error(
        '[checkout] order failed full',
        JSON.stringify(
          {
            message: submitError?.message || 'Unknown error',
            response: submitError?.response || null,
            responseError: submitError?.responseError || null,
            stack: submitError?.stack || '',
          },
          null,
          2
        )
      );
      setError(submitError.message || 'Failed to place order.');
      Alert.alert('Checkout Failed', submitError.message || 'Failed to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenShell title={checkoutTitle} subtitle={checkoutSubtitle} onBack={pop} backgroundColor="#ffe4e1">
      {isCustomerMode ? <Card title={headerTitle} subtitle={headerSubtitle} /> : null}

      <View style={styles.scannerCard}>
        <Text style={styles.cardTitle}>Scan the product code</Text>
        {/* <Text style={styles.helperText}>Scan or paste QR text and we will find the product, then add it to cart.</Text> */}
        <TextInput
          value={scanText}
          onChangeText={setScanText}
          style={styles.input}
          placeholder="Product ID"
          placeholderTextColor="#8b8b8b"
          autoCapitalize="characters"
        />
        <TouchableOpacity onPress={handleScan} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Scan QR & Add Product</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={() => {
          setManualPoints('');
          setManualModalVisible(true);
        }}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonText}>Unlabelled Item - Add Points</Text>
      </TouchableOpacity>

      {/* <Card title="Cart" subtitle={`${cartItems.length} item${cartItems.length === 1 ? '' : 's'} in cart`} /> */}
      {cartItems.length === 0 ? (
        <View style={[styles.formCard, { borderStyle: 'dashed' }]}>
          <Text style={[styles.cardTitle, { textAlign: 'center' }]}>Your cart is empty</Text>
          <Text style={[styles.helperText, { textAlign: 'center' }]}>Scan a product or add one manually to begin.</Text>
        </View>
      ) : (
        cartItems.map((item) => (
          <SwapProductItemWithActions
            key={item.id}
            product={item}
            actions={[{ key: 'remove', label: 'Remove', onPress: () => removeItem(item.id), variant: 'neutral' }]}
          />
        ))
      )}

      <View style={styles.formCard}>
        <Text style={styles.cardTitle}>Summary</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Items</Text>
          <Text style={styles.rowValue}>{cartItems.length}</Text>
        </View>
        <View style={styles.summaryTotalsRow}>
          <Text style={styles.rowLabel}>Total</Text>
          <Text style={styles.rowValue}>{cartTotal} pts</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Available</Text>
          <Text style={styles.rowValue}>{isCustomerMode ? `${availablePoints} pts` : '0 pts'}</Text>
        </View>
        {cashPayable > 0 ? (
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Cash Payable</Text>
            <Text style={styles.rowValue}>${cashPayable.toFixed(2)}</Text>
          </View>
        ) : null}
      </View>

      <TouchableOpacity onPress={openPaymentModal} style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Place Order</Text>
      </TouchableOpacity>

      <PaymentMethodModal
        visible={paymentModalVisible}
        paymentOptions={PAYMENT_OPTIONS}
        selectedMode={selectedPaymentMethod}
        onSelectMode={setSelectedPaymentMethod}
        onConfirm={handlePlaceOrder}
        onCancel={() => {
          setPaymentModalVisible(false);
          setSelectedPaymentMethod('');
        }}
        title="Select Payment Method"
        helperText="Choose the payment method before sending the checkout request."
        confirmLabel="Place Order"
        submitting={submitting}
      />

      <Modal transparent visible={manualModalVisible} animationType="fade" onRequestClose={() => setManualModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)', justifyContent: 'center', padding: 20 }}>
          <View style={[styles.formCard, { gap: 14 }]}>
            <Text style={styles.cardTitle}>Add Unlabelled Item</Text>
            <TextInput
              value={manualPoints}
              onChangeText={setManualPoints}
              style={styles.input}
              placeholder="Add points"
              placeholderTextColor="#8b8b8b"
              keyboardType="numeric"
            />
            <View style={styles.row}>
              <TouchableOpacity
                onPress={() => {
                  setManualModalVisible(false);
                  setManualPoints('');
                }}
                style={[styles.secondaryButton, { flex: 1 }]}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleManualAdd} style={[styles.primaryButton, { flex: 1 }]}>
                <Text style={styles.primaryButtonText}>Add Product</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenShell>
  );
};
