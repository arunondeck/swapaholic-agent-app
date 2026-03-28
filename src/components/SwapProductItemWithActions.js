import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
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

const readPrice = (product) => {
  if (product?.points) {
    return String(product.points).replace(/\s*pts$/i, '');
  }

  if (product?.evaluated_points_c) {
    return String(product.evaluated_points_c);
  }

  return '0';
};

const ACTION_VARIANT_STYLES = {
  approve: styles.approveBtn,
  reject: styles.rejectBtn,
  warn: [styles.rejectBtn, { backgroundColor: '#a16207' }],
  neutral: styles.cartItemRemoveButton,
};

const ACTION_TEXT_STYLES = {
  approve: styles.btnText,
  reject: styles.btnText,
  warn: styles.btnText,
  neutral: styles.cartItemRemoveText,
};

export const SwapProductItemWithActions = ({ product, actions = [], metaLines = [] }) => {
  const thumbnail =
    product?.thumbnail ||
    product?.image ||
    product?.thumbnail_c ||
    product?.images?.[0]?.name ||
    DEFAULT_THUMBNAIL;
  const name = readName(product?.name, 'Product');
  const sku = product?.unique_item_id_c || product?.sku || '';
  const size = readName(product?.size, '');
  const brand = readName(product?.brand, '');
  const amount = readPrice(product);

  return (
    <View style={styles.cartItemRow}>
      <Image source={{ uri: thumbnail }} style={styles.cartItemImage} />
      <View style={styles.cartItemBody}>
        <View style={styles.cartItemMainRow}>
          <View style={styles.cartItemContent}>
            <View style={styles.cartItemDetails}>
              <Text style={styles.cartItemName}>{name}</Text>
              {!!sku && <Text style={styles.cartItemMeta}>ID: {sku}</Text>}
              <Text style={styles.cartItemMeta}>{[size && `Size: ${size}`, brand && `Brand: ${brand}`].filter(Boolean).join(' | ')}</Text>
              {metaLines.map((line) => (
                <Text key={line} style={styles.cartItemMeta}>
                  {line}
                </Text>
              ))}
            </View>
          </View>
          <View style={styles.cartItemPriceColumn}>
            <Text style={styles.cartItemPrice}>{amount}</Text>
            <Text style={styles.cartItemPriceSuffix}>pts</Text>
          </View>
        </View>
        {actions.length > 0 ? (
          <View style={styles.cartItemActionsRow}>
            {actions.map((action) => {
              const variant = action.variant || 'neutral';
              return (
                <TouchableOpacity
                  key={action.key || action.label}
                  onPress={action.onPress}
                  style={ACTION_VARIANT_STYLES[variant] || ACTION_VARIANT_STYLES.neutral}
                  disabled={action.disabled}
                >
                  <Text style={ACTION_TEXT_STYLES[variant] || ACTION_TEXT_STYLES.neutral}>{action.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}
      </View>
    </View>
  );
};
