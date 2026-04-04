import React, { useEffect, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { getCustomerUnreviewedItems, reviewCustomerItem } from '../../api/swapOpsApi';
import { ScreenShell } from '../../components/ScreenShell';
import { SwapProductItemWithActions } from '../../components/SwapProductItemWithActions';
import { useLoader } from '../../utils/LoaderContextShared';
import { buildCustomerUnreviewedItemsCacheKey, useSwapStore } from '../../store/swapStore';
import { styles } from '../../styles/commonStyles';

/**
 * @typedef {{
 *   pop: () => void,
 *   customerEmail?: string,
 *   showDateEntered?: boolean
 * }} ApprovalScreenProps
 */

/**
 * @typedef {{
 *   ignored_items?: Array<unknown>,
 *   next_offset?: number,
 *   total_count?: number,
 *   result_count?: number,
 *   total_pages?: number,
 *   current_page?: number,
 *   items?: import('../../types/swapTypes').SwapProduct[],
 *   query?: string,
 *   user_segment?: string | null,
 *   state_hash?: string | null
 * }} ReviewItemsListData
 */

/**
 * @param {import('../../types/swapTypes').SwapApiEnvelope<ReviewItemsListData> | Record<string, unknown>} response
 * @returns {ReviewItemsListData}
 */
const getReviewData = (response) => {
  if (response?.success?.data && typeof response.success.data === 'object') {
    return response.success.data;
  }

  if (response?.error?.data && typeof response.error.data === 'object') {
    return response.error.data;
  }

  return {};
};

const PAGE_SIZE_OPTIONS = [20, 50, 100];

/**
 * @param {ApprovalScreenProps} props
 */
export const ApprovalScreen = ({ pop, customerEmail, showDateEntered = false }) => {
  const [reviewingId, setReviewingId] = useState('');
  const [pageSize, setPageSize] = useState(20);
  const [offset, setOffset] = useState(0);
  const { withLoader } = useLoader();
  const activeCustomer = useSwapStore((state) => state.activeCustomer);
  const fetchCustomerUnreviewedItemsIfNeeded = useSwapStore((state) => state.fetchCustomerUnreviewedItemsIfNeeded);
  const fetchCustomerProfileIfNeeded = useSwapStore((state) => state.fetchCustomerProfileIfNeeded);
  const invalidateCustomerCache = useSwapStore((state) => state.invalidateCustomerCache);
  const canUseCache = useSwapStore((state) => state.isCustomerCacheUsable);
  const activeEmail = customerEmail || activeCustomer?.email || '';
  const activeToken = activeCustomer?.token || activeCustomer?.loginResponse?.token || '';
  const cacheKey = buildCustomerUnreviewedItemsCacheKey({ maxResults: pageSize, offset, filters: [] });
  const reviewEntry = useSwapStore((state) => state.currentCustomerData.unreviewedItemsByKey[cacheKey] || null);
  const reviewData = getReviewData(reviewEntry?.data);
  const products = Array.isArray(reviewData?.items) ? reviewData.items : [];
  const totalCount = Number(reviewData?.total_count || 0);
  const currentPage = Number(reviewData?.current_page || 1);
  const totalPages = Number(reviewData?.total_pages || 0);
  const nextOffset = Number(reviewData?.next_offset ?? -1);
  const error = reviewEntry?.error || '';

  useEffect(() => {
    const loadProducts = async () => {
      const state = useSwapStore.getState();
      const latestReviewEntry = state.currentCustomerData.unreviewedItemsByKey[cacheKey] || null;
      const request = fetchCustomerUnreviewedItemsIfNeeded({
        maxResults: pageSize,
        offset,
        customerEmail: activeEmail,
        authToken: activeToken,
      });
      const hasUsableCache = canUseCache(latestReviewEntry);

      try {
        if (hasUsableCache) {
          await request;
        } else {
          await withLoader(request, 'Loading swap review items...');
        }
      } catch {
        // Store entries capture fetch errors for rendering.
      }
    };

    loadProducts();
  }, [activeEmail, activeToken, cacheKey, canUseCache, fetchCustomerUnreviewedItemsIfNeeded, offset, pageSize, withLoader]);

  /**
   * @param {import('../../types/swapTypes').SwapProduct} product
   * @param {import('../../types/swapTypes').SwapReviewItemRequest['status_c']} status
   */
  const handleReview = async (product, status) => {
    try {
      setReviewingId(product.id);
      const response = await withLoader(
        reviewCustomerItem({
          id: product.id,
          status_c: status,
          customerEmail: activeEmail,
          authToken: activeToken,
        }),
        'Submitting review...'
      );

      if (response?.status === false) {
        throw new Error(response?.error?.message || 'Failed to review item');
      }

      invalidateCustomerCache(['unreviewedItemsByKey', 'profile']);
      await fetchCustomerProfileIfNeeded(activeEmail, { force: true });
      await fetchCustomerUnreviewedItemsIfNeeded(
        {
          maxResults: pageSize,
          offset,
          customerEmail: activeEmail,
          authToken: activeToken,
        },
        { force: true }
      );
    } catch (reviewError) {
      Alert.alert('Review Failed', reviewError.message || 'Unable to review this item.');
    } finally {
      setReviewingId('');
    }
  };

  return (
    <ScreenShell
      title="Swap Review"
      subtitle={
        error ||
        (customerEmail ? `Unconfirmed items for ${customerEmail}` : 'Pending unconfirmed customer items')
      }
      onBack={pop}
      backgroundColor="#ffe4e1"
    >
      {error ? <Text>{error}</Text> : null}

      {!error ? (
        <View style={styles.itemRow}>
          <View style={styles.itemDetails}>
            <Text style={styles.cardTitle}>{totalCount} review items found</Text>
            <Text style={styles.itemMeta}>
              Page {currentPage} of {Math.max(totalPages, 1)}
            </Text>
            <View style={styles.chipRow}>
              {PAGE_SIZE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.chip, pageSize === option ? styles.chipActive : null]}
                  onPress={() => {
                    setPageSize(option);
                    setOffset(0);
                  }}
                >
                  <Text style={styles.chipText}>{option} items</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.chipRow}>
              <TouchableOpacity
                style={[styles.chip, currentPage <= 1 ? styles.paginationChipDisabled : null]}
                onPress={() => setOffset((current) => Math.max(current - pageSize, 0))}
                disabled={currentPage <= 1}
              >
                <Text style={styles.chipText}>Previous</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.chip, nextOffset < 0 ? styles.paginationChipDisabled : null]}
                onPress={() => setOffset(nextOffset)}
                disabled={nextOffset < 0}
              >
                <Text style={styles.chipText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : null}

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
          metaLines={showDateEntered && product?.date_entered ? [`Date Entered: ${product.date_entered}`] : []}
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
