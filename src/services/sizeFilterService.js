/**
 * @param {string} value
 * @returns {string}
 */
const normalize = (value = '') => String(value || '').trim().toLowerCase();

const FOOTWEAR_CATEGORY_KEYWORDS = ['shoe', 'shoes', 'heel', 'heels', 'sandal', 'sandals', 'boot', 'boots', 'sneaker', 'sneakers', 'loafer', 'loafers', 'slipper', 'slippers', 'footwear'];

/**
 * @param {string} categoryName
 * @returns {'footwear' | 'item'}
 */
const resolveSizeFamilyFromCategory = (categoryName = '') => {
  const normalizedCategory = normalize(categoryName);
  return FOOTWEAR_CATEGORY_KEYWORDS.some((keyword) => normalizedCategory.includes(keyword)) ? 'footwear' : 'item';
};

/**
 * @param {string} userSegmentName
 * @returns {'women' | 'men' | 'girls' | 'boys' | 'children' | ''}
 */
const resolveAudienceFromUserSegment = (userSegmentName = '') => {
  const normalizedSegment = normalize(userSegmentName);

  if (normalizedSegment.includes('women') || normalizedSegment === 'w') {
    return 'women';
  }

  if (normalizedSegment.includes('men') || normalizedSegment === 'm') {
    return 'men';
  }

  if (normalizedSegment.includes('girls') || normalizedSegment === 'g') {
    return 'girls';
  }

  if (normalizedSegment.includes('boys') || normalizedSegment === 'b') {
    return 'boys';
  }

  if (normalizedSegment.includes('child') || normalizedSegment.includes('kid')) {
    return 'children';
  }

  return '';
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
  const family = resolveSizeFamilyFromCategory(categoryName);
  const audience = resolveAudienceFromUserSegment(userSegmentName);

  if (!Array.isArray(sizes) || !audience) {
    return [];
  }

  const exactType = `${family}_${audience}`;
  const fallbackChildrenType = family === 'footwear' && (audience === 'girls' || audience === 'boys') ? `${family}_children` : '';

  return sizes.filter((size) => {
    const type = normalize(size?.type_c || '');
    return type === exactType || (fallbackChildrenType ? type === fallbackChildrenType : false);
  });
};

