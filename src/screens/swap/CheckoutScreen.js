import React, { useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { findProductByQrCode, getCustomerCheckoutCart, getCustomerProfile } from '../../api/swapOpsApi';
import { Card } from '../../components/Card';
import { ProductCard } from '../../components/ProductCard';
import { ScreenShell } from '../../components/ScreenShell';
import { useLoader } from '../../context/LoaderContext';
import { styles } from '../../styles/commonStyles';

export const CheckoutScreen = ({ pop, customerEmail }) => {
  const [customer, setCustomer] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [error, setError] = useState('');
  const [scanText, setScanText] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [notice, setNotice] = useState('');
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
        setCartItems(checkoutCart);
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

  if (!customer) {
    return (
      <ScreenShell title="Checkout with Points" subtitle={error || 'Loading checkout data...'} onBack={pop} backgroundColor="#ffe4e1">
        <Text>{error || 'Loading...'}</Text>
      </ScreenShell>
    );
  }

  const parsePoints = (value) => Number.parseInt(String(value || '0'), 10) || 0;
  const availablePoints = parsePoints(customer.points);
  const cartTotal = cartItems.reduce((sum, item) => sum + Number.parseInt(item.points, 10), 0);
  const remainingPoints = Math.max(availablePoints - cartTotal, 0);

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
        return [...prev, product];
      });
      setScanText('');
    } catch (scanError) {
      setNotice(scanError.message || 'Failed to scan product.');
    }
  };

  const applyCoupon = () => {
    if (!couponCode.trim()) {
      setNotice('Please enter a coupon code.');
      return;
    }

    setNotice(`Coupon "${couponCode.trim().toUpperCase()}" applied (stub).`);
  };

  return (
    <ScreenShell title="Checkout with Points" subtitle="Enter customer email, scan items, redeem points" onBack={pop} backgroundColor="#ffe4e1">
      <TextInput
        defaultValue={customer.email}
        style={styles.input}
        placeholder="Customer email"
        placeholderTextColor="#8b8b8b"
      />

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

      <Card title="Cart" subtitle={`${cartItems.length} item${cartItems.length === 1 ? '' : 's'} in cart`} />
      {cartItems.length === 0 ? (
        <View style={[styles.formCard, { borderStyle: 'dashed' }]}>
          <Text style={[styles.cardTitle, { textAlign: 'center' }]}>Your cart is empty</Text>
          <Text style={[styles.helperText, { textAlign: 'center' }]}>Scan a product QR code to add items.</Text>
        </View>
      ) : (
        cartItems.map((item) => (
          <ProductCard key={item.sku} product={{ ...item, price: item.points }} subtitle={`SKU: ${item.sku}`} />
        ))
      )}

      <View style={styles.formCard}>
        <Text style={styles.cardTitle}>Coupon</Text>
        <TextInput
          value={couponCode}
          onChangeText={setCouponCode}
          style={styles.input}
          placeholder="Enter coupon code"
          placeholderTextColor="#8b8b8b"
          autoCapitalize="characters"
        />
        <TouchableOpacity onPress={applyCoupon} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Apply Coupon</Text>
        </TouchableOpacity>
      </View>

      {!!notice && <Card title="Notice" subtitle={notice} />}
      <Card
        title="Cart Summary"
        subtitle={`${cartItems.length} items | Total: ${cartTotal} pts | Available: ${availablePoints} pts | Remaining: ${remainingPoints} pts`}
      />
    </ScreenShell>
  );
};
