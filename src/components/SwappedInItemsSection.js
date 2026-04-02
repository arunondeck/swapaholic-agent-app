import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SwapProductCard } from './SwapProductCard';
import { styles } from '../styles/commonStyles';

/**
 * @param {{ items: import('../types/swapTypes').SwapProduct[], title?: string, loading?: boolean }} props
 */
export const SwappedInItemsSection = ({ items = [], title = 'Items Swapped In', loading = false }) => (
  <>
    <Text style={styles.sectionTitle}>{title}</Text>
    {loading ? (
      <View style={styles.listItem}>
        <ActivityIndicator />
        <Text style={styles.itemMeta}>Refreshing items...</Text>
      </View>
    ) : items.length === 0 ? (
      <Text style={styles.itemMeta}>No items found.</Text>
    ) : (
      items.map((item) => (
        <SwapProductCard
          key={item.id}
          product={item}
          subtitle={`Item ID: ${item.unique_item_id_c || item.id} | ${item.category?.name || 'NA'} | ${item.style?.name || 'NA'}`}
        />
      ))
    )}
  </>
);
