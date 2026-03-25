import React, { useEffect, useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { isBoothLiveEnabled } from '../../api/boothGraphqlApi';
import { getBoothCheckout } from '../../api/swapOpsApi';
import { ScreenShell } from '../../components/ScreenShell';
import { useBoothAuthStore } from '../../store/boothAuthStore';
import { styles } from '../../styles/commonStyles';

export const BoothCheckoutDetailScreen = ({ pop, push, checkoutId }) => {
  const token = useBoothAuthStore((state) => state.token);
  const [checkout, setCheckout] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requiresLogin = isBoothLiveEnabled() && !token;

  useEffect(() => {
    if (requiresLogin) {
      return undefined;
    }

    let active = true;

    const loadCheckout = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await getBoothCheckout(checkoutId);
        if (!active) {
          return;
        }

        setCheckout(response.checkout);
      } catch (loadError) {
        if (active) {
          setError(loadError.message || 'Unable to load checkout');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadCheckout();

    return () => {
      active = false;
    };
  }, [checkoutId, requiresLogin]);

  const totalItems = useMemo(
    () => (checkout?.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [checkout]
  );

  return (
    <ScreenShell
      title={`Checkout #${checkoutId || ''}`}
      subtitle={error || (checkout ? new Date(checkout.checkout_date).toLocaleString() : 'Checkout detail')}
      onBack={pop}
      backgroundColor="#eff6ff"
    >
      {requiresLogin ? (
        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Sign in required</Text>
          <Text style={styles.cardSubtitle}>Authenticate with the booth backend before loading live checkout records.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => push('boothLogin')}>
            <Text style={styles.primaryButtonText}>Open Booth Login</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.formCard}>
          <Text style={styles.cardSubtitle}>Loading checkout...</Text>
        </View>
      ) : null}

      {!requiresLogin && !loading && checkout ? (
        <>
          <View style={styles.summaryCard}>
            <Text style={styles.summarySubheading}>Summary</Text>
            <View style={[styles.statsGrid, { marginTop: 10 }]}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total Items</Text>
                <Text style={styles.statValue}>{totalItems}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total</Text>
                <Text style={styles.statValue}>${Number(checkout.Cart_value || 0).toFixed(2)}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Payment</Text>
                <Text style={styles.statValue}>{checkout.Booth_payment_method?.method || 'NA'}</Text>
              </View>
            </View>
          </View>

          {(checkout.items || []).map((item, index) => (
            <View key={`${item.booth_product?.id || 'item'}-${index}`} style={styles.listItem}>
              <Text style={styles.cardTitle}>{item.booth_product?.name || 'Unknown product'}</Text>
              <Text style={styles.itemMeta}>{item.booth_product?.code || item.booth_product?.friendly_product_id || 'NA'}</Text>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Quantity</Text>
                <Text style={styles.rowValue}>{item.quantity}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Booth</Text>
                <Text style={styles.rowValue}>{item.booth_product?.seller_booth?.name || 'NA'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Price</Text>
                <Text style={styles.rowValue}>{item.booth_product?.price || 'NA'}</Text>
              </View>
            </View>
          ))}
        </>
      ) : null}

      {!requiresLogin && !loading && !checkout ? (
        <View style={styles.formCard}>
          <Text style={[styles.cardTitle, { textAlign: 'center' }]}>Checkout not found</Text>
          <Text style={[styles.helperText, { textAlign: 'center' }]}>This sale record is missing from the current mock store.</Text>
        </View>
      ) : null}
    </ScreenShell>
  );
};
