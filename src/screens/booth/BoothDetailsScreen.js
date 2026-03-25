import React, { useEffect, useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { isBoothLiveEnabled } from '../../api/boothGraphqlApi';
import { getBoothProductsByFilter, updateBoothProduct } from '../../api/swapOpsApi';
import { ScreenShell } from '../../components/ScreenShell';
import { generateBoothProductLabel, isBoothProductPrinted } from '../../services/boothPrintService';
import { useAppSessionStore } from '../../store/appSessionStore';
import { styles } from '../../styles/commonStyles';

const productTabs = ['pending', 'approved', 'sold', 'rejected'];

export const BoothDetailsScreen = ({ pop, push, boothId }) => {
  const token = useAppSessionStore((state) => state.token);
  const [status, setStatus] = useState('pending');
  const [search, setSearch] = useState('');
  const [booth, setBooth] = useState(null);
  const [products, setProducts] = useState([]);
  const [counts, setCounts] = useState({ total: 0, pending: 0, approved: 0, sold: 0, rejected: 0, returned: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requiresLogin = isBoothLiveEnabled() && !token;

  useEffect(() => {
    if (requiresLogin) {
      return undefined;
    }

    let active = true;

    const loadProducts = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await getBoothProductsByFilter({ boothId, status, search });
        if (!active) {
          return;
        }

        setBooth(response.booth);
        setProducts(response.products);
        setCounts(response.counts);
      } catch (loadError) {
        if (active) {
          setError(loadError.message || 'Unable to load booth products');
          setProducts([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      active = false;
    };
  }, [boothId, requiresLogin, search, status]);

  const refreshProduct = async (productId, updates, successMessage) => {
    await updateBoothProduct(productId, updates);
    Alert.alert('Updated', successMessage);
    const response = await getBoothProductsByFilter({ boothId, status, search });
    setBooth(response.booth);
    setProducts(response.products);
    setCounts(response.counts);
  };

  const printLabel = async (product) => {
    try {
      const result = await generateBoothProductLabel(product);
      Alert.alert('Label Ready', `${result.filename} has been generated.`);
    } catch (printError) {
      Alert.alert('Print Failed', printError.message || 'Unable to generate the product label.');
    }
  };

  return (
    <ScreenShell
      title={booth?.name || 'Booth Products'}
      subtitle={error || `${counts.total || 0} products`}
      onBack={pop}
      backgroundColor="#f1f5f9"
    >
      {requiresLogin ? (
        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Sign in required</Text>
          <Text style={styles.cardSubtitle}>Authenticate with the booth backend before loading live booth products.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => push('boothLogin')}>
            <Text style={styles.primaryButtonText}>Open Booth Login</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.tabsRow}>
        {productTabs.map((item) => {
          const active = item === status;
          const countValue = counts[item] ?? 0;
          return (
            <TouchableOpacity key={item} onPress={() => setStatus(item)} style={[styles.tabButton, active && styles.tabButtonActive]}>
              <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>
                {item[0].toUpperCase() + item.slice(1)} ({countValue})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search by code or name"
        placeholderTextColor="#94a3b8"
        style={styles.input}
      />

      {!requiresLogin ? (
        <View style={styles.formCard}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Returned</Text>
            <Text style={styles.rowValue}>{counts.returned}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Booth Slot</Text>
            <Text style={styles.rowValue}>{booth?.booth_slot || 'NA'}</Text>
          </View>
        </View>
      ) : null}

      {!requiresLogin && loading ? (
        <View style={styles.formCard}>
          <Text style={styles.cardSubtitle}>Loading products...</Text>
        </View>
      ) : null}

      {!requiresLogin && !loading && products.length > 0
        ? products.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemImage} />
              <View style={styles.itemDetails}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={[styles.rowValue, { color: '#059669' }]}>{item.price}</Text>
                <Text style={styles.itemMeta}>Code: {item.code}</Text>
                <View style={styles.row}>
                  <Text style={styles.itemMeta}>Size: {item.size}</Text>
                  <Text style={styles.itemMeta}>
                    Stock: {item.stock_quantity}/{item.original_stock}
                  </Text>
                </View>
                <Text style={styles.itemMeta}>Brand: {item.brand}</Text>
                <View style={styles.actionRow}>
                  {status === 'pending' ? (
                    <>
                      <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => refreshProduct(item.id, { manual_review_passed: true, rejected: false }, 'Product approved')}
                      >
                        <Text style={styles.secondaryButtonText}>Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.secondaryButton, { borderColor: '#ef4444' }]}
                        onPress={() => refreshProduct(item.id, { manual_review_passed: false, rejected: true }, 'Product rejected')}
                      >
                        <Text style={[styles.secondaryButtonText, { color: '#dc2626' }]}>Reject</Text>
                      </TouchableOpacity>
                    </>
                  ) : null}
                  {status === 'approved' ? (
                    <>
                      <TouchableOpacity style={styles.secondaryButton} onPress={() => printLabel(item)}>
                        <Text style={styles.secondaryButtonText}>
                          {isBoothProductPrinted(item.seller_booth?.id || boothId || '0', item.id) ? 'Reprint' : 'Print'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.secondaryButton, { borderColor: '#f59e0b' }]}
                        onPress={() => refreshProduct(item.id, { returned_to_seller: true }, 'Product returned to seller')}
                      >
                        <Text style={[styles.secondaryButtonText, { color: '#d97706' }]}>Return</Text>
                      </TouchableOpacity>
                    </>
                  ) : null}
                </View>
              </View>
            </View>
          ))
        : null}

      {!requiresLogin && !loading && products.length === 0 ? (
        <View style={styles.formCard}>
          <Text style={[styles.cardTitle, { textAlign: 'center' }]}>No products found</Text>
          <Text style={[styles.helperText, { textAlign: 'center' }]}>No products match the selected tab and search criteria.</Text>
        </View>
      ) : null}
    </ScreenShell>
  );
};
