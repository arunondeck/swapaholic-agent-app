import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { findProductByQrCode, getCustomerCheckoutCart, placeSwapCheckoutOrder } from '../../api/swapOpsApi';
import { Card } from '../../components/Card';
import { CheckoutPaymentSelector } from '../../components/CheckoutPaymentSelector';
import { ScreenShell } from '../../components/ScreenShell';
import { SwapProductItemWithActions } from '../../components/SwapProductItemWithActions';
import { useLoader } from '../../context/LoaderContext';
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

export const CheckoutScreen = ({ pop, customerEmail, mode = 'nonCustomer' }) => {
  const [customer, setCustomer] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [error, setError] = useState('');
  const [scanText, setScanText] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualPoints, setManualPoints] = useState('');
  const [notice, setNotice] = useState('');
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { withLoader } = useLoader();
  const buyPointsEmail = useAppSessionStore((state) => state.buyPointsEmail);
  const shopPointsSubscriptions = useSwapStore((state) => state.shopPointsSubscriptions);
  const fetchShopPointsSubscriptions = useSwapStore((state) => state.fetchShopPointsSubscriptions);
  const invalidateCustomerCache = useSwapStore((state) => state.invalidateCustomerCache);
  const profileEntry = useSwapStore((state) => state.currentCustomerData.profile);
  const fetchCustomerProfileIfNeeded = useSwapStore((state) => state.fetchCustomerProfileIfNeeded);
  const canUseCache = useSwapStore((state) => state.isCustomerCacheUsable);
  const isCustomerMode = mode === 'customer';

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        setError('');
        if (!isCustomerMode) {
          setCustomer(null);
          setCartItems([]);
          return;
        }

        const profilePromise = fetchCustomerProfileIfNeeded(customerEmail);
        const checkoutCartPromise = getCustomerCheckoutCart(customerEmail);
        const [profile, checkoutCart] = canUseCache(profileEntry)
          ? await Promise.all([profilePromise, checkoutCartPromise])
          : await withLoader(Promise.all([profilePromise, checkoutCartPromise]), 'Loading checkout...');

        if (!active) {
          return;
        }

        setCustomer(profile);
        setCartItems((checkoutCart || []).map((item, index) => normalizeCartItem(item, index)));
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
  }, [canUseCache, customerEmail, fetchCustomerProfileIfNeeded, isCustomerMode, profileEntry, withLoader]);

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
  const remainingPoints = Math.max(availablePoints - cartTotal, 0);
  const pointsToBuy = paymentSummary.pointsToBuy;
  const cashPayable = paymentSummary.cashPayable;
  const checkoutLookupEmail = customer?.email || customerEmail || buyPointsEmail || '';
  const checkoutTitle = isCustomerMode ? 'Checkout with Points' : 'Buy Points Checkout';
  const checkoutSubtitle = isCustomerMode
    ? 'Scan items, add manual products, and redeem points'
    : 'Scan items, add manual products, and purchase points for checkout';
  const headerTitle = customer?.name || (isCustomerMode ? 'Customer checkout' : 'Non-customer checkout');
  const headerSubtitle = isCustomerMode
    ? `Available: ${availablePoints} pts | Remaining: ${remainingPoints} pts`
    : `Buy-points user: ${buyPointsEmail || 'Not configured'} | Points required: ${pointsToBuy} pts`;

  if (isCustomerMode && !customer) {
    return (
      <ScreenShell title={checkoutTitle} subtitle={error || 'Loading checkout data...'} onBack={pop} backgroundColor="#ffe4e1">
        <Text>{error || 'Loading...'}</Text>
      </ScreenShell>
    );
  }

  const handleScan = async () => {
    const code = scanText.trim();
    if (!code) {
      setNotice('Please enter or scan a QR code first.');
      return;
    }

    setNotice('');

    try {
      const product = await withLoader(findProductByQrCode(checkoutLookupEmail, code), 'Finding product...');

      if (!product) {
        setNotice('Product not found.');
        return;
      }

      setCartItems((prev) => {
        const productKey = product.unique_item_id_c || product.sku || product.id;

        if (prev.some((item) => (item.unique_item_id_c || item.id) === productKey)) {
          setNotice(`"${product.name}" is already in the cart.`);
          return prev;
        }

        setNotice(`Added "${product.name}" to cart.`);
        return [...prev, normalizeCartItem(product, prev.length)];
      });
      setScanText('');
    } catch (scanError) {
      setNotice(scanError.message || 'Failed to scan product.');
    }
  };

  const handleManualAdd = () => {
    const name = manualName.trim();
    const pointsValue = parsePoints(manualPoints);

    if (!name) {
      setNotice('Enter a product name to add a manual item.');
      return;
    }

    if (pointsValue <= 0) {
      setNotice('Enter valid points for the manual item.');
      return;
    }

    setCartItems((prev) => [
      ...prev,
      normalizeCartItem(
        {
          id: `manual-${Date.now()}`,
          name,
          points: `${pointsValue} pts`,
        },
        prev.length
      ),
    ]);
    setManualName('');
    setManualPoints('');
    setManualModalVisible(false);
    setNotice(`Added "${name}" to cart.`);
  };

  const removeItem = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
    setNotice('Item removed from cart.');
  };

  const openPaymentModal = () => {
    if (cartItems.length === 0) {
      setNotice('Add at least one product before placing the order.');
      return;
    }

    setSelectedPaymentMethod('');
    setPaymentModalVisible(true);
  };

  const handlePlaceOrder = async () => {
    if (!selectedPaymentMethod) {
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

      invalidateCustomerCache(['orders', 'orderDetailsById', 'profile']);
      setCartItems([]);
      setPaymentModalVisible(false);
      setSelectedPaymentMethod('');
      setScanText('');
      setManualName('');
      setManualPoints('');
      setNotice(`Order ${order.id} placed successfully.`);
    } catch (submitError) {
      setNotice(submitError.message || 'Failed to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenShell title={checkoutTitle} subtitle={checkoutSubtitle} onBack={pop} backgroundColor="#ffe4e1">
      {isCustomerMode ? <Card title={headerTitle} subtitle={headerSubtitle} /> : null}

      <View style={styles.scannerCard}>
        <Text style={styles.cardTitle}>QR Code Scanner</Text>
        <Text style={styles.helperText}>Scan or paste QR text and we will find the product, then add it to cart.</Text>
        <TextInput
          value={scanText}
          onChangeText={setScanText}
          style={styles.input}
          placeholder="Scan text / SKU"
          placeholderTextColor="#8b8b8b"
          autoCapitalize="characters"
        />
        <TouchableOpacity onPress={handleScan} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Scan QR & Add Product</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={() => {
          setManualName('');
          setManualPoints('');
          setManualModalVisible(true);
        }}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonText}>Add Product Manually</Text>
      </TouchableOpacity>

      <Card title="Cart" subtitle={`${cartItems.length} item${cartItems.length === 1 ? '' : 's'} in cart`} />
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

      {!!notice && <Card title="Notice" subtitle={notice} />}
      <View style={styles.formCard}>
        <Text style={styles.cardTitle}>Summary</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Items</Text>
          <Text style={styles.rowValue}>{cartItems.length}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Total</Text>
          <Text style={styles.rowValue}>{cartTotal} pts</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Available</Text>
          <Text style={styles.rowValue}>{isCustomerMode ? `${availablePoints} pts` : '0 pts'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{isCustomerMode ? 'Remaining' : 'Points to Buy'}</Text>
          <Text style={styles.rowValue}>{isCustomerMode ? `${remainingPoints} pts` : `${pointsToBuy} pts`}</Text>
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

      <Modal transparent visible={paymentModalVisible} animationType="fade" onRequestClose={() => setPaymentModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)', justifyContent: 'center', padding: 20 }}>
          <CheckoutPaymentSelector
            paymentOptions={PAYMENT_OPTIONS}
            selectedMode={selectedPaymentMethod}
            onSelectMode={setSelectedPaymentMethod}
            onConfirm={handlePlaceOrder}
            onCancel={() => {
              setPaymentModalVisible(false);
              setSelectedPaymentMethod('');
            }}
            submitting={submitting}
            confirmLabel="Place Order"
          />
        </View>
      </Modal>

      <Modal transparent visible={manualModalVisible} animationType="fade" onRequestClose={() => setManualModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)', justifyContent: 'center', padding: 20 }}>
          <View style={[styles.formCard, { gap: 14 }]}>
            <Text style={styles.cardTitle}>Add Product Manually</Text>
            <TextInput
              value={manualName}
              onChangeText={setManualName}
              style={styles.input}
              placeholder="Product name"
              placeholderTextColor="#8b8b8b"
            />
            <TextInput
              value={manualPoints}
              onChangeText={setManualPoints}
              style={styles.input}
              placeholder="Points"
              placeholderTextColor="#8b8b8b"
              keyboardType="numeric"
            />
            <View style={styles.row}>
              <TouchableOpacity
                onPress={() => {
                  setManualModalVisible(false);
                  setManualName('');
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
