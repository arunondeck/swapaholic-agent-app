import React, { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { getCustomerUnreviewedItems, reviewCustomerItem } from '../../api/swapOpsApi';
import { ScreenShell } from '../../components/ScreenShell';
import { SwapProductItemWithActions } from '../../components/SwapProductItemWithActions';
import { useLoader } from '../../context/LoaderContext';
import { styles } from '../../styles/commonStyles';

const getReviewItems = (response) => {
  if (Array.isArray(response?.success?.data?.items)) {
    return response.success.data.items;
  }

  if (Array.isArray(response?.error?.data?.items)) {
    return response.error.data.items;
  }

  return [];
};

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
        <SwapProductItemWithActions
          key={product.id}
          product={{
            ...product,
            points: product?.evaluated_points_c || product?.rubric_points_c || product?.bonus_points_c || 'NA',
          }}
          actions={[
            {
              key: 'approve',
              label: reviewingId === product.id ? 'Submitting...' : 'Approve',
              onPress: () => handleReview(product, 'approved'),
              disabled: reviewingId === product.id,
              variant: 'approve',
            },
            {
              key: 'callback',
              label: 'Callback',
              onPress: () => handleReview(product, 'callback'),
              disabled: reviewingId === product.id,
              variant: 'reject',
            },
            {
              key: 'donate',
              label: 'Donate',
              onPress: () => handleReview(product, 'donate'),
              disabled: reviewingId === product.id,
              variant: 'warn',
            },
          ]}
        />
      ))}
    </ScreenShell>
  );
};
