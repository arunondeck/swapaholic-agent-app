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

export const ProductCard
 = ({ product, subtitle, footer, children }) => {
  const thumbnail =
    product?.thumbnail ||
    product?.image ||
    product?.thumbnail_c ||
    product?.images?.[0]?.name ||
    DEFAULT_THUMBNAIL;
  const itemId = readName(product?.unique_item_id_c || product?.id, 'NA');
  const name = readName(product?.name, 'Product');
  const category = readName(product?.category);
  const brand = readName(product?.brand);
  const size = readName(product?.size);
  const price = product?.price || product?.points || (product?.evaluated_points_c ? `${product.evaluated_points_c} pts` : 'NA');

  return (
    <View style={styles.itemRow}>
      <Image source={{ uri: thumbnail }} style={styles.itemImage} />
      <View style={styles.itemDetails}>
        <Text style={styles.itemEyebrow}>{itemId}</Text>
        <Text style={styles.cardTitle}>{name}</Text>
        <Text style={styles.itemMeta}>{category} | {size}</Text>
        <Text style={styles.itemMeta}>{brand}</Text>
        <Text style={styles.itemPrice}>{price}</Text>
        {!!subtitle && <Text style={styles.itemMeta}>{subtitle}</Text>}
        {footer}
        {children}
      </View>
    </View>
  );
};
