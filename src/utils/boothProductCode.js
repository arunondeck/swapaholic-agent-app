export const buildBoothProductCode = (product, fallbackBoothId = '0') => {
  if (!product) {
    return 'MB-0-0-0-0';
  }

  const boothId = product.seller_booth?.id ?? fallbackBoothId ?? '0';
  const sellerId = product.seller?.id ?? '0';
  const productId = product.id ?? product.dev_booth_product_id ?? '0';
  const brandId = product.brand?.id ?? '0';

  return `MB-${boothId}-${sellerId}-${productId}-${brandId}`;
};

export const extractBoothProductIdFromCode = (code) => {
  if (!code) {
    return null;
  }

  const normalized = String(code).trim();
  if (!normalized.toUpperCase().startsWith('MB-')) {
    return null;
  }

  const parts = normalized.split('-');
  if (parts.length < 5) {
    return null;
  }

  return parts[3] || null;
};
