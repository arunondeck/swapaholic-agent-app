import React from 'react';
import { Text } from 'react-native';
import { SwapProductCard } from './SwapProductCard';
import { styles } from '../styles/commonStyles';

/**
 * @param {{ items: import('../types/swapTypes').SwapProduct[], title?: string }} props
 */
export const SwappedInItemsSection = ({ items = [], title = 'Items Swapped In' }) => (
  <>
    <Text style={styles.sectionTitle}>{title}</Text>
    {items.map((item) => (
      <SwapProductCard
        key={item.id}
        product={item}
        subtitle={`Item ID: ${item.unique_item_id_c || item.id} | ${item.category?.name || 'NA'} | ${item.style?.name || 'NA'}`}
      />
    ))}
  </>
);
