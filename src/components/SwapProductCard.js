import React from 'react';
import { Image, Text, View } from 'react-native';
import { styles } from '../styles/commonStyles';

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

/**
 * @typedef {Object} SwapProductCardProps
 * @property {import('../types/swapTypes').SwapProduct} product
 * @property {string} [subtitle]
 * @property {React.ReactNode} [footer]
 * @property {React.ReactNode} [children]
 */

/**
 * @param {SwapProductCardProps} props
 */
export const SwapProductCard
 = ({ product, subtitle, footer, children }) => {
  const thumbnail =
    product?.thumbnail ||
    product?.image ||
    product?.thumbnail_c ||
    product?.images?.[0]?.name ||
    DEFAULT_THUMBNAIL;
  const itemId = readName(product?.unique_item_id_c || product?.id, 'NA');
  const category = readName(product?.category);
  const brand = readName(product?.brand);
  const size = readName(product?.size);
  const price = product?.price || product?.points || (product?.evaluated_points_c ? `${product.evaluated_points_c} pts` : 'NA');
  const color = readName(product?.color);
  const hasFallbackCardName = typeof product?.name === 'string' && product?.name.trim();
  const shouldUseCardName = brand === 'NA' && category === 'NA' && color === 'NA' && hasFallbackCardName;
  const name = shouldUseCardName ? product.name?.trim() : `${brand} ${color} ${category}`;
  const status = String(product?.status_c || '').trim().toLowerCase();
  const showNotApprovedRibbon = Boolean(status && status !== 'approved');

  return (
    <View style={styles.itemRow}>
      {showNotApprovedRibbon ? (
        <View style={styles.itemRibbon}>
          <Text style={styles.itemRibbonText}>Not Approved</Text>
        </View>
      ) : null}
      <Image source={{ uri: thumbnail }} style={styles.itemImage} />
      <View style={styles.itemDetails}>
        <Text style={styles.itemEyebrow}>{itemId}</Text>
        <Text style={styles.cardTitle}>{name}</Text>
        <Text style={styles.itemMeta}>Size: {size}</Text>
        <Text style={styles.itemPrice}>{price}</Text>
        {footer}
        {children}
      </View>
    </View>
  );
};
