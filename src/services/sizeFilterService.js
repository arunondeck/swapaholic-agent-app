/**
 * @param {string} value
 * @returns {string}
 */
const normalize = (value = '') => String(value || '').trim().toLowerCase();

const FOOTWEAR_CATEGORY_KEYWORDS = ['shoe', 'shoes', 'heel', 'heels', 'sandal', 'sandals', 'boot', 'boots', 'sneaker', 'sneakers', 'loafer', 'loafers', 'slipper', 'slippers', 'footwear'];
const BAG_CATEGORY_KEYWORDS = ['bag', 'bags', 'handbag', 'handbags', 'purse', 'purses', 'tote', 'totes', 'backpack', 'backpacks', 'satchel', 'satchels', 'clutch', 'clutches'];

/**
 * @param {string} input
 * @param {string[]} keywords
 * @returns {boolean}
 */
const includesKeyword = (input = '', keywords = []) => {
  const normalizedInput = normalize(input);
  return keywords.some((keyword) => normalizedInput.includes(keyword));
};

/**
 * @param {string} userSegmentName
 * @returns {'women' | 'men' | 'children' | 'unisex' | ''}
 */
const resolveAudienceFromUserSegment = (userSegmentName = '') => {
  const normalizedSegment = normalize(userSegmentName);

  if (normalizedSegment.includes('women') || normalizedSegment === 'w') {
    return 'women';
  }

  if (normalizedSegment.includes('men') || normalizedSegment === 'm') {
    return 'men';
  }

  if (
    normalizedSegment.includes('girls') ||
    normalizedSegment === 'g' ||
    normalizedSegment.includes('boys') ||
    normalizedSegment === 'b' ||
    normalizedSegment.includes('child') ||
    normalizedSegment.includes('kid')
  ) {
    return 'children';
  }

  if (normalizedSegment.includes('unisex') || normalizedSegment === 'u') {
    return 'unisex';
  }

  return '';
};

/**
 * @param {string} categoryName
 * @param {string} audience
 * @returns {string[]}
 */
const resolveAllowedTypes = (categoryName = '', audience = '') => {
  if (includesKeyword(categoryName, BAG_CATEGORY_KEYWORDS)) {
    return ['bag'];
  }

  if (includesKeyword(categoryName, FOOTWEAR_CATEGORY_KEYWORDS)) {
    if (audience === 'women') {
      return ['footwear_women'];
    }

    if (audience === 'men') {
      return ['footwear_men'];
    }

    if (audience === 'children') {
      return ['footwear_children'];
    }
  }

  if (audience === 'women') {
    return ['item_women'];
  }

  if (audience === 'men') {
    return ['item_men'];
  }

  if (audience === 'children') {
    return ['item_children'];
  }

  if (audience === 'unisex') {
    return ['unisex', ''];
  }

  return [];
};

/**
 * @param {{
 *   sizes?: import('../types/swapTypes').SwapSize[],
 *   categoryName?: string,
 *   userSegmentName?: string
 * }} params
 * @returns {import('../types/swapTypes').SwapSize[]}
 */
export const filterSizesByTaxonomy = ({ sizes = [], categoryName = '', userSegmentName = '' } = {}) => {
  const audience = resolveAudienceFromUserSegment(userSegmentName);
  const allowedTypes = resolveAllowedTypes(categoryName, audience);

  if (!Array.isArray(sizes) || !allowedTypes.length) {
    return [];
  }

  return sizes.filter((size) => {
    const type = normalize(size?.type_c || '');
    return allowedTypes.includes(type);
  });
};
