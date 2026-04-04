// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getBoothProductsByFilter, updateBoothProduct } from '../../api/swapOpsApi';
import { BoothProductComponent } from '../../components/BoothProductComponent';
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
            <BoothProductComponent
              key={item.id}
              item={item}
              showBoothName={false}
              detailLine={`Stock: ${
                Number(item.stock_quantity || 0) <= 0
                  ? `Sold Out (${item.original_stock || 0})`
                  : `${item.stock_quantity || 0}/${item.original_stock || 0}`
              } | Size: ${item.size || item.size_on_label || 'NA'}`}
              actions={[
                ...(status === 'pending'
                  ? [
                      {
                        key: `approve-${item.id}`,
                        label: 'Approve',
                        variant: 'approve',
                        onPress: () => refreshProduct(item.id, { manual_review_passed: true, rejected: false }, 'Product approved'),
                      },
                      {
                        key: `reject-${item.id}`,
                        label: 'Reject',
                        variant: 'reject',
                        onPress: () => refreshProduct(item.id, { manual_review_passed: false, rejected: true }, 'Product rejected'),
                      },
                    ]
                  : []),
                ...(status === 'approved'
                  ? [
                      {
                        key: `print-${item.id}`,
                        label: isBoothProductPrinted(item.seller_booth?.id || boothId || '0', item.id) ? 'Reprint' : 'Print',
                        variant: 'neutral',
                        onPress: () => printLabel(item),
                      },
                      {
                        key: `return-${item.id}`,
                        label: 'Return',
                        variant: 'warn',
                        onPress: () => refreshProduct(item.id, { returned_to_seller: true }, 'Product returned to seller'),
                      },
                    ]
                  : []),
              ]}
            />
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
