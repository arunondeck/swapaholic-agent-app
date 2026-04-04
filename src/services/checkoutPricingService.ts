const toWholeNumber = (value) => {
  const parsed = Number.parseInt(String(value || '0').replace(/[^\d-]/g, ''), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const toCurrencyAmount = (value) => {
  const parsed = Number.parseFloat(String(value || '0').replace(/[^\d.-]/g, ''));
  return Number.isNaN(parsed) ? 0 : parsed;
};

const getSubscriptionUnitPrice = (subscription) => {
  const price = toCurrencyAmount(subscription?.price_c);
  if (price > 0) {
    return price;
  }

  return toCurrencyAmount(subscription?.cost_c);
};

export const getPointsSubscription = (subscriptions = []) =>
  subscriptions.find(
    (subscription) =>
      String(subscription?.type_c || '').toLowerCase() === 'points' ||
      String(subscription?.sub_type_c || '').toLowerCase() === 'add_on_points'
  ) || subscriptions[0] || null;

export const getItemsSubscription = (subscriptions = []) =>
  subscriptions.find(
    (subscription) =>
      String(subscription?.type_c || '').toLowerCase() === 'items' ||
      String(subscription?.sub_type_c || '').toLowerCase() === 'add_on_items'
  ) || subscriptions[0] || null;

export const computeSubscriptionPayables = (subscription, noOfItems = 0) => {
  const normalizedItemCount = toWholeNumber(noOfItems);
  const basePrice = getSubscriptionUnitPrice(subscription);
  const discountMatrix = Array.isArray(subscription?.discount_matrix_c) ? subscription.discount_matrix_c : [];
  let totalCost = 0;
  let peritemCost = 0;
  let checkRangeCounter = 0;

  for (const matrixEntry of discountMatrix) {
    const min = toWholeNumber(matrixEntry?.min);
    const max = toWholeNumber(matrixEntry?.max);
    const discount = toCurrencyAmount(matrixEntry?.discount);

    if (normalizedItemCount >= min && normalizedItemCount <= max) {
      peritemCost = basePrice - (basePrice * (discount / 100));
      totalCost = normalizedItemCount * peritemCost;
      checkRangeCounter += 1;
    }
  }

  if (normalizedItemCount > 0 && checkRangeCounter === 0) {
    if (discountMatrix.length > 0) {
      const lastMatrixEntry = discountMatrix[discountMatrix.length - 1];
      const discount = toCurrencyAmount(lastMatrixEntry?.discount);
      peritemCost = basePrice - (basePrice * (discount / 100));
      totalCost = normalizedItemCount * peritemCost;
    } else {
      peritemCost = basePrice;
      totalCost = normalizedItemCount * peritemCost;
    }
  }

  return {
    totalCost,
    peritemCost,
  };
};

export const buildCheckoutPointsSubscriptionPayload = (subscription, pointsToBuy = 0) => {
  const normalizedPointsToBuy = toWholeNumber(pointsToBuy);
  const payables = computeSubscriptionPayables(subscription, normalizedPointsToBuy);

  return {
    subscription: {
      ...subscription,
      cost_c: Number(payables.totalCost.toFixed(2)),
      number_of_points_c: String(normalizedPointsToBuy),
      number_of_accepted_items_c: 0,
      number_of_rejected_items_c: 0,
    },
    totalCost: Number(payables.totalCost.toFixed(2)),
    peritemCost: Number(payables.peritemCost.toFixed(2)),
  };
};

export const buildCheckoutItemsSubscriptionPayload = (subscription, itemsToBuy = 0) => {
  const normalizedItemsToBuy = toWholeNumber(itemsToBuy);
  const payables = computeSubscriptionPayables(subscription, normalizedItemsToBuy);

  return {
    subscription: {
      ...subscription,
      cost_c: Number(payables.totalCost.toFixed(2)),
      number_of_items_c: String(normalizedItemsToBuy),
      number_of_points_c: String(toWholeNumber(subscription?.number_of_points_c)),
      number_of_accepted_items_c: '0',
      number_of_rejected_items_c: '0',
    },
    totalCost: Number(payables.totalCost.toFixed(2)),
    peritemCost: Number(payables.peritemCost.toFixed(2)),
  };
};

export const calculateCheckoutPaymentSummary = ({
  mode = 'customer',
  cartTotal = 0,
  availablePoints = 0,
  shopPointsSubscriptions = [],
}) => {
  const normalizedCartTotal = toWholeNumber(cartTotal);
  const normalizedAvailablePoints = toWholeNumber(availablePoints);
  const pointsToBuy = mode === 'customer'
    ? Math.max(normalizedCartTotal - normalizedAvailablePoints, 0)
    : Math.max(normalizedCartTotal, 0);
  const selectedSubscription = getPointsSubscription(shopPointsSubscriptions);
  const payable = selectedSubscription ? buildCheckoutPointsSubscriptionPayload(selectedSubscription, pointsToBuy) : null;

  return {
    cartTotal: normalizedCartTotal,
    availablePoints: normalizedAvailablePoints,
    pointsToBuy,
    cashPayable: payable?.totalCost || 0,
    perPointPayable: payable?.peritemCost || 0,
    selectedSubscription,
    payableSubscription: payable?.subscription || null,
  };
};

export const calculateBuyItemsPaymentSummary = ({
  itemCount = 0,
  shopItemsSubscriptions = [],
}) => {
  const normalizedItemCount = toWholeNumber(itemCount);
  const selectedSubscription = getItemsSubscription(shopItemsSubscriptions);
  const payable = selectedSubscription ? buildCheckoutItemsSubscriptionPayload(selectedSubscription, normalizedItemCount) : null;

  return {
    itemCount: normalizedItemCount,
    cashPayable: payable?.totalCost || 0,
    perItemPayable: payable?.peritemCost || 0,
    selectedSubscription,
    payableSubscription: payable?.subscription || null,
  };
};
