import React, { useMemo, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ScreenShell } from '../../components/ScreenShell';
import { styles } from '../../styles/commonStyles';

export const BoothCheckoutScreen = ({ pop }) => {
  const [productCode, setProductCode] = useState('');
  const [cart, setCart] = useState([]);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price, 0), [cart]);

  const addProduct = () => {
    if (!productCode.trim()) {
      return;
    }

    setCart((prev) => [
      ...prev,
      {
        id: `${Date.now()}`,
        name: 'Scanned Product',
        code: productCode.trim().toUpperCase(),
        price: 49,
      },
    ]);
    setProductCode('');
  };

  return (
    <ScreenShell title="Booth POS" subtitle="Checkout page" onBack={pop} backgroundColor="#eff6ff">
      <View style={[styles.formCard, { backgroundColor: '#1d4ed8', borderColor: '#1d4ed8' }]}>
        <Text style={[styles.summaryText, { color: '#dbeafe' }]}>Scan a barcode or type a code to add inventory items.</Text>
        <Text style={[styles.selectLabel, { color: '#dbeafe' }]}>Product Code</Text>
        <TextInput
          value={productCode}
          onChangeText={setProductCode}
          style={[styles.input, { backgroundColor: '#60a5fa', borderColor: '#93c5fd', color: '#e2e8f0' }]}
          placeholder="MB-xxx-xxx-xxx-xxx"
          placeholderTextColor="#dbeafe"
          autoCapitalize="characters"
        />
        <View style={styles.row}>
          <TouchableOpacity onPress={addProduct} style={[styles.secondaryButton, { flex: 1, borderColor: '#bfdbfe' }]}>
            <Text style={[styles.secondaryButtonText, { color: '#2563eb' }]}>Add Product</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.secondaryButton, { flex: 1, borderColor: '#bfdbfe' }]}>
            <Text style={[styles.secondaryButtonText, { color: '#2563eb' }]}>Scan QR</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryHeading}>Cart Summary</Text>

        {cart.length === 0 ? (
          <View style={[styles.formCard, { borderStyle: 'dashed' }]}>
            <Text style={[styles.cardTitle, { textAlign: 'center' }]}>Your cart is empty</Text>
            <Text style={[styles.helperText, { textAlign: 'center' }]}>Add products to see item details and payment options.</Text>
          </View>
        ) : (
          <>
            {cart.map((item) => (
              <View key={item.id} style={styles.listItem}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.itemMeta}>{item.code}</Text>
                <Text style={styles.rowValue}>${item.price.toFixed(2)}</Text>
              </View>
            ))}
            <View style={styles.row}>
              <Text style={styles.summarySubheading}>Subtotal</Text>
              <Text style={styles.summarySubheading}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Cash</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Card</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Close Sale</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </ScreenShell>
  );
};
