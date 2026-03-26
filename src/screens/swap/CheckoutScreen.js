import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { findProductByQrCode, getCustomerCheckoutCart, getCustomerProfile, placeCustomerOrder } from '../../api/swapOpsApi';
import { Card } from '../../components/Card';
import { ScreenShell } from '../../components/ScreenShell';
import { useLoader } from '../../context/LoaderContext';
import { styles } from '../../styles/commonStyles';

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
  id: item.id || item.sku || `cart-item-${index}`,
  sku: item.sku || '',
  name: item.name || 'Unnamed Product',
  size: item.size || '',
  points: String(item.points || '0'),
});

export const CheckoutScreen = ({ pop, customerEmail }) => {
  const [customer, setCustomer] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [error, setError] = useState('');
  const [scanText, setScanText] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualPoints, setManualPoints] = useState('');
  const [notice, setNotice] = useState('');
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { withLoader } = useLoader();

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        setError('');
        const [profile, checkoutCart] = await withLoader(
          Promise.all([getCustomerProfile(customerEmail), getCustomerCheckoutCart(customerEmail)]),
          'Loading checkout...'
        );

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
  }, [customerEmail, withLoader]);

  const availablePoints = useMemo(() => parsePoints(customer?.points), [customer?.points]);
  const cartTotal = useMemo(() => cartItems.reduce((sum, item) => sum + parsePoints(item.points), 0), [cartItems]);
  const remainingPoints = Math.max(availablePoints - cartTotal, 0);

  if (!customer) {
    return (
      <ScreenShell title="Checkout with Points" subtitle={error || 'Loading checkout data...'} onBack={pop} backgroundColor="#ffe4e1">
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
      const product = await withLoader(findProductByQrCode(customerEmail, code), 'Finding product...');

      if (!product) {
        setNotice('Product not found.');
        return;
      }

      setCartItems((prev) => {
        if (prev.some((item) => item.sku === product.sku)) {
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
        placeCustomerOrder({
          email: customer.email,
          items: cartItems,
          paymentMethod: selectedPaymentMethod,
          subscribeId:
            customer.customerSubscribe?.shop_subscribe?.id ||
            customer.customerSubscribe?.subscribe?.id ||
            customer.customerSubscribe?.event_subscribe?.id ||
            '',
        }),
        'Placing order...'
      );

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
    <ScreenShell title="Checkout with Points" subtitle="Scan items, add manual products, and redeem points" onBack={pop} backgroundColor="#ffe4e1">
      <Card title={customer.name} subtitle={`Available: ${availablePoints} pts | Remaining: ${remainingPoints} pts`} />

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

      <View style={styles.formCard}>
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
        <TouchableOpacity onPress={handleManualAdd} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Add Manual Product</Text>
        </TouchableOpacity>
      </View>

      <Card title="Cart" subtitle={`${cartItems.length} item${cartItems.length === 1 ? '' : 's'} in cart`} />
      {cartItems.length === 0 ? (
        <View style={[styles.formCard, { borderStyle: 'dashed' }]}>
          <Text style={[styles.cardTitle, { textAlign: 'center' }]}>Your cart is empty</Text>
          <Text style={[styles.helperText, { textAlign: 'center' }]}>Scan a product or add one manually to begin.</Text>
        </View>
      ) : (
        cartItems.map((item) => (
          <View key={item.id} style={styles.listItem}>
            <View style={styles.row}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.rowValue}>{parsePoints(item.points)} pts</Text>
            </View>
            {!!item.sku && <Text style={styles.itemMeta}>SKU: {item.sku}</Text>}
            {!!item.size && <Text style={styles.itemMeta}>Size: {item.size}</Text>}
            <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
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
          <Text style={styles.rowValue}>{availablePoints} pts</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Remaining</Text>
          <Text style={styles.rowValue}>{remainingPoints} pts</Text>
        </View>
      </View>

      <TouchableOpacity onPress={openPaymentModal} style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Place Order</Text>
      </TouchableOpacity>

      <Modal transparent visible={paymentModalVisible} animationType="fade" onRequestClose={() => setPaymentModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)', justifyContent: 'center', padding: 20 }}>
          <View style={[styles.formCard, { gap: 14 }]}>
            <Text style={styles.cardTitle}>Select Payment Mode</Text>
            <Text style={styles.helperText}>Choose a payment mode first. You can cancel this dialog to add or remove items.</Text>
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
                onPress={handlePlaceOrder}
                style={[styles.primaryButton, { flex: 1 }, (!selectedPaymentMethod || submitting) && styles.primaryButtonDisabled]}
                disabled={!selectedPaymentMethod || submitting}
              >
                <Text style={styles.primaryButtonText}>{submitting ? 'Placing...' : 'Place Order'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenShell>
  );
};
