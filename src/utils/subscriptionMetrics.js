const toWholeNumber = (value, fallback = 0) => {
  const parsed = Number.parseInt(String(value ?? fallback), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

/**
 * @param {string | number | undefined | null} totalItemsValue
 * @param {Array<unknown> | number | undefined | null} customerItemsOrCount
 * @returns {number}
 */
export const getRemainingItemsCount = (totalItemsValue, customerItemsOrCount) => {
  const totalItems = toWholeNumber(totalItemsValue);
  const customerItemsCount = Array.isArray(customerItemsOrCount)
    ? customerItemsOrCount.length
    : toWholeNumber(customerItemsOrCount);

  return Math.max(0, totalItems - customerItemsCount);
};
