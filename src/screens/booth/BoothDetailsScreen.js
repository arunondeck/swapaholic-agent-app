import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getBoothProductsByFilter, updateBoothProduct } from '../../api/swapOpsApi';
import { ScreenShell } from '../../components/ScreenShell';
import { useLoader } from '../../utils/LoaderContextShared';
import { generateBoothProductLabel, isBoothProductPrinted } from '../../services/boothPrintService';
import { styles } from '../../styles/commonStyles';

const productTabs = ['pending', 'approved', 'sold', 'rejected'];

export const BoothDetailsScreen = ({ pop, push, boothId }) => {
  const [status, setStatus] = useState('pending');
  const [search, setSearch] = useState('');
  const [booth, setBooth] = useState(null);
  const [products, setProducts] = useState([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState('');
  const { withLoader } = useLoader();

  useEffect(() => {
    let active = true;

    const loadProducts = async () => {
      setError('');

      try {
        const response = await withLoader(getBoothProductsByFilter({ boothId, status, search }));
        if (!active) {
          return;
        }

        setBooth(response.booth);
        setProducts(response.products);
        setHasLoaded(true);
      } catch (loadError) {
        if (active) {
          setError(loadError.message || 'Unable to load booth products');
          setProducts([]);
          setHasLoaded(true);
        }
      }
    };

    loadProducts();

    return () => {
      active = false;
    };
  }, [boothId, search, status, withLoader]);

  const refreshProduct = async (productId, updates, successMessage) => {
    await withLoader(updateBoothProduct(productId, updates));
    Alert.alert('Updated', successMessage);
    const response = await withLoader(getBoothProductsByFilter({ boothId, status, search }));
    setBooth(response.booth);
    setProducts(response.products);
    setHasLoaded(true);
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
      subtitle={error || `${booth?.items || products.length || 0} products`}
      onBack={pop}
      backgroundColor="#f1f5f9"
    >
      <View style={styles.tabsBarAlt}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsBarScrollContent}>
          {productTabs.map((item) => {
            const active = item === status;
            return (
              <TouchableOpacity key={item} onPress={() => setStatus(item)} style={[styles.tabsBarButton, active && styles.tabsBarButtonActive]}>
                <Text style={[styles.tabsBarButtonText, active && styles.tabsBarButtonTextActive]}>{item[0].toUpperCase() + item.slice(1)}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search by code or name"
        placeholderTextColor="#94a3b8"
        style={styles.input}
      />

      <View style={styles.formCard}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Booth Start</Text>
          <Text style={styles.rowValue}>{booth?.booth_start_date ? new Date(booth.booth_start_date).toLocaleDateString() : 'NA'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Booth End</Text>
          <Text style={styles.rowValue}>{booth?.booth_end_date ? new Date(booth.booth_end_date).toLocaleDateString() : 'NA'}</Text>
        </View>
      </View>

      {products.length > 0
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

      {hasLoaded && products.length === 0 ? (
        <View style={styles.formCard}>
          <Text style={[styles.cardTitle, { textAlign: 'center' }]}>No products found</Text>
          <Text style={[styles.helperText, { textAlign: 'center' }]}>No products match the selected tab and search criteria.</Text>
        </View>
      ) : null}
    </ScreenShell>
  );
};
