import React, { useEffect, useState } from 'react';
import { Alert, Image, Text, TouchableOpacity, View } from 'react-native';
import { getCustomerUnreviewedItems, reviewCustomerItem } from '../../api/swapOpsApi';
import { ScreenShell } from '../../components/ScreenShell';
import { useLoader } from '../../context/LoaderContext';
import { styles } from '../../styles/commonStyles';

const DEFAULT_THUMBNAIL = 'https://placehold.co/120x120/png?text=Product';

const readName = (value, fallback = 'NA') => {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  if (value && typeof value === 'object' && typeof value.name === 'string' && value.name.trim()) {
    return value.name;
  }

  return fallback;
};

const getReviewItems = (response) => {
  if (Array.isArray(response?.success?.data?.items)) {
    return response.success.data.items;
  }

  if (Array.isArray(response?.error?.data?.items)) {
    return response.error.data.items;
  }

  return [];
};

const getProductImage = (product) =>
  product?.thumbnail_c || product?.thumbnail || product?.image || product?.images?.[0]?.name || DEFAULT_THUMBNAIL;

const getProductPoints = (product) => product?.evaluated_points_c || product?.rubric_points_c || product?.bonus_points_c || 'NA';

export const ApprovalScreen = ({ pop, customerEmail }) => {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [reviewingId, setReviewingId] = useState('');
  const { withLoader } = useLoader();

  useEffect(() => {
    let active = true;

    const loadProducts = async () => {
      try {
        setError('');
        const response = await withLoader(getCustomerUnreviewedItems(), 'Loading swap review items...');

        if (!active) {
          return;
        }

        setProducts(getReviewItems(response));
      } catch (loadError) {
        if (active) {
          setProducts([]);
          setError(loadError.message || 'Failed to load swap review items');
        }
      }
    };

    loadProducts();

    return () => {
      active = false;
    };
  }, [withLoader]);

  const handleReview = async (product, status) => {
    try {
      setReviewingId(product.id);
      const response = await withLoader(
        reviewCustomerItem({
          id: product.id,
          status_c: status,
        }),
        'Submitting review...'
      );

      if (response?.status === false) {
        throw new Error(response?.error?.message || 'Failed to review item');
      }

      setProducts((current) => current.filter((item) => item.id !== product.id));
    } catch (reviewError) {
      Alert.alert('Review Failed', reviewError.message || 'Unable to review this item.');
    } finally {
      setReviewingId('');
    }
  };

  return (
    <ScreenShell
      title="Swap Review"
      subtitle={error || (customerEmail ? `Pending unconfirmed items for ${customerEmail}` : 'Pending unconfirmed customer items')}
      onBack={pop}
      backgroundColor="#ffe4e1"
    >
      {error ? <Text>{error}</Text> : null}

      {!error && products.length === 0 ? (
        <View style={styles.itemRow}>
          <View style={styles.itemDetails}>
            <Text style={styles.cardTitle}>No items pending review</Text>
            <Text style={styles.itemMeta}>There are no unconfirmed swap products right now.</Text>
          </View>
        </View>
      ) : null}

      {products.map((product) => (
        <View key={product.id} style={[styles.itemRow, { flexDirection: 'column' }]}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Image source={{ uri: getProductImage(product) }} style={styles.itemImage} />
            <View style={styles.itemDetails}>
              <Text style={styles.cardTitle}>{readName(product?.name, 'Product')}</Text>
              <Text style={styles.itemMeta}>Brand: {readName(product?.brand)}</Text>
              <Text style={styles.itemMeta}>Points: {getProductPoints(product)}</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.approveBtn}
              disabled={reviewingId === product.id}
              onPress={() => handleReview(product, 'approved')}
            >
              <Text style={styles.btnText}>{reviewingId === product.id ? 'Submitting...' : 'Approve'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rejectBtn}
              disabled={reviewingId === product.id}
              onPress={() => handleReview(product, 'callback')}
            >
              <Text style={styles.btnText}>Callback</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.rejectBtn, { backgroundColor: '#a16207' }]}
              disabled={reviewingId === product.id}
              onPress={() => handleReview(product, 'donate')}
            >
              <Text style={styles.btnText}>Donate</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScreenShell>
  );
};
