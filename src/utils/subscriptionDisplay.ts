const parseSortDate = (value) => {
  if (!value) {
    return Number.NEGATIVE_INFINITY;
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
};

const toCapitalizedWords = (value) =>
  String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

export const formatSubscriptionDate = (value) => {
  const timestamp = parseSortDate(value);
  if (!Number.isFinite(timestamp) || timestamp === Number.NEGATIVE_INFINITY) {
    return 'NA';
  }

  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export const formatSubscriptionDateTime = (value) => {
  const timestamp = parseSortDate(value);
  if (!Number.isFinite(timestamp) || timestamp === Number.NEGATIVE_INFINITY) {
    return 'NA';
  }

  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}-${month}-${year} at ${hours}:${minutes}`;
};

/**
 * @param {import('../types/swapTypes').SwapSubscription | import('../types/swapTypes').SwapCustomerSubscribe | null | undefined} subscription
 */
export const getSubscriptionKind = (subscription) => {
  const type = String(subscription?.subscriptionType || '').toLowerCase();
  const subType = String(subscription?.subscriptionSubType || '').toLowerCase();
  const plan = String(subscription?.plan || '').trim().toLowerCase();

  if (type === 'points' || subType === 'add_on_points' || plan === 'buy points') {
    return 'buy-points';
  }

  if (type === 'items' || subType === 'add_on_items' || plan === 'flexi swap shopper' || plan === 'flexi swqap shoppepr') {
    return 'flexi';
  }

  return 'default';
};

/**
 * @param {import('../types/swapTypes').SwapSubscription | import('../types/swapTypes').SwapCustomerSubscribe | null | undefined} subscription
 */
export const getSubscriptionTypeLabel = (subscription) => {
  const kind = getSubscriptionKind(subscription);
  if (kind === 'buy-points') {
    return 'Buy Points';
  }

  if (kind === 'flexi') {
    return 'Flexi Swap Shopper';
  }

  return subscription?.plan || 'Subscription';
};

/**
 * @param {import('../types/swapTypes').SwapSubscription | null | undefined} subscription
 */
export const getSubscriptionStatusDisplay = (subscription) => {
  const normalizedStatus = String(subscription?.status || '').trim().toLowerCase();
  const timestamp = parseSortDate(subscription?.renewalDate);
  let expired = false;

  if (Number.isFinite(timestamp) && timestamp !== Number.NEGATIVE_INFINITY) {
    const expiryDate = new Date(timestamp);
    expiryDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expired = expiryDate < today;
  }

  const isCompleted = normalizedStatus === 'completed';
  const showExpiredStatus = normalizedStatus === 'active' && expired;

  return {
    text: showExpiredStatus ? 'Active Expired' : toCapitalizedWords(subscription?.status || 'Unknown'),
    isCompleted,
    isExpired: showExpiredStatus,
  };
};
