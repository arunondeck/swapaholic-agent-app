/**
 * @param {string} value
 * @returns {string}
 */
const normalize = (value = '') => String(value || '').trim().toLowerCase();

/**
 * @param {{
 *   styles?: import('../types/swapTypes').SwapStyle[],
 *   categoryId?: string
 * }} params
 * @returns {import('../types/swapTypes').SwapStyle[]}
 */
export const filterStylesByCategory = ({ styles = [], categoryId = '' } = {}) => {
  const normalizedCategoryId = normalize(categoryId);

  if (!Array.isArray(styles) || !normalizedCategoryId) {
    return [];
  }

  return styles.filter((style) => normalize(style?.category_id_c || '') === normalizedCategoryId);
};
