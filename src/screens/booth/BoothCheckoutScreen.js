import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import { createBoothCheckout, getBoothPaymentMethods, getBoothProductById } from '../../api/swapOpsApi';
import { CameraScanner } from '../../components/CameraScanner';
import { ScreenShell } from '../../components/ScreenShell';
import { getItemIdFromScan } from '../../services/cameraScannerService';
import { styles } from '../../styles/commonStyles';
import { extractBoothProductIdFromCode } from '../../utils/boothProductCode';

export const BoothCheckoutScreen = ({ pop, push }) => {
  const [productCode, setProductCode] = useState('');
  const [cart, setCart] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [busy, setBusy] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerReady, setScannerReady] = useState(true);
  const [permission, requestPermission] = useCameraPermissions();
  const lastScannedRef = useRef({ value: '', at: 0 });

  useEffect(() => {
    let active = true;

    const loadPaymentMethods = async () => {
      try {
        const methods = await getBoothPaymentMethods();
        if (!active) {
          return;
        }
        setPaymentMethods(methods);
      } catch (error) {
        if (active) {
          Alert.alert('Payment Methods', error.message || 'Unable to load payment methods.');
        }
      }
    };

    loadPaymentMethods();

    return () => {
      active = false;
    };
  }, []);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.listing_price || 0) * Number(item.quantity || 0), 0),
    [cart]
  );

  const addProductToCart = (product) => {
    setCart((prev) => {
      const index = prev.findIndex((item) => item.id === product.id);
      if (index >= 0) {
        const next = [...prev];
        next[index] = { ...next[index], quantity: next[index].quantity + 1 };
        return next;
      }

      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const resolveProduct = async (rawCode) => {
    const product = await getBoothProductById(rawCode.trim());

    if (!product) {
      Alert.alert('Not Found', 'Product not found.');
      return false;
    }

    if (product.sold || product.returned_to_seller) {
      Alert.alert('Unavailable', 'This product is not available for sale.');
      return false;
    }

    addProductToCart(product);
    return true;
  };

  const addProduct = async () => {
    if (!productCode.trim()) {
      return;
    }

    setBusy(true);

    try {
      const success = await resolveProduct(productCode.trim());
      if (success) {
        setProductCode('');
      }
    } finally {
      setBusy(false);
    }
  };

  const openScanner = async () => {
    const currentPermission = permission?.granted ? permission : await requestPermission();
    if (!currentPermission?.granted) {
      Alert.alert('Camera Permission', 'Camera access is required to scan booth product codes.');
      return;
    }

    setScannerReady(true);
    setScannerOpen(true);
  };

  const onBarcodeScanned = async (scanResult) => {
    const itemId = getItemIdFromScan(scanResult, [extractBoothProductIdFromCode]);
    const now = Date.now();
    if (!scannerReady || !itemId) {
      return;
    }

    if (lastScannedRef.current.value === itemId && now - lastScannedRef.current.at < 1200) {
      return;
    }

    lastScannedRef.current = { value: itemId, at: now };
    setScannerReady(false);
    setBusy(true);

    try {
      const success = await resolveProduct(itemId);
      if (success) {
        setScannerOpen(false);
        Alert.alert('Product Added', 'The scanned product has been added to the cart.');
      } else {
        setScannerReady(true);
      }
    } finally {
      setBusy(false);
    }
  };

  const removeProduct = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const completeSale = async () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Add at least one product to continue.');
      return;
    }

    if (!selectedPaymentMethod) {
      Alert.alert('Payment Required', 'Select a payment method before closing the sale.');
      return;
    }

    setBusy(true);

    try {
      const checkout = await createBoothCheckout({
        Booth_products: cart.map((item) => item.id),
        items: cart.map((item) => ({ booth_product: item.id, quantity: item.quantity })),
        Cart_value: subtotal,
        Booth_payment_method: selectedPaymentMethod,
        checkout_date: new Date().toISOString(),
      });

      setCart([]);
      setSelectedPaymentMethod('');
      setProductCode('');
      push('boothCheckoutDetail', { checkoutId: checkout.id });
    } catch (error) {
      Alert.alert('Checkout Failed', error.message || 'Unable to complete this sale.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenShell title="Booth POS" subtitle="Scan or type a booth product code" onBack={pop} backgroundColor="#eff6ff">
      <>
        <View style={[styles.formCard, { backgroundColor: '#1d4ed8', borderColor: '#1d4ed8' }]}>
            <Text style={[styles.summaryText, { color: '#dbeafe' }]}>Product codes follow the live booth format `MB-booth-seller-product-brand`.</Text>
            <Text style={[styles.selectLabel, { color: '#dbeafe' }]}>Product Code</Text>
            <TextInput
              value={productCode}
              onChangeText={setProductCode}
              style={[styles.input, { backgroundColor: '#60a5fa', borderColor: '#93c5fd', color: '#e2e8f0' }]}
              placeholder="MB-292-1165-17446-3490"
              placeholderTextColor="#dbeafe"
              autoCapitalize="characters"
            />
            <View style={styles.row}>
              <TouchableOpacity onPress={addProduct} style={[styles.secondaryButton, { flex: 1, borderColor: '#bfdbfe' }]}>
                <Text style={[styles.secondaryButtonText, { color: '#2563eb' }]}>{busy ? 'Working...' : 'Add Product'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.secondaryButton, { flex: 1, borderColor: '#bfdbfe' }]} onPress={openScanner}>
                <Text style={[styles.secondaryButtonText, { color: '#2563eb' }]}>Scan Barcode</Text>
              </TouchableOpacity>
            </View>
          </View>

        {scannerOpen ? (
          <CameraScanner
            onBarcodeScanned={onBarcodeScanned}
            onClose={() => setScannerOpen(false)}
            scannerReady={scannerReady}
            helperText="Point the camera at a booth QR or barcode."
          />
        ) : null}

        <View style={styles.summaryCard}>
            <Text style={styles.summaryHeading}>Cart Summary</Text>

            {cart.length === 0 ? (
              <View style={[styles.formCard, { borderStyle: 'dashed' }]}>
                <Text style={[styles.cardTitle, { textAlign: 'center' }]}>Your cart is empty</Text>
                <Text style={[styles.helperText, { textAlign: 'center' }]}>Add products to review quantities and close a booth sale.</Text>
              </View>
            ) : (
              <>
                {cart.map((item) => (
                  <View key={item.id} style={styles.listItem}>
                    <View style={styles.row}>
                      <Text style={styles.cardTitle}>{item.name}</Text>
                      <Text style={styles.rowValue}>x{item.quantity}</Text>
                    </View>
                    <Text style={styles.itemMeta}>{item.code}</Text>
                    <View style={styles.row}>
                      <Text style={styles.itemMeta}>{item.brand}</Text>
                      <Text style={styles.rowValue}>{item.price}</Text>
                    </View>
                    <TouchableOpacity style={styles.secondaryButton} onPress={() => removeProduct(item.id)}>
                      <Text style={styles.secondaryButtonText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                <View style={styles.row}>
                  <Text style={styles.summarySubheading}>Subtotal</Text>
                  <Text style={styles.summarySubheading}>${subtotal.toFixed(2)}</Text>
                </View>
                <View style={styles.formCard}>
                  <Text style={styles.selectLabel}>Payment Method</Text>
                  <View style={styles.chipRow}>
                    {paymentMethods.map((method) => (
                      <TouchableOpacity
                        key={method.id}
                        onPress={() => setSelectedPaymentMethod(method.id)}
                        style={[styles.chip, selectedPaymentMethod === method.id && styles.chipActive]}
                      >
                        <Text style={styles.chipText}>{method.method}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.primaryButton, busy && styles.primaryButtonDisabled]}
                  onPress={completeSale}
                  disabled={busy}
                >
                  <Text style={styles.primaryButtonText}>Close Sale</Text>
                </TouchableOpacity>
              </>
            )}
        </View>
      </>
    </ScreenShell>
  );
};
