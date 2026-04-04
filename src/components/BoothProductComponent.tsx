import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles/commonStyles';

const DEFAULT_THUMBNAIL = 'https://placehold.co/120x120/png?text=Booth+Item';

const readImage = (product) =>
  product?.thumbnail_c ||
  product?.thumbnail ||
  product?.image ||
  product?.images?.[0]?.url ||
  product?.images?.[0]?.name ||
  DEFAULT_THUMBNAIL;

const readFriendlyId = (product) => product?.friendly_product_id || product?.code || product?.id || 'NA';

const readSize = (product) => product?.size_on_label || product?.size || 'NA';

const readPrice = (product) => {
  if (typeof product?.price === 'string' && product.price.trim()) {
    return product.price;
  }

  if (product?.listing_price != null && product.listing_price !== '') {
    return `$${Number(product.listing_price || 0).toFixed(2)}`;
  }

  return '$0.00';
};

const getActionStyle = (variant) => {
  switch (variant) {
    case 'approve':
      return styles.approveBtn;
    case 'reject':
      return styles.rejectBtn;
    case 'warn':
      return [styles.secondaryButton, styles.boothProductActionWarnButton];
    default:
      return styles.secondaryButton;
  }
};

const getActionTextStyle = (variant) => {
  switch (variant) {
    case 'approve':
    case 'reject':
      return styles.btnText;
    case 'warn':
      return [styles.secondaryButtonText, styles.boothProductActionWarnText];
    default:
      return styles.secondaryButtonText;
  }
};

export const BoothProductComponent = ({ item, actionLabel = '', onAction = undefined, actions = [], detailLine = '', showBoothName = true }) => {
  const product = item?.booth_product || item;
  const imageUri = readImage(product);
  const friendlyId = readFriendlyId(product);
  const size = readSize(product);
  const price = readPrice(product);
  const resolvedActions = actions.length > 0 ? actions : actionLabel && onAction ? [{ label: actionLabel, onPress: onAction, variant: 'neutral' }] : [];
  const resolvedDetailLine = detailLine || `Qty: ${item?.quantity || 0} | Size: ${size}`;

  return (
    <View style={styles.boothProductCard}>
      <View style={styles.boothProductRow}>
        <Image source={{ uri: imageUri }} style={styles.boothProductImage} resizeMode="cover" />

        <View style={styles.boothProductDetails}>
          <Text style={styles.boothProductFriendlyId}>{friendlyId}</Text>
          <Text style={styles.boothProductName}>{product?.name || 'Unknown product'}</Text>
          <Text style={styles.boothProductMeta}>{resolvedDetailLine}</Text>
          {showBoothName ? <Text style={styles.boothProductBoothName}>{product?.seller_booth?.name || 'NA'}</Text> : null}
        </View>

        <View style={styles.boothProductPriceColumn}>
          <Text style={styles.boothProductPrice}>{price}</Text>
        </View>
      </View>

      {resolvedActions.length > 0 ? (
        <View style={styles.boothProductActionRow}>
          {resolvedActions.map((action) => (
            <TouchableOpacity
              key={action.key || action.label}
              style={getActionStyle(action.variant || 'neutral')}
              onPress={action.onPress}
              disabled={action.disabled}
            >
              <Text style={getActionTextStyle(action.variant || 'neutral')}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );
};
