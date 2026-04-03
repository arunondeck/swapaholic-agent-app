import {
  categoryOptions,
  colorOptions,
  conditionOptions,
  customerOrders,
  customerPickups,
  customerCheckoutCart,
  mockBoothCheckouts,
  mockBoothPaymentMethods,
  customerSubscriptions,
  customerSuccessData,
  customerSwappedInItems,
  formatRemainingItems as formatMockRemainingItems,
  mockSellerBooths,
  getCustomerPickup as getMockCustomerPickup,
  getCustomerProfile as getMockCustomerProfile,
  getCustomerSubscription as getMockCustomerSubscription,
  getPickupStatus as getMockPickupStatus,
  mockBrands,
  mockBoothProducts,
  mockColors,
  mockProductReviews,
  mockCategories,
  mockMadeIns,
  mockMaterials,
  mockOccasions,
  mockSizes,
  mockSwapProducts,
  mockStyles,
  mockUserSegments,
  plans,
  swapSubscriptionCatalog,
} from '../data/mockData';
import {
  createLiveBoothCheckout,
  fetchAllBoothCheckouts,
  fetchBoothCheckout,
  fetchBoothPaymentMethods,
  fetchBoothProductById,
  fetchBoothProducts,
  fetchBoothProductStatusCounts,
  fetchSellerBooths,
  markLiveProductSale,
  mutateBooth,
  mutateBoothProduct,
} from './boothGraphqlApi';
import { getRemainingItemsCount } from '../utils/subscriptionMetrics';
import {
  getCachedStoredAppSession,
  loadStoredAppSession,
  saveStoredAppSession,
  getStoredBuyPointsCustomerId,
  getStoredBuyPointsEmail,
  getStoredBuyPointsToken,
  getStoredGuestToken,
  getStoredShopCustomerId,
  getStoredOperatorToken,
  getStoredShopToken,
} from '../store/appSessionStorage';
import { buildCheckoutPointsSubscriptionPayload, getPointsSubscription } from '../services/checkoutPricingService';
import { buildBoothProductCode, extractBoothProductIdFromCode } from '../utils/boothProductCode';

/**
 * Creates an async delay used by mock-mode endpoints.
 * @param {number} [ms=150]
 * @returns {Promise<void>}
 */
const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

const SWAP_API_URL = (process.env.EXPO_PUBLIC_SWAP_API_URL || '').replace(/\/$/, '');
const SWAP_WALLET_API_URL = (process.env.EXPO_PUBLIC_SWAP_WALLET_API_URL || '').replace(/\/$/, '');
const SWAP_API_VERSION = process.env.EXPO_PUBLIC_SWAP_API_VERSION || '';
const SWAP_USE_MOCK = (process.env.EXPO_PUBLIC_SWAP_USE_MOCK || 'true').toLowerCase() === 'true';
const BOOTH_USE_MOCK = (process.env.EXPO_PUBLIC_BOOTH_USE_MOCK || process.env.EXPO_PUBLIC_SWAP_USE_MOCK || 'true').toLowerCase() === 'true';
const DEFAULT_OPS_LOGIN_USERNAME = (process.env.EXPO_PUBLIC_DEFAULTOPS_LOGIN_USERNAME || '').trim();
const DEFAULT_OPS_LOGIN_PASSWORD = process.env.EXPO_PUBLIC_DEFAULTOPS_LOGIN_PASSWORD || '';
const APP_LOGIN_PATH = 'guests/customers/get-started';
const APP_GUEST_REGISTER_PATH = 'guests/register';
const APP_LOGIN_TENANCY = 'SWAP.AUTH.TYPE.EMAIL';
const SWAP_ORDER_CREATE_PATH = 'orders/save/shop';
const SWAP_ORDER_LIST_PATH = 'orders/list';
const SWAP_ORDER_DETAIL_PATH = 'orders/detail';
const EMPTY_ARRAY = [];
const CUSTOMER_DETAILS_REQUEST = {
  data_tenancy: 'SWAP.CUSTOMER.DATA_VIEW.DETAIL_PROTECTED',
  detail_tenancy: 'SWAP.CUSTOMER.DETAIL_VIEW.TOKEN',
  fetch_subscription: 'true',
  fetch_pending_subscribe: 'true',
  ignore_non_pickup_subscribe: 'true',
  reset_cache: true,
  fetch_wallets: true,
  fetch_subscribe_list: true,
};
const DEFAULT_PICKUP_TRIP_TIME = process.env.EXPO_PUBLIC_SWAP_PICKUP_TRIP_TIME || '';
const DEFAULT_PICKUP_ADDRESS = {
  apt_no_c: process.env.EXPO_PUBLIC_SWAP_PICKUP_APT_NO || '',
  building_name_c: process.env.EXPO_PUBLIC_SWAP_PICKUP_BUILDING_NAME || '',
  street_no_c: process.env.EXPO_PUBLIC_SWAP_PICKUP_STREET_NO || '',
  street_name_c: process.env.EXPO_PUBLIC_SWAP_PICKUP_STREET_NAME || '',
  country_c: process.env.EXPO_PUBLIC_SWAP_PICKUP_COUNTRY || '',
  state_c: process.env.EXPO_PUBLIC_SWAP_PICKUP_STATE || '',
  city_c: process.env.EXPO_PUBLIC_SWAP_PICKUP_CITY || '',
  postal_code_c: process.env.EXPO_PUBLIC_SWAP_PICKUP_POSTAL_CODE || '',
};
const TOKEN_SCOPE = Object.freeze({
  GUEST: 'guest',
  OPERATOR: 'operator',
  SHOP: 'shop',
  BOOTH: 'booth',
  BUY_POINTS: 'buyPoints',
});
const CUSTOMER_TOKEN_SCOPE_PREFIX = 'customer:';
const AUTH_ERROR_PATTERNS = [
  'auth token',
  'authorization',
  'expired',
  'forbidden',
  'invalid session',
  'invalid token',
  'jwt',
  'session expired',
  'token invalid',
  'unauthorized',
];
const customerSessionCache = new Map();
const tokenRefreshRequests = new Map();
let boothProductsStore = mockBoothProducts.map((product) => ({ ...product }));
let boothCheckoutsStore = mockBoothCheckouts.map((checkout) => ({
  ...checkout,
  items: (checkout.items || []).map((item) => ({ ...item })),
}));
let customerOrdersStore = customerOrders.map((order) => ({
  ...order,
  customer: order.customer ? { ...order.customer } : null,
  order_line_items: (order.order_line_items || []).map((item) => ({ ...item })),
}));

const getResponseData = (response) => response?.success?.data || {};

const getResponseError = (response) => response?.error || null;

const getResponseDataList = (response, key) => {
  const data = getResponseData(response);
  if (Array.isArray(data?.[key])) {
    return data[key];
  }

  if (Array.isArray(response?.[key])) {
    return response[key];
  }

  return EMPTY_ARRAY;
};

const getResponsePrimaryRecord = (response) => {
  const data = getResponseData(response);

  if (data && typeof data === 'object') {
    if (data.item && typeof data.item === 'object') {
      return data.item;
    }

    if (data.customer_item && typeof data.customer_item === 'object') {
      return data.customer_item;
    }

    return data;
  }

  if (response?.item && typeof response.item === 'object') {
    return response.item;
  }

  return null;
};

const DEFAULT_TAXONOMY_LIST_PARAMS = {
  max_results: 250,
  offset: 0,
  order_by: 'name ASC',
};

const DEFAULT_MATERIALS_LIST_PARAMS = {
  max_results: 100,
  offset: 0,
};

const persistAppSessionPatch = async (patch = {}) => {
  const currentSession = getCachedStoredAppSession() || (await loadStoredAppSession()) || {};
  const nextSession = {
    ...currentSession,
    ...patch,
  };
  await saveStoredAppSession(nextSession);
  return nextSession;
};

const normalizeEmail = (value = '') => String(value || '').trim().toLowerCase();

const createCustomerTokenScope = (email = '') => {
  const normalizedEmail = normalizeEmail(email);
  return normalizedEmail ? `${CUSTOMER_TOKEN_SCOPE_PREFIX}${normalizedEmail}` : '';
};

const getCustomerEmailFromTokenScope = (tokenScope = '') =>
  String(tokenScope || '').startsWith(CUSTOMER_TOKEN_SCOPE_PREFIX)
    ? String(tokenScope).slice(CUSTOMER_TOKEN_SCOPE_PREFIX.length)
    : '';

const isAuthErrorMessage = (message = '') => {
  const normalizedMessage = String(message || '').trim().toLowerCase();
  return normalizedMessage ? AUTH_ERROR_PATTERNS.some((pattern) => normalizedMessage.includes(pattern)) : false;
};

const shouldRefreshTokenFromError = (error) =>
  Boolean(
    error?.invalidToken ||
      error?.status === 401 ||
      error?.status === 403 ||
      isAuthErrorMessage(error?.message)
  );

const createAuthRequestError = (message, extras = {}) => {
  const error = new Error(message);
  Object.assign(error, extras);
  return error;
};

const getStoredTokenForScope = async (tokenScope = '') => {
  const cachedSession = getCachedStoredAppSession();

  switch (tokenScope) {
    case TOKEN_SCOPE.GUEST:
      return cachedSession?.guestToken || (await getStoredGuestToken());
    case TOKEN_SCOPE.OPERATOR:
      return cachedSession?.operatorToken || (await getStoredOperatorToken());
    case TOKEN_SCOPE.SHOP:
      return cachedSession?.shopToken || (await getStoredShopToken());
    case TOKEN_SCOPE.BUY_POINTS:
      return cachedSession?.buyPointsToken || (await getStoredBuyPointsToken());
    default:
      return '';
  }
};

const refreshPersistedCustomerToken = async ({ loginFn, tokenKey, customerIdKey, extraPatch = {} } = {}) => {
  const session = await loginFn();
  const token = session?.token || '';
  const customerId = session?.customer?.id || '';

  if (!token) {
    throw new Error(`Failed to refresh ${tokenKey}.`);
  }

  await persistAppSessionPatch({
    ...extraPatch,
    [tokenKey]: token,
    ...(customerIdKey ? { [customerIdKey]: customerId } : {}),
  });

  return token;
};

const refreshAuthTokenForScope = async (tokenScope = '', { force = false } = {}) => {
  if (!tokenScope) {
    return '';
  }

  if (!force) {
    const storedToken = await getStoredTokenForScope(tokenScope);
    if (storedToken) {
      return storedToken;
    }
  }

  if (tokenRefreshRequests.has(tokenScope)) {
    return tokenRefreshRequests.get(tokenScope);
  }

  const refreshPromise = (async () => {
    switch (tokenScope) {
      case TOKEN_SCOPE.GUEST: {
        const guestSession = await registerGuestSession();
        const guestToken = guestSession?.guestToken || guestSession?.token || '';
        if (guestToken) {
          await persistAppSessionPatch({ guestToken });
        }
        return guestToken;
      }
      case TOKEN_SCOPE.OPERATOR: {
        const guestToken = await refreshAuthTokenForScope(TOKEN_SCOPE.GUEST);
        const operatorSession = await loginAsShopUser(guestToken);
        const operatorToken = operatorSession?.token || '';
        if (operatorToken) {
          await persistAppSessionPatch({ guestToken, operatorToken });
        }
        return operatorToken;
      }
      case TOKEN_SCOPE.SHOP:
        return refreshPersistedCustomerToken({
          loginFn: loginAsSwapShopCustomer,
          tokenKey: 'shopToken',
        });
      case TOKEN_SCOPE.BOOTH:
        return refreshPersistedCustomerToken({
          loginFn: loginAsBoothCustomer,
          tokenKey: 'boothToken',
          customerIdKey: 'boothCustomerId',
        });
      case TOKEN_SCOPE.BUY_POINTS: {
        const buyPointsEmail = normalizeEmail(process.env.EXPO_PUBLIC_SWAP_BUY_POINTS_EMAIL);
        return refreshPersistedCustomerToken({
          loginFn: loginAsBuyPointsCustomer,
          tokenKey: 'buyPointsToken',
          customerIdKey: 'buyPointsCustomerId',
          extraPatch: buyPointsEmail ? { buyPointsEmail } : {},
        });
      }
      default: {
        const customerEmail = getCustomerEmailFromTokenScope(tokenScope);
        if (!customerEmail) {
          return '';
        }

        const session = await authenticateCustomer(customerEmail, { forceRefresh: true });
        return session?.loginResponse?.token || session?.token || '';
      }
    }
  })();

  tokenRefreshRequests.set(tokenScope, refreshPromise);

  try {
    return await refreshPromise;
  } finally {
    tokenRefreshRequests.delete(tokenScope);
  }
};

const executeWithTokenRetry = async ({ tokenScope = '', authToken = '', callerName = 'unknown', request }) => {
  const runRequest = async (currentToken, hasRetried = false) => {
    try {
      return await request(currentToken);
    } catch (error) {
      if (hasRetried || !tokenScope || !shouldRefreshTokenFromError(error)) {
        throw error;
      }

      console.log('[swapApi] retrying request with refreshed token', {
        callerName,
        tokenScope,
        reason: error?.message || 'auth failed',
      });

      const refreshedToken = await refreshAuthTokenForScope(tokenScope, { force: true });
      if (!refreshedToken) {
        throw error;
      }

      return runRequest(refreshedToken, true);
    }
  };

  return runRequest(authToken, false);
};

export const resolveGuestAuthToken = async ({ force = false } = {}) => {
  return refreshAuthTokenForScope(TOKEN_SCOPE.GUEST, { force });
};

const resolveOperatorAuthToken = async ({ force = false } = {}) => {
  return refreshAuthTokenForScope(TOKEN_SCOPE.OPERATOR, { force });
};

const getCustomerItemsListData = (response) => {
  if (response?.success?.data && typeof response.success.data === 'object') {
    return response.success.data;
  }

  if (response?.error?.data && typeof response.error.data === 'object') {
    return response.error.data;
  }

  return {};
};

const toCurrencyLabel = (value) => `$${Number(value || 0).toFixed(2)}`;

const formatBoothProduct = (product) => ({
  ...product,
  brand: product.brand?.name || product.brand || 'NA',
  size: product.size_on_label || product.size || 'NA',
  price: toCurrencyLabel(product.listing_price),
  code:
    product.code ||
    `MB-${product.seller_booth?.id || '0'}-${product.seller?.id || '0'}-${product.id || product.dev_booth_product_id || '0'}-${product.brand?.id || '0'}`,
});

const formatBoothCheckout = (checkout) => ({
  ...checkout,
  items: (checkout.items || []).map((item) => ({
    ...item,
    booth_product: item.booth_product ? formatBoothProduct(item.booth_product) : null,
  })),
});

const getBoothProductStatus = (product) => {
  if (product.rejected) {
    return 'rejected';
  }

  if (product.sold) {
    return 'sold';
  }

  if (product.returned_to_seller) {
    return 'returned';
  }

  return product.manual_review_passed ? 'approved' : 'pending';
};

const matchesWhereClause = (record, where = {}) => {
  if (!where || Object.keys(where).length === 0) {
    return true;
  }

  return Object.entries(where).every(([key, value]) => {
    if (key === '_and') {
      return Array.isArray(value) ? value.every((clause) => matchesWhereClause(record, clause)) : true;
    }

    if (key === '_or') {
      return Array.isArray(value) ? value.some((clause) => matchesWhereClause(record, clause)) : true;
    }

    if (key.endsWith('_contains')) {
      const field = key.replace(/_contains$/, '');
      const target = field.split('.').reduce((acc, part) => acc?.[part], record);
      return String(target || '')
        .toLowerCase()
        .includes(String(value || '').toLowerCase());
    }

    if (key.endsWith('_gte')) {
      const field = key.replace(/_gte$/, '');
      return new Date(record?.[field] || 0).getTime() >= new Date(value).getTime();
    }

    if (key.endsWith('_lte')) {
      const field = key.replace(/_lte$/, '');
      return new Date(record?.[field] || 0).getTime() <= new Date(value).getTime();
    }

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const target = record?.[key];
      if (target == null) {
        return false;
      }
      return matchesWhereClause(target, value);
    }

    if (key === 'seller_booth') {
      return String(record?.seller_booth?.id || record?.seller_booth || '') === String(value);
    }

    return record?.[key] === value;
  });
};

const getBoothCycle = (booth) => {
  const now = new Date('2026-03-26T00:00:00.000Z');
  const start = new Date(booth.booth_start_date);
  const end = new Date(booth.booth_end_date);
  const diffDays = Math.round((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (end < now) {
    return 'done';
  }

  if (start <= now && end >= now) {
    return 'current';
  }

  if (diffDays <= 45) {
    return 'next';
  }

  return 'upcoming';
};

const getSellerName = (booth) => [booth.user?.first_name, booth.user?.last_name].filter(Boolean).join(' ') || booth.user?.username || 'Unknown seller';

const getBoothSummary = (booth) => {
  const products = boothProductsStore.filter((product) => String(product.seller_booth?.id) === String(booth.id));

  return {
    ...booth,
    cycle: getBoothCycle(booth),
    seller: getSellerName(booth),
    items: products.length,
    status: booth.is_inactive ? 'inactive' : booth.is_verified ? 'approved' : 'pending',
  };
};

const buildLiveBoothDateFilter = (cycle) => {
  const now = new Date();
  const today = now.toISOString();
  const nextWindow = new Date(now);
  nextWindow.setDate(nextWindow.getDate() + 45);
  const nextWindowIso = nextWindow.toISOString();

  switch (cycle) {
    case 'current':
      return {
        _and: [{ booth_start_date_lte: today }, { booth_end_date_gte: today }],
      };
    case 'next':
      return {
        _and: [{ booth_start_date_gt: today }, { booth_start_date_lte: nextWindowIso }],
      };
    case 'upcoming':
      return { booth_start_date_gt: nextWindowIso };
    case 'done':
      return { booth_end_date_lt: today };
    default:
      return null;
  }
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number.parseInt(String(value ?? fallback), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const getCustomerName = (customer = {}) => {
  if (customer.name) {
    return customer.name;
  }

  return [customer.first_name_c, customer.last_name_c].filter(Boolean).join(' ') || 'Customer';
};

const formatPlanLabel = (plan) => {
  if (!plan) {
    return '';
  }

  const name = plan.name || '';
  const count = toNumber(plan.number_of_items_c, 0);

  if (!count) {
    return name;
  }

  return `${name} - ${count} pickup${count === 1 ? '' : 's'} / month`;
};

const formatDateOnly = (value) => {
  if (!value) {
    return 'NA';
  }

  const normalizedValue = String(value);
  const isoDateMatch = normalizedValue.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoDateMatch) {
    return isoDateMatch[1];
  }

  const parsedDate = new Date(normalizedValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return normalizedValue;
  }

  return parsedDate.toISOString().slice(0, 10);
};

const formatActiveCustomerPackage = (customer = {}) => {
  const shopSubscribe = customer?.shop_subscribe;
  const shopSubscriptionName = shopSubscribe?.subscription?.name || shopSubscribe?.name || '';
  const shopSubscriptionItems = toNumber(shopSubscribe?.number_of_items_c, 0);

  if (shopSubscribe) {
    return shopSubscriptionName ? `${shopSubscriptionName} ${shopSubscriptionItems} items` : `${shopSubscriptionItems} items`;
  }

  return (
    customer?.subscribe?.subscription?.name ||
    customer?.event_subscribe?.subscription?.name ||
    ''
  );
};

const mapApiCustomerToProfile = (customer, email = '', wallets = {}) => ({
  id: customer?.id || '',
  name: getCustomerName(customer),
  email: customer?.email_c || email,
  points: `${wallets?.shop ?? customer?.total_available_points_c ?? '0'} pts`,
  activePackage: formatActiveCustomerPackage(customer),
  pointsExpiryDate: formatDateOnly(
    customer?.shop_subscribe?.expiry_date_c ||
      customer?.subscribe?.expiry_date_c ||
      customer?.event_subscribe?.expiry_date_c ||
      'NA'
  ),
  itemsSwappedIn: toNumber(customer?.total_items_surrendered_c),
  itemsSwappedOut: toNumber(customer?.total_items_swapped_c),
  ordersMade: 0,
  customerSubscribe: {
    subscribe: customer?.subscribe || null,
    shop_subscribe: customer?.shop_subscribe || null,
    event_subscribe: customer?.event_subscribe || null,
  },
  subscriptions: EMPTY_ARRAY,
  pickups: EMPTY_ARRAY,
  orders: EMPTY_ARRAY,
  swappedInItems: EMPTY_ARRAY,
  checkoutCart: EMPTY_ARRAY,
});

const mapWalletResponseToWallets = (response) => response?.wallets || {};

/**
 * @param {import('../types/swapTypes').SwapCustomerSubscribe} subscription
 * @returns {import('../types/swapTypes').SwapSubscription}
 */
const mapApiSubscribeToSubscription = (subscription) => ({
  id: subscription.id,
  uniqueId: subscription.unique_id_c || subscription.id || '',
  plan: subscription.subscription?.name || subscription.name || 'Subscription',
  status: subscription.status_c || 'Unknown',
  startDate: subscription.date_entered || 'NA',
  renewalDate: subscription.expiry_date_c || 'NA',
  subscriptionType: subscription.subscription?.type_c || subscription.type_c || '',
  subscriptionSubType: subscription.subscription?.sub_type_c || subscription.sub_type_c || '',
  description: subscription.subscription?.description || subscription.description || '',
  numberOfPoints: toNumber(subscription.number_of_points_c),
  numberOfItems: toNumber(subscription.number_of_items_c),
  acceptedItems: toNumber(subscription.number_of_accepted_items_c),
  rejectedItems: toNumber(subscription.number_of_rejected_items_c),
  itemsSwapped: toNumber(subscription.items_swapped_c),
  deliveriesDone: toNumber(subscription.deliveries_done_c),
  itemsRemaining: toNumber(subscription.remaining_items_c, toNumber(subscription.number_of_items_c)),
  items: EMPTY_ARRAY,
});

const mapApiSubscriptionItem = (item) => ({
  id: item?.id || item?.item_id_c || '',
  image: item?.thumbnail_c || item?.image || 'https://via.placeholder.com/64x64.png?text=Item',
  brand: item?.brand_c || item?.brand || 'NA',
  category: item?.category_c || item?.category || 'NA',
  subcategory: item?.subcategory_c || item?.subcategory || 'NA',
  size: item?.size_c || item?.size || 'NA',
});

const mapCustomerItemToCheckoutCartItem = (item) => ({
  id: item?.id || item?.unique_item_id_c || item?.unique_id_c || '',
  sku: item?.unique_item_id_c || item?.unique_id_c || item?.sku || '',
  unique_item_id_c: item?.unique_item_id_c || item?.unique_id_c || item?.sku || '',
  name: item?.name || 'Unnamed Product',
  size: item?.size?.name || item?.size_c || item?.size || 'NA',
  brand: item?.brand?.name || item?.brand_c || item?.brand || 'NA',
  points: String(item?.points || (item?.evaluated_points_c ? `${item.evaluated_points_c} pts` : '0')),
  evaluated_points_c: String(item?.evaluated_points_c || toPointsValue(item?.points)),
  thumbnail_c: item?.thumbnail_c || item?.thumbnail || item?.image || item?.images?.[0]?.name || '',
});

const toNamedEntity = (value, fallback = 'NA') => {
  if (value && typeof value === 'object') {
    return {
      id: value.id || '',
      name: value.name || fallback,
      ...value,
    };
  }

  const text = typeof value === 'string' && value.trim() ? value : fallback;
  return {
    id: '',
    name: text,
  };
};

const mapApiPickupCustomerItemToProduct = (item, pickup, customer) => ({
  ...item,
  images: Array.isArray(item?.images) ? item.images : EMPTY_ARRAY,
  defect_area: item?.defect_area || null,
  cart: item?.cart || null,
  condition: item?.condition || null,
  brand: toNamedEntity(item?.brand || item?.brand_c),
  size: toNamedEntity(item?.size || item?.size_c),
  style: toNamedEntity(item?.style || item?.style_c),
  color: toNamedEntity(item?.color || item?.color_c),
  user_segment: toNamedEntity(item?.user_segment || item?.user_segment_c),
  category: toNamedEntity(item?.category || item?.category_c),
  customer: customer || { id: '', name: 'Customer' },
  pick_up: {
    id: pickup?.id || '',
    name: pickup?.name || pickup?.unique_id_c || pickup?.id || 'Pickup',
  },
});

const mapApiPickupToPickup = (pickup) => ({
  ...pickup,
  id: pickup?.id || pickup?.pickup_id_c || '',
  subscriptionId: pickup?.subscribe_id_c || pickup?.subscription_id_c || '',
  date: pickup?.trip_date_c || pickup?.date_entered || pickup?.pickup_date_c || 'NA',
  address: pickup?.address || pickup?.pickup_address_c || pickup?.address_c || 'NA',
  totalItems: toNumber(pickup?.number_of_items_c),
  remainingItems: toNumber(pickup?.remaining_items_c, toNumber(pickup?.number_of_items_c)),
  items: pickup?.items || EMPTY_ARRAY,
});

const mapApiPickupDetailToPickup = (pickup) => {
  const customer = Array.isArray(pickup?.customer) ? pickup.customer[0] || null : pickup?.customer || null;
  const subscribeList = Array.isArray(pickup?.subscribe)
    ? pickup.subscribe
    : pickup?.subscribe
      ? [pickup.subscribe]
      : EMPTY_ARRAY;
  const subscribe = subscribeList[0] || null;
  const items = (pickup?.customer_items || EMPTY_ARRAY).map((item) => mapApiPickupCustomerItemToProduct(item, pickup, customer));
  const totalItems = toNumber(subscribe?.number_of_items_c, toNumber(pickup?.number_of_items_c));
  const addressParts = [
    pickup?.street_address_c,
    pickup?.apt_no_c,
    pickup?.building_name_c,
    pickup?.street_no_c,
    pickup?.street_name_c,
    pickup?.city_c,
    pickup?.state_c,
    pickup?.postal_code_c,
    pickup?.country_c,
  ]
    .filter((part) => typeof part === 'string' && part.trim())
    .join(', ');

  return {
    ...pickup,
    customer: customer ? [customer] : EMPTY_ARRAY,
    subscribe: subscribeList,
    customer_items: items,
    subscriptionId: subscribeList[0]?.id || pickup?.subscribe_id_c || pickup?.subscription_id_c || '',
    date: pickup?.trip_date_c || pickup?.date_entered || 'NA',
    address: addressParts || pickup?.street_address_c || 'NA',
    totalItems,
    remainingItems: getRemainingItemsCount(totalItems, items),
    items,
  };
};

const mapMockCustomerToDetailResponse = (customer) => ({
  status: true,
  success: {
    code: 'CUS-001',
    message: 'Customer fetched',
    data: {
      customer: {
        ...customerSuccessData.customer,
        id: customer.id,
        name: customer.name,
        email_c: customer.email,
        total_items_surrendered_c: String(customer.itemsSwappedIn || 0),
        total_items_swapped_c: String(customer.itemsSwappedOut || 0),
        total_available_points_c: customer.points?.split(' ')[0] || '0',
        subscribes_list: (customer.subscriptions || []).map((subscription) => ({
          id: subscription.id,
          name: subscription.plan,
          subscribe_type_c: 'shop',
          status_c: subscription.status.toLowerCase(),
          number_of_items_c: String(subscription.items?.length || 0),
          number_of_accepted_items_c: String(subscription.items?.length || 0),
          number_of_rejected_items_c: '0',
          items_swapped_c: '0',
          subscription: {
            id: subscription.id,
            name: subscription.plan,
            validity_c: '1',
            number_of_items_c: String(subscription.items?.length || 0),
            price_c: '0',
            type_c: 'items',
            status_c: 'active',
          },
        })),
        wallets: {
          store: 0,
          event: 0,
          marketplace: 0,
          shop: toNumber(customer.itemsSwappedIn),
        },
      },
      total_count: 1,
      result_count: 1,
      next_offset: -1,
      total_pages: 1,
      current_page: 1,
      query: '',
      state_hash: null,
    },
  },
  error: null,
  status_code: 200,
});

/**
 * Maps local customer profile data to the login response payload shape.
 * @param {ReturnType<typeof getMockCustomerProfile>} customer
 * @returns {import('../types/swapTypes').SwapLoginResponse}
 */
const toLoginPayload = (customer) => ({
  token: customerSuccessData.token,
  customer: {
    ...customerSuccessData.customer,
    id: customer.id,
    name: customer.name,
    first_name_c: customer.name.split(' ')[0] || customerSuccessData.customer.first_name_c,
    last_name_c: customer.name.split(' ').slice(1).join(' ') || customerSuccessData.customer.last_name_c,
    email_c: customer.email,
    total_items_surrendered_c: String(customer.itemsSwappedIn || 0),
    total_items_swapped_c: String(customer.itemsSwappedOut || 0),
    total_available_points_c: customer.points.split(' ')[0] || '0',
  },
  state_hash: null,
});

/**
 * Ensures live API base URL exists before making network requests.
 * @throws {Error}
 */
const assertApiUrl = () => {
  if (!SWAP_API_URL) {
    throw new Error('EXPO_PUBLIC_SWAP_API_URL is required in .env when EXPO_PUBLIC_SWAP_USE_MOCK is false.');
  }

  if (!SWAP_API_VERSION) {
    throw new Error('EXPO_PUBLIC_SWAP_API_VERSION is required in .env when EXPO_PUBLIC_SWAP_USE_MOCK is false.');
  }
};

/**
 * Builds full API URL from endpoint path and versioning mode.
 * @param {string} path
 * @param {boolean} [withVersion=true]
 * @returns {string}
 */
const buildUrl = (path, withVersion = true) => {
  assertApiUrl();
  const normalizedPath = path.replace(/^\//, '');
  return withVersion ? `${SWAP_API_URL}/${SWAP_API_VERSION}/${normalizedPath}` : `${SWAP_API_URL}/${normalizedPath}`;
};

const buildWalletUrl = (path) => `${SWAP_WALLET_API_URL}/${path.replace(/^\//, '')}`;

const withSwapAuthHeader = async (headers = {}, authToken = '', { forceAuthToken = false } = {}) => {
  if (forceAuthToken && authToken) {
    return {
      ...headers,
      Authorization: `Bearer ${authToken}`,
    };
  }

  if (headers.Authorization || headers.token) {
    return headers;
  }

  const token = authToken || getCachedStoredAppSession()?.operatorToken || (await getStoredOperatorToken());
  return token ? { ...headers, Authorization: `Bearer ${token}` } : headers;
};

const logApiRequest = ({ callerName = 'unknown', method, url, payload, headers }) => {
  console.log('[swapApi] request', {
    functionName: callerName,
    method,
    url,
    payload,
    hasAuth: Boolean(headers?.Authorization || headers?.token),
  });
};

const summarizeFormDataPayload = (formData) => {
  if (!formData || typeof formData.entries !== 'function') {
    return '[form-data]';
  }

  const fields = {};

  for (const [key, value] of formData.entries()) {
    const isFileLike =
      value &&
      typeof value === 'object' &&
      (typeof value.uri === 'string' || typeof value.name === 'string' || typeof value.type === 'string');

    fields[key] = isFileLike ? '[file]' : value;
  }

  return {
    type: 'form-data',
    fields,
  };
};

const logApiResponse = ({ callerName = 'unknown', method, url, response, error }) => {
  if (error) {
    console.error('[swapApi] response', {
      functionName: callerName,
      method,
      url,
      error: error instanceof Error ? error.message : String(error),
    });
    return;
  }

  console.log('[swapApi] response', {
    functionName: callerName,
    method,
    url,
    status: response?.status,
    status_code: response?.status_code,
  });
};

/**
 * Sends a POST request with JSON payload.
 * @param {string} path
 * @param {Record<string, unknown>} body
 * @param {boolean} [withVersion=true]
 * @returns {Promise<Record<string, unknown>>}
 */
const postJson = async (path, body, withVersion = true, extraHeaders = {}, authToken = '', callerName = 'unknown', tokenScope = '') => {
  const url = buildUrl(path, withVersion);

  return executeWithTokenRetry({
    tokenScope,
    authToken,
    callerName,
    request: async (resolvedToken) => {
      const headers = await withSwapAuthHeader(
        {
          'Content-Type': 'application/json',
          ...extraHeaders,
        },
        resolvedToken,
        { forceAuthToken: Boolean(tokenScope || authToken) }
      );

      logApiRequest({
        callerName,
        method: 'POST',
        url,
        payload: body,
        headers,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const error = createAuthRequestError(`Swap API request failed (${response.status}): ${errorText}`, {
          invalidToken: Boolean(tokenScope) && (response.status === 401 || response.status === 403 || isAuthErrorMessage(errorText)),
          status: response.status,
        });
        logApiResponse({ callerName, method: 'POST', url, error });
        throw error;
      }

      const data = await response.json();
      if (tokenScope && response.ok && data?.status === false) {
        const errorMessage = data?.error?.message || data?.success?.message || 'Authenticated request failed.';
        if (isAuthErrorMessage(errorMessage)) {
          const error = createAuthRequestError(errorMessage, {
            invalidToken: true,
            status: response.status,
          });
          logApiResponse({ callerName, method: 'POST', url, error });
          throw error;
        }
      }

      logApiResponse({ callerName, method: 'POST', url, response: data });
      return data;
    },
  });
};

const getJson = async (url, headers = {}, authToken = '', callerName = 'unknown', tokenScope = '') => {
  return executeWithTokenRetry({
    tokenScope,
    authToken,
    callerName,
    request: async (resolvedToken) => {
      const requestHeaders = await withSwapAuthHeader(headers, resolvedToken, {
        forceAuthToken: Boolean(tokenScope || authToken),
      });
      logApiRequest({
        callerName,
        method: 'GET',
        url,
        payload: null,
        headers: requestHeaders,
      });
      const response = await fetch(url, {
        method: 'GET',
        headers: requestHeaders,
      });

      if (!response.ok) {
        const errorText = await response.text();
        const error = createAuthRequestError(`Swap API request failed (${response.status}): ${errorText}`, {
          invalidToken: Boolean(tokenScope) && (response.status === 401 || response.status === 403 || isAuthErrorMessage(errorText)),
          status: response.status,
        });
        logApiResponse({ callerName, method: 'GET', url, error });
        throw error;
      }

      const data = await response.json();
      logApiResponse({ callerName, method: 'GET', url, response: data });
      return data;
    },
  });
};

/**
 * @template T
 * @param {string} code
 * @param {string} message
 * @param {T} data
 * @returns {import('../types/swapTypes').SwapApiEnvelope<T>}
 */
const createSwapSuccessResponse = (code, message, data) => ({
  status: true,
  success: {
    code,
    message,
    data,
  },
  error: null,
  status_code: 200,
});

/**
 * @param {string} code
 * @param {string} message
 * @param {Record<string, unknown> | null} [data]
 * @returns {import('../types/swapTypes').SwapApiEnvelope<null>}
 */
const createSwapErrorResponse = (code, message, data = { state_hash: null }) => ({
  status: false,
  success: null,
  error: {
    code,
    message,
    data,
  },
  status_code: 200,
});

/**
 * @template T
 * @param {import('../types/swapTypes').SwapApiEnvelope<T> | Record<string, unknown>} response
 * @returns {T}
 */
const assertSwapSuccess = (response) => {
  const normalizedStatus = String(response?.status ?? '').trim().toLowerCase();
  const isFailureStatus = response?.status === false || normalizedStatus === 'failure' || normalizedStatus === 'error';
  const isSuccessStatus =
    response?.status === true ||
    normalizedStatus === 'success' ||
    normalizedStatus === '' ||
    Boolean(response?.success);

  if (isFailureStatus || !isSuccessStatus) {
    const error = getResponseError(response);
    throw new Error(error?.message || response?.message || response?.success?.message || 'Something went wrong');
  }

  return getResponseData(response);
};

/**
 * Sends a POST request with multipart/form-data payload.
 * @param {string} path
 * @param {FormData} formData
 * @param {boolean} [withVersion=true]
 * @returns {Promise<Record<string, unknown>>}
 */
const postFormData = async (path, formData, withVersion = true, authToken = '', callerName = 'unknown', tokenScope = '') => {
  const url = buildUrl(path, withVersion);

  return executeWithTokenRetry({
    tokenScope,
    authToken,
    callerName,
    request: async (resolvedToken) => {
      const headers = await withSwapAuthHeader({}, resolvedToken, {
        forceAuthToken: Boolean(tokenScope || authToken),
      });
      logApiRequest({
        callerName,
        method: 'POST',
        url,
        payload: summarizeFormDataPayload(formData),
        headers,
      });
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        const error = createAuthRequestError(`Swap API request failed (${response.status}): ${errorText}`, {
          invalidToken: Boolean(tokenScope) && (response.status === 401 || response.status === 403 || isAuthErrorMessage(errorText)),
          status: response.status,
        });
        logApiResponse({ callerName, method: 'POST', url, error });
        throw error;
      }

      const data = await response.json();
      logApiResponse({ callerName, method: 'POST', url, response: data });
      return data;
    },
  });
};

/**
 * Creates mock response for subscriptions list endpoint.
 * @param {import('../types/swapTypes').SwapSubscriptionTenancy} tenancy
 * @returns {import('../types/swapTypes').SwapApiEnvelope<Record<string, unknown>>}
 */
const toMockSubscriptionListResponse = (tenancy) => ({
  status: true,
  success: {
    code: 'SUB-001',
    message: 'Subscriptions fetched',
    data: {
      offset: swapSubscriptionCatalog.length,
      subscriptions: swapSubscriptionCatalog.map((subscription) => ({
        ...subscription,
        sub_type_c:
          tenancy === 'SWAP.SUB.TYPE.POINTS.SHOP'
            ? 'add_on_points'
            : tenancy === 'SWAP.SUB.TYPE.CONVERSIONS.SHOP'
              ? 'conversions'
              : 'add_on_items',
        origin_c: tenancy?.includes('STORE') ? 'store' : 'shop',
      })),
    },
  },
  error: null,
  status_code: 200,
});

/**
 * Creates mock response for customer details endpoint.
 * @param {string} [customerId=customerSuccessData.customer.id]
 * @returns {import('../types/swapTypes').SwapApiEnvelope<Record<string, unknown>>}
 */
const toMockCustomerDetailResponse = (email = '') => mapMockCustomerToDetailResponse(getMockCustomerProfile(email));

/**
 * Login as customer using email.
 * Endpoint: POST /{api_ver}/yHncKdVLF2/customers/mime/login/email/3BCB2
 * Request: { email_c: string }
 * Returns a token and customer profile. In mock mode this maps to local customer data.
 * @param {string} email
 * @returns {Promise<import('../types/swapTypes').SwapLoginResponse | Record<string, unknown>>}
 */
export const loginAsCustomer = async (email) => {
  if (SWAP_USE_MOCK) {
    await delay();
    const customer = getMockCustomerProfile(email);
    console.log('[swapApi] loginAsCustomer mock request', {
      useMock: true,
      email,
    });
    return toLoginPayload(customer);
  }

  const path = 'yHncKdVLF2/customers/mime/login/email/3BCB2';
  const payload = { email_c: email };
  const url = buildUrl(path);

  console.log('[swapApi] loginAsCustomer request', {
    useMock: false,
    method: 'POST',
    url,
    payload,
  });

  try {
    const response = await postJson(path, payload, true, {}, '', 'loginAsCustomer');
    const data = response?.success?.data || {};
    const normalizedResponse = {
      token: data?.token || response?.token || '',
      customer: data?.customer || response?.customer || null,
      state_hash: data?.state_hash ?? response?.state_hash ?? null,
      response,
    };

    console.log('[swapApi] loginAsCustomer response', response);
    console.log('[swapApi] loginAsCustomer normalizedResponse', normalizedResponse);
    return normalizedResponse;
  } catch (error) {
    console.error('[swapApi] loginAsCustomer error', {
      method: 'POST',
      url,
      payload,
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

export const loginAppUser = async (email, password, authToken = '') => {
  if (SWAP_USE_MOCK) {
    await delay();
    const customer = getMockCustomerProfile(email);
    return {
      token: customerSuccessData.token,
      user: {
        ...customerSuccessData.customer,
        ...customer,
        email_c: customer.email,
      },
      customer: {
        ...customerSuccessData.customer,
        ...customer,
        email_c: customer.email,
      },
      response: {
        status: true,
        success: {
          code: 'CUS-002',
          message: 'Customer logged in',
          data: {
            token: customerSuccessData.token,
            customer: {
              ...customerSuccessData.customer,
              ...customer,
              email_c: customer.email,
            },
          },
        },
      },
    };
  }

  const response = await postJson(
    APP_LOGIN_PATH,
    {
      email_c: email,
      password_c: password,
      tenancy: APP_LOGIN_TENANCY,
    },
    true,
    {},
    authToken,
    'loginAppUser',
    authToken ? TOKEN_SCOPE.GUEST : ''
  );

  const session = extractAuthSession(response);
  if (!session.token) {
    throw new Error('Login failed: no token received.');
  }

  return session;
};

export const loginAsShopUser = async (guestToken = '') => {
  if (!DEFAULT_OPS_LOGIN_USERNAME || !DEFAULT_OPS_LOGIN_PASSWORD) {
    throw new Error('DEFAULTOPS_LOGIN_USERNAME/DEFAULTOPS_LOGIN_PASSWORD credentials are not configured.');
  }

  const resolvedGuestToken = guestToken || getCachedStoredAppSession()?.guestToken || (await getStoredGuestToken());

  if (SWAP_USE_MOCK) {
    await delay();
    return {
      token: customerSuccessData.token,
      user: {
        id: 'mock-operator',
        name: 'Operator',
        user_type: 'operator',
      },
      response: {
        status: true,
        success: {
          code: 'USR-001',
          message: 'User logged in',
          data: {
            user_id: 'mock-operator',
            user_type: 'operator',
            name: 'Operator',
            token: customerSuccessData.token,
            state_hash: null,
          },
        },
        error: null,
        status_code: 200,
      },
    };
  }

  console.log('[swapApi] loginAsShopUser request', {
    username: DEFAULT_OPS_LOGIN_USERNAME,
    hasGuestToken: Boolean(resolvedGuestToken),
    useMock: false,
  });
  const response = await postJson(
    'users/login',
    {
      username: DEFAULT_OPS_LOGIN_USERNAME,
      password: DEFAULT_OPS_LOGIN_PASSWORD,
    },
    true,
    {},
    resolvedGuestToken,
    'loginAsShopUser',
    TOKEN_SCOPE.GUEST
  );

  const data = response?.success?.data || {};
  const token = data?.token || '';
  console.log('[swapApi] loginAsShopUser response', {
    status: response?.status,
    status_code: response?.status_code,
    token,
    user_id: data?.user_id || '',
    user_type: data?.user_type || '',
  });

  if (!token) {
    throw new Error('Failed to get operator token.');
  }

  return {
    token,
    user: {
      id: data?.user_id || '',
      user_type: data?.user_type || '',
      name: data?.name || '',
    },
    response,
  };
};

export const registerGuestSession = async () => {
  if (SWAP_USE_MOCK) {
    await delay();
    const sessionId = `guest-${Date.now()}`;
    return {
      token: customerSuccessData.token,
      guestToken: customerSuccessData.token,
      sessionId,
      clientIp: '127.0.0.1',
      exp: null,
      stateHash: null,
      user: null,
      customer: null,
      response: {
        status: true,
        success: {
          code: 'GST-001',
          message: 'Guest session created',
          data: {
            guest_token: customerSuccessData.token,
            session_id: sessionId,
            client_ip: '127.0.0.1',
            exp: null,
            state_hash: null,
          },
        },
      },
    };
  }

  const response = await postJson(APP_GUEST_REGISTER_PATH, {}, true, {}, '', 'registerGuestSession');
  const session = extractGuestSession(response);

  if (!session.token) {
    throw new Error('Failed to create guest session.');
  }

  return session;
};

export const checkCustomerSession = async (token) => {
  if (!token) {
    throw new Error('Missing auth token.');
  }

  if (SWAP_USE_MOCK) {
    await delay();
    return {
      token,
      user: customerSuccessData.customer,
      customer: customerSuccessData.customer,
      response: {
        status: true,
        success: {
          code: 'CUS-002',
          message: 'Customer logged in',
          data: {
            customer: customerSuccessData.customer,
          },
        },
      },
    };
  }

  const response = await postJson(
    'customers/check-session',
    {},
    true,
    {
      Authorization: `Bearer ${token}`,
    },
    '',
    'checkCustomerSession'
  );

  if (!response?.status) {
    const message = response?.error?.message || response?.success?.message || 'Session expired.';
    throw new Error(message);
  }

  return extractAuthSession(response, token);
};

export const checkShopUserSession = async (token) => {
  if (!token) {
    throw new Error('Missing operator auth token.');
  }

  if (SWAP_USE_MOCK) {
    await delay();
    return {
      token,
      user: {
        id: 'mock-operator',
        user_type: 'operator',
        name: 'Operator',
      },
      response: {
        status: true,
        success: {
          code: 'USR-002',
          message: 'Operator session valid',
          data: {
            token,
          },
        },
      },
    };
  }

  const response = await postJson(
    'users/check-session',
    {},
    true,
    {
      Authorization: `Bearer ${token}`,
    },
    '',
    'checkShopUserSession'
  );

  if (!response?.status) {
    const message = response?.error?.message || response?.success?.message || 'Operator session expired.';
    throw new Error(message);
  }

  return {
    token,
    user: {
      id: response?.success?.data?.user_id || '',
      user_type: response?.success?.data?.user_type || 'operator',
      name: response?.success?.data?.name || '',
    },
    response,
  };
};

export const getWalletBalances = async (token, email = '') => {
  if (SWAP_USE_MOCK) {
    await delay();
    const customer = getMockCustomerProfile(email || customerSuccessData.customer.email_c);
    return {
      status: true,
      wallets: {
        store: 0,
        event: 0,
        marketplace: 0,
        shop: toNumber(customer.points?.split(' ')[0]),
      },
      customer: {
        name: customer.name,
        first_name: customer.name.split(' ')[0] || '',
        last_name: customer.name.split(' ').slice(1).join(' '),
        id: customer.id,
      },
      status_code: 200,
    };
  }

  return getJson(
    buildWalletUrl('v1/wallet/get/balances'),
    {},
    token,
    'getWalletBalances',
    token ? createCustomerTokenScope(email) : ''
  );
};

const createCustomerSession = async (email) => {
  const normalizedEmail = email.trim().toLowerCase();

  if (customerSessionCache.has(normalizedEmail)) {
    return customerSessionCache.get(normalizedEmail);
  }

  const sessionPromise = (async () => {
    const loginResponse = await loginAsCustomer(normalizedEmail);
    const walletResponse = await getWalletBalances(loginResponse?.token, normalizedEmail);
    const profile = mapApiCustomerToProfile(loginResponse?.customer, normalizedEmail, mapWalletResponseToWallets(walletResponse));

    return {
      email: normalizedEmail,
      loginResponse,
      profile,
      walletResponse,
    };
  })();

  customerSessionCache.set(normalizedEmail, sessionPromise);

  try {
    return await sessionPromise;
  } catch (error) {
    customerSessionCache.delete(normalizedEmail);
    throw error;
  }
};

export const authenticateCustomer = async (email, { forceRefresh = false } = {}) => {
  if (SWAP_USE_MOCK) {
    await delay();
    return {
      email,
      loginResponse: toLoginPayload(getMockCustomerProfile(email)),
      profile: getMockCustomerProfile(email),
      walletResponse: await getWalletBalances('', email),
    };
  }

  if (forceRefresh) {
    customerSessionCache.delete(String(email || '').trim().toLowerCase());
  }

  return createCustomerSession(email);
};

const toPointsValue = (value) => {
  const parsed = Number.parseInt(String(value || '0').replace(/[^\d-]/g, ''), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const getCheckoutEligibleItems = (items = []) => items.filter((item) => item?.id && !String(item.id).startsWith('manual-'));

const getCheckoutSubscribeIdFromProfile = (profile) =>
  profile?.customerSubscribe?.shop_subscribe?.id ||
  profile?.customerSubscribe?.subscribe?.id ||
  profile?.customerSubscribe?.event_subscribe?.id ||
  '';

const extractCheckoutSubscribeId = (response) => {
  const data = getResponseData(response);
  return (
    response?.subscribe_id ||
    response?.subscription_id ||
    response?.id ||
    data?.subscribe_id_c ||
    data?.subscribe_id ||
    data?.subscription_id_c ||
    data?.subscription_id ||
    data?.subscribe?.id ||
    data?.subscription?.id ||
    data?.id ||
    ''
  );
};

const resolveBuyPointsSession = async () => {
  const cachedSession = getCachedStoredAppSession();
  const storedEmail = cachedSession?.buyPointsEmail || (await getStoredBuyPointsEmail());
  const normalizedEmail = String(storedEmail || '').trim().toLowerCase();
  const storedToken = cachedSession?.buyPointsToken || (await getStoredBuyPointsToken());
  const storedCustomerId = cachedSession?.buyPointsCustomerId || (await getStoredBuyPointsCustomerId());

  if (!normalizedEmail) {
    throw new Error('EXPO_PUBLIC_SWAP_BUY_POINTS_EMAIL is not configured.');
  }

  if (storedToken && storedCustomerId) {
    return {
      email: normalizedEmail,
      token: storedToken,
      customerId: storedCustomerId,
    };
  }

  throw new Error('Buy-points token is unavailable. Rehydrate app session to obtain and persist it.');
};

const resolveCustomerAuthToken = async (customerEmail = '', authToken = '') => {
  if (authToken) {
    return authToken;
  }

  const normalizedEmail = String(customerEmail || '').trim().toLowerCase();
  if (!normalizedEmail) {
    return '';
  }

  const cachedSession = getCachedStoredAppSession();
  const storedBuyPointsEmail = String(cachedSession?.buyPointsEmail || (await getStoredBuyPointsEmail()) || '').trim().toLowerCase();
  if (storedBuyPointsEmail && normalizedEmail === storedBuyPointsEmail) {
    const storedBuyPointsToken = cachedSession?.buyPointsToken || (await getStoredBuyPointsToken());
    if (!storedBuyPointsToken) {
      throw new Error('Buy-points token is unavailable. Rehydrate app session to obtain and persist it.');
    }
    return storedBuyPointsToken;
  }

  const session = await createCustomerSession(normalizedEmail);
  let customerToken = session?.loginResponse?.token || session?.token || '';

  if (!customerToken) {
    const refreshedSession = await authenticateCustomer(normalizedEmail, { forceRefresh: true });
    customerToken = refreshedSession?.loginResponse?.token || refreshedSession?.token || '';
  }

  if (!customerToken) {
    throw new Error(`Customer token is unavailable for ${normalizedEmail}.`);
  }

  return customerToken;
};

const resolveSwapSrUserId = async () => {
  const cachedSession = getCachedStoredAppSession();
  const srUserId = cachedSession?.shopCustomerId || (await getStoredShopCustomerId());

  if (!srUserId) {
    throw new Error('Failed to resolve swap sr_user_id.');
  }

  return srUserId;
};

const getCustomerDetailsRecord = (response) => {
  const data = getResponseData(response);
  return data?.customer || response?.customer || null;
};

const getCustomerDetailsSubscribeList = (response) => {
  const data = getResponseData(response);
  const customer = getCustomerDetailsRecord(response);

  if (Array.isArray(data?.subscribes)) {
    return data.subscribes;
  }

  if (Array.isArray(customer?.subscribes_list)) {
    return customer.subscribes_list;
  }

  return EMPTY_ARRAY;
};

const matchesSubscribeId = (subscribe, subscribeId = '') =>
  String(subscribe?.id || subscribe?.unique_id_c || '').trim() === String(subscribeId || '').trim();

const verifyFlexiPlanPurchaseState = ({ response, newSubscribeId = '', previousSubscribeId = '' } = {}) => {
  const customer = getCustomerDetailsRecord(response);
  const subscribeList = getCustomerDetailsSubscribeList(response);
  const activeShopSubscribe = customer?.shop_subscribe || null;
  const activeShopSubscribeId = String(activeShopSubscribe?.id || '').trim();
  const normalizedNewSubscribeId = String(newSubscribeId || '').trim();
  const normalizedPreviousSubscribeId = String(previousSubscribeId || '').trim();
  const newSubscribe = subscribeList.find((subscribe) => matchesSubscribeId(subscribe, normalizedNewSubscribeId)) || null;
  const previousSubscribe = subscribeList.find((subscribe) => matchesSubscribeId(subscribe, normalizedPreviousSubscribeId)) || null;
  const previousCompleted =
    !normalizedPreviousSubscribeId ||
    String(previousSubscribe?.status_c || '').trim().toLowerCase() === 'completed';
  const activeMatchesNew = normalizedNewSubscribeId && activeShopSubscribeId === normalizedNewSubscribeId;
  const verified = Boolean(activeMatchesNew || (previousCompleted && newSubscribe));

  return {
    verified,
    activeMatchesNew,
    previousCompleted,
    activeShopSubscribe,
    newSubscribe,
    previousSubscribe,
    customer,
  };
};

const waitForFlexiPlanVerification = async ({
  customerEmail = '',
  authToken = '',
  newSubscribeId = '',
  previousSubscribeId = '',
  delayMs = 5000,
} = {}) => {
  await delay(delayMs);
  const response = await getCustomerDetailsByToken({ customerEmail, authToken });
  const verification = verifyFlexiPlanPurchaseState({
    response,
    newSubscribeId,
    previousSubscribeId,
  });

  return {
    response,
    ...verification,
  };
};

const buyPointsForCheckout = async ({ requiredPoints, paymentMethod, authToken, tokenScope = '' }) => {
  if (requiredPoints <= 0) {
    throw new Error('Required points must be greater than zero.');
  }

  const subscriptions = await getShopPointsSubscriptions(authToken, tokenScope);
  const subscription = getPointsSubscription(subscriptions);

  if (!subscription?.id) {
    throw new Error('No shop points subscription is available for checkout.');
  }

  const payableSubscription = buildCheckoutPointsSubscriptionPayload(subscription, requiredPoints).subscription;
  const srUserId = await resolveSwapSrUserId();

  const response = await saveShopSubscription({
    paymentMode: paymentMethod,
    srUserId,
    subscription: payableSubscription,
    authToken,
    tokenScope,
  });
  assertSwapSuccess(response);

  const subscribeId = extractCheckoutSubscribeId(response);
  if (!subscribeId) {
    throw new Error('Buy points response did not include a subscribe id.');
  }

  return {
    subscribeId,
    response,
  };
};

/**
 * Get customer orders.
 * @param {string} email
 * @returns {Promise<import('../types/swapTypes').SwapOrder[]>}
 */
export const getCustomerOrders = async (email) => {
  if (SWAP_USE_MOCK) {
    await delay();
    const profileOrders = getMockCustomerProfile(email).orders;
    if (Array.isArray(profileOrders) && profileOrders.length > 0) {
      return [...customerOrdersStore.filter((order) => !profileOrders.some((profileOrder) => profileOrder.id === order.id)), ...profileOrders];
    }
    return customerOrdersStore;
  }

  const session = await createCustomerSession(email);
  const customerTokenScope = createCustomerTokenScope(session?.email || email);
  const customerId = session?.loginResponse?.customer?.id;
  const authToken = session?.loginResponse?.token || '';

  if (!customerId) {
    return EMPTY_ARRAY;
  }

  const response = await postJson(
    SWAP_ORDER_LIST_PATH,
    {
      status_c: ['pending', 'received', 'packed', 'ready_to_shipped', 'shipped', 'delivered', 'cancelled'],
      type_c: 'shop',
      customer_id_c: customerId,
      data_tenancy: 'SWAP.ORDER.DATA_VIEW.DETAIL_PROTECTED',
      sort_tenancy: 'SWAP.ORDER.SORT.DATE_ENTERED',
      sort_type: 'SWAP.ORDER.SORT_TYPE.DESC',
      max_results: 20,
      offset: 0,
      data_mode: '',
    },
    true,
    {},
    authToken,
    'getCustomerOrders',
    customerTokenScope
  );

  const orders = getResponseData(response).orders;
  return Array.isArray(orders) ? orders : EMPTY_ARRAY;
};

/**
 * Get customer order details.
 * @param {string} email
 * @param {string} orderId
 * @returns {Promise<import('../types/swapTypes').SwapOrder | null>}
 */
export const getCustomerOrderDetails = async (email, orderId) => {
  if (SWAP_USE_MOCK) {
    await delay();
    const mockOrder = customerOrdersStore.find((order) => String(order?.id) === String(orderId) || String(order?.unique_id_c) === String(orderId));
    return mockOrder || null;
  }

  const session = await createCustomerSession(email);
  const customerTokenScope = createCustomerTokenScope(session?.email || email);
  const authToken = session?.loginResponse?.token || '';

  if (!authToken) {
    return null;
  }

  const response = await postJson(
    SWAP_ORDER_DETAIL_PATH,
    {
      id: orderId,
      data_tenancy: 'SWAP.ORDER.DATA_VIEW.DETAIL_PROTECTED',
      detail_tenancy: 'SWAP.ORDER.DETAIL_VIEW.ID',
    },
    true,
    {},
    authToken,
    'getCustomerOrderDetails',
    customerTokenScope
  );

  const order = getResponseData(response).order;
  if (!order || typeof order !== 'object') {
    return null;
  }

  return {
    ...order,
    customer: Array.isArray(order.customer) ? order.customer[0] || null : order.customer,
    order_line_items: Array.isArray(order.order_line_items) ? order.order_line_items : EMPTY_ARRAY,
  };
};

/**
 * Create a swap order.
 * Endpoint: POST /{api_ver}/orders/init
 * @param {import('../types/swapTypes').SwapOrderCreateRequest} orderData
 * @returns {Promise<import('../types/swapTypes').SwapApiEnvelope<import('../types/swapTypes').SwapOrderCreateResponseData>>}
 */
export const createSwapOrder = async (orderData, authToken = '', tokenScope = '') => {
  if (SWAP_USE_MOCK) {
    await delay();

    if (!orderData?.subscribe_id_c) {
      return createSwapErrorResponse('ORD-009', 'Missing subscribe id');
    }

    if (!Array.isArray(orderData?.items) || orderData.items.length === 0) {
      return createSwapErrorResponse('ORD-009', 'Add at least one order item');
    }

    const lineItems = orderData.items
      .map((entry) => mockSwapProducts.find((product) => String(product.id) === String(entry.id)))
      .filter(Boolean);

    if (lineItems.length !== orderData.items.length) {
      return createSwapErrorResponse('ORD-009', 'One or more order items could not be found');
    }

    const totalPoints = orderData.items.reduce((sum, item) => {
      const value = Number.parseInt(String(item?.evaluated_points_c || '0').replace(/[^\d-]/g, ''), 10);
      return sum + (Number.isNaN(value) ? 0 : value);
    }, 0);

    const itemCount = orderData.items.length;
    const primaryCustomer = lineItems[0]?.customer || customerSuccessData.customer;
    const createdOrder = {
      id: `swap-order-${Date.now()}`,
      name: `Order-${primaryCustomer?.name || 'Customer'}`,
      unique_id_c: `ORDER-${Math.floor(Date.now() / 1000)}-${customerOrdersStore.length + 1}`,
      type_c: 'shop',
      order_cost_c: totalPoints.toFixed(6),
      total_items_c: String(itemCount),
      order_date_c: new Date().toISOString().slice(0, 10),
      status_c: 'received',
      sub_status_c: '',
      tracking_id_c: '',
      escalate_reason_c: '',
      customer: {
        ...customerSuccessData.customer,
        ...primaryCustomer,
      },
      order_line_items: lineItems.map((product, index) => ({
        ...product,
        evaluated_points_c: orderData.items[index]?.evaluated_points_c || product.evaluated_points_c,
      })),
    };

    const order = {
      id: `ORD-${8128 + customerOrdersStore.length}`,
      status: 'Placed',
      date: new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date()),
      itemCount: `${itemCount} item${itemCount === 1 ? '' : 's'}`,
      total: `${totalPoints} pts`,
      email: createdOrder.customer?.email_c || '',
    };

    customerOrdersStore = [order, ...customerOrdersStore];
    return createSwapSuccessResponse('ORD-201', 'Order created', {
      order: createdOrder,
      state_hash: null,
    });
  }

  return postJson(
    SWAP_ORDER_CREATE_PATH,
    orderData,
    true,
    {},
    authToken,
    'createSwapOrder',
    tokenScope
  );
};

const extractPickupId = (response) =>
  response?.pickup_id ||
  response?.id ||
  getResponseData(response)?.pickup_id ||
  getResponseData(response)?.pickup_id_c ||
  getResponseData(response)?.pickup?.id ||
  '';

const formatPickupTripDate = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).formatToParts(date);
  const month = parts.find((part) => part.type === 'month')?.value || '';
  const day = parts.find((part) => part.type === 'day')?.value || '';
  const year = parts.find((part) => part.type === 'year')?.value || '';
  return [month, day, year].filter(Boolean).join(' ');
};

const assertPickupConfig = () => {
  const requiredKeys = ['apt_no_c', 'building_name_c', 'street_no_c', 'street_name_c', 'country_c', 'city_c', 'postal_code_c'];
  const missingKey = requiredKeys.find((key) => !String(DEFAULT_PICKUP_ADDRESS[key] || '').trim());
  if (missingKey) {
    throw new Error(`Missing pickup address configuration: ${missingKey}`);
  }
  if (!String(DEFAULT_PICKUP_TRIP_TIME || '').trim()) {
    throw new Error('Missing pickup time configuration: EXPO_PUBLIC_SWAP_PICKUP_TRIP_TIME');
  }
};

const assertFlexiPlanPurchasePreflight = ({
  srUserId = '',
  paymentMode = '',
  subscription = null,
} = {}) => {
  if (!srUserId) {
    throw new Error('Missing sr_user_id for subscription purchase.');
  }

  const normalizedPaymentMode = String(paymentMode || '').toLowerCase();
  if (!['cash', 'card', 'paynow'].includes(normalizedPaymentMode)) {
    throw new Error('Invalid payment mode. Expected cash, card, or paynow.');
  }

  if (!subscription?.id) {
    throw new Error('Missing subscription data for flexi plan purchase.');
  }

  if (!String(subscription?.number_of_items_c || '').trim()) {
    throw new Error('Missing number_of_items_c for pickup creation.');
  }

  assertPickupConfig();
};

/**
 * Places a customer order for the swap checkout flow.
 * @param {{ email: string, items: Array<{ id?: string, name?: string, sku?: string, points?: string | number }>, paymentMethod: 'cash' | 'card' | 'paynow', subscribeId?: string }} orderData
 * @returns {Promise<import('../types/swapTypes').SwapCustomerOrder>}
 */
export const placeSwapCheckoutOrder = async ({
  mode = 'customer',
  email = '',
  items = [],
  paymentMethod,
  subscribeId = '',
}) => {
  const eligibleItems = getCheckoutEligibleItems(items);
  const totalPoints = (items || []).reduce((sum, item) => sum + toPointsValue(item?.points), 0);

  if (eligibleItems.length !== items.length || eligibleItems.length === 0) {
    if (!SWAP_USE_MOCK) {
      throw new Error('Checkout requires catalog items with valid ids. Manual-only rows cannot be submitted.');
    }

    await delay();
    const itemCount = items.length;
    const order = {
      id: `ORD-${8128 + customerOrdersStore.length}`,
      status: 'Placed',
      date: new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date()),
      itemCount: `${itemCount} item${itemCount === 1 ? '' : 's'}`,
      total: `${totalPoints} pts`,
      paymentMethod,
      email,
    };

    customerOrdersStore = [order, ...customerOrdersStore];
    return order;
  }

  let resolvedEmail = email;
  let resolvedSubscribeId = subscribeId;
  let authToken = '';
  let tokenScope = '';
  let availablePoints = 0;

  if (mode === 'customer') {
    const session = await authenticateCustomer(email);
    const profile = session?.profile || null;
    resolvedEmail = session?.email || email;
    authToken = session?.loginResponse?.token || '';
    tokenScope = createCustomerTokenScope(resolvedEmail);
    availablePoints = toPointsValue(profile?.points || profile?.total_available_points_c || '0');

    if (!resolvedSubscribeId) {
      resolvedSubscribeId = getCheckoutSubscribeIdFromProfile(profile);
    }

    const requiredTopUpPoints = Math.max(totalPoints - availablePoints, 0);
    if (requiredTopUpPoints > 0) {
      const purchase = await buyPointsForCheckout({
        requiredPoints: requiredTopUpPoints,
        paymentMethod,
        authToken,
        tokenScope,
      });
      resolvedSubscribeId = purchase.subscribeId;
    }
  } else {
    const buyPointsSession = await resolveBuyPointsSession();
    resolvedEmail = buyPointsSession.email;
    authToken = buyPointsSession.token;
    tokenScope = TOKEN_SCOPE.BUY_POINTS;

    const purchase = await buyPointsForCheckout({
      requiredPoints: totalPoints,
      paymentMethod,
      authToken,
      tokenScope,
    });
    resolvedSubscribeId = purchase.subscribeId;
  }

  if (!resolvedSubscribeId) {
    throw new Error('Checkout could not resolve a subscribe id.');
  }

  const response = await createSwapOrder(
    {
      subscribe_id_c: resolvedSubscribeId,
      customer_address_id_c: '',
      items: eligibleItems.map((item) => ({
        id: item.id,
        evaluated_points_c: String(toPointsValue(item.points)),
      })),
      customer_address: '.',
    },
    authToken,
    tokenScope
  );

  const data = assertSwapSuccess(response);
  const createdOrder = data?.order;
  const itemCount = Number.parseInt(createdOrder?.total_items_c || '0', 10) || eligibleItems.length;
  const resolvedTotalPoints = Number.parseInt(createdOrder?.order_cost_c || '0', 10) || totalPoints;

  return {
    id: createdOrder?.unique_id_c || createdOrder?.id || `ORD-${Date.now()}`,
    status: createdOrder?.status_c || 'Placed',
    date: createdOrder?.order_date_c || new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date()),
    itemCount: `${itemCount} item${itemCount === 1 ? '' : 's'}`,
    total: `${resolvedTotalPoints} pts`,
    paymentMethod,
    email: resolvedEmail,
  };
};

export const placeCustomerOrder = async ({ email, items = [], paymentMethod, subscribeId = '' }) =>
  placeSwapCheckoutOrder({
    mode: 'customer',
    email,
    items,
    paymentMethod,
    subscribeId,
  });

/**
 * Get customer subscriptions.
 * @param {string} email
 * @returns {Promise<import('../types/swapTypes').SwapSubscription[]>}
 */
export const getCustomerSubscriptions = async (email) => {
  if (SWAP_USE_MOCK) {
    await delay();
    return getMockCustomerProfile(email).subscriptions || customerSubscriptions;
  }

  const session = await createCustomerSession(email);
  const customerTokenScope = createCustomerTokenScope(session?.email || email);
  const loginResponse = session?.loginResponse;
  const customerId = loginResponse?.customer?.id;
  const customerToken = loginResponse?.token || '';

  if (!customerId) {
    return EMPTY_ARRAY;
  }

  const response = await getCustomerSubscribesList({ customerId, authToken: customerToken, tokenScope: customerTokenScope });
  return (getResponseData(response).subscribes || []).map(mapApiSubscribeToSubscription);
};

export const getActiveCustomerSubscriptions = async (email) => {
  if (SWAP_USE_MOCK) {
    await delay();
    return (getMockCustomerProfile(email).subscriptions || customerSubscriptions).filter(
      (subscription) => String(subscription.status || '').toLowerCase() === 'active'
    );
  }

  const session = await createCustomerSession(email);
  const customerTokenScope = createCustomerTokenScope(session?.email || email);
  const customerId = session?.loginResponse?.customer?.id;
  const customerToken = session?.loginResponse?.token || '';

  if (!customerId) {
    return EMPTY_ARRAY;
  }

  const response = await getCustomerSubscribesList({
    customerId,
    subscribeType: 'shop',
    ignoreNonPickupSubscribe: true,
    authToken: customerToken,
    tokenScope: customerTokenScope,
  });

  return (getResponseData(response).subscribes || [])
    .filter((subscription) => String(subscription?.status_c || '').toLowerCase() === 'active')
    .map(mapApiSubscribeToSubscription);
};

/**
 * Get customer pickups.
 * @param {string} email
 * @returns {Promise<import('../types/swapTypes').SwapPickup[]>}
 */
export const getCustomerPickups = async (email) => {
  if (SWAP_USE_MOCK) {
    await delay();
    return getMockCustomerProfile(email).pickups || customerPickups;
  }

  return getAllCustomerPickups(email);
};

export const getAllCustomerPickups = async (email) => {
  if (SWAP_USE_MOCK) {
    await delay();
    return getMockCustomerProfile(email).pickups || customerPickups;
  }

  const normalizedEmail = String(email || '').trim().toLowerCase();
  const session = await createCustomerSession(normalizedEmail);
  const customerTokenScope = createCustomerTokenScope(session?.email || normalizedEmail);
  const customerToken = session?.loginResponse?.token || '';

  if (!normalizedEmail || !customerToken) {
    throw new Error('Customer token is unavailable for pickups list.');
  }

  console.log('[swapApi] getCustomerPickups token', {
    email: normalizedEmail,
    token: String(customerToken),
    source: 'customer-session',
  });

  const response = await postJson(
    'pickups/list',
    {},
    true,
    {},
    customerToken,
    'getCustomerPickups',
    customerTokenScope
  );

  const responseData = getResponseData(response);
  const rawPickups = responseData?.pickups || response?.pickups || EMPTY_ARRAY;
  console.log('[swapApi] getCustomerPickups raw response', {
    email: normalizedEmail,
    response,
    extractedCount: Array.isArray(rawPickups) ? rawPickups.length : 0,
  });

  return (Array.isArray(rawPickups) ? rawPickups : EMPTY_ARRAY).map(mapApiPickupDetailToPickup);
};

const postPublicJson = async (path, body, withVersion = true, extraHeaders = {}, callerName = 'unknown') => {
  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };
  const url = buildUrl(path, withVersion);
  logApiRequest({
    callerName,
    method: 'POST',
    url,
    payload: body,
    headers,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const json = await response.json().catch(() => null);
  const payload = json ?? {
    status: response.ok,
    error: {
      code: `HTTP-${response.status}`,
      message: 'Invalid JSON response from server.',
    },
    status_code: response.status,
  };

  logApiResponse({
    callerName,
    method: 'POST',
    url,
    response: payload,
  });

  if (!response.ok || payload?.status === false || getResponseError(payload)) {
    const errorPayload = getResponseError(payload);
    const message = errorPayload?.message || payload?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload;
};

const getAuthenticatedTaxonomyList = async ({
  path,
  responseKey,
  body = DEFAULT_TAXONOMY_LIST_PARAMS,
  mockData = EMPTY_ARRAY,
  callerName = 'unknown',
  authTokenResolver = resolveOperatorAuthToken,
  tokenScope = TOKEN_SCOPE.OPERATOR,
  withVersion = true,
} = {}) => {
  if (SWAP_USE_MOCK) {
    await delay();
    return mockData;
  }

  const authToken = await authTokenResolver();
  const response = await postJson(
    path,
    body,
    withVersion,
    {},
    authToken,
    callerName,
    tokenScope
  );

  const records = getResponseDataList(response, responseKey);
  return records;
};

/**
 * Get details of customer subscription.
 * @param {string} email
 * @param {string} subscriptionId
 * @returns {Promise<import('../types/swapTypes').SwapSubscription>}
 */
export const getCustomerSubscriptionDetails = async (email, subscriptionId) => {
  if (SWAP_USE_MOCK) {
    await delay();
    return getMockCustomerSubscription(email, subscriptionId);
  }

  const session = await createCustomerSession(email);
  const customerTokenScope = createCustomerTokenScope(session?.email || email);
  const customerId = session?.loginResponse?.customer?.id;
  const customerToken = session?.loginResponse?.token || '';

  if (!customerId) {
    return null;
  }

  const response = await postJson(
    'subscribes/get',
    {
      tenancy: 'SWAP.SUBSCRIBE.GET.CUST_ID',
      customer_id_c: customerId,
      subscribe_type_c: 'shop',
      subscribe_id_c: subscriptionId,
    },
    true,
    {},
    customerToken,
    'getCustomerSubscriptionDetails',
    customerTokenScope
  );

  const responseData = getResponseData(response);
  const primaryRecord = getResponsePrimaryRecord(response);
  const matchingSubscriptionFromList = Array.isArray(responseData?.subscribes)
    ? responseData.subscribes.find(
        (entry) =>
          String(entry?.id || '').trim() === String(subscriptionId || '').trim() ||
          String(entry?.unique_id_c || '').trim() === String(subscriptionId || '').trim()
      ) || null
    : null;
  const subscription =
    responseData?.subscribe ||
    responseData?.subscription ||
    matchingSubscriptionFromList ||
    (primaryRecord?.id ? primaryRecord : null) ||
    null;

  if (!subscription) {
    console.log('[swapApi] getCustomerSubscriptionDetails empty payload', {
      subscriptionId,
      response,
    });
    return null;
  }

  return {
    ...mapApiSubscribeToSubscription(subscription),
    items: (subscription?.items || []).map(mapApiSubscriptionItem),
  };
};

export const getActivePackageDetails = async (email) => {
  if (SWAP_USE_MOCK) {
    await delay();
    const activeSubscription = (getMockCustomerProfile(email).subscriptions || customerSubscriptions).find(
      (subscription) => String(subscription.status || '').toLowerCase() === 'active'
    );
    if (!activeSubscription) {
      return null;
    }
    return getMockCustomerSubscription(email, activeSubscription.id);
  }

  const activeSubscriptions = await getActiveCustomerSubscriptions(email);
  const activeSubscription = activeSubscriptions[0];

  if (!activeSubscription?.id) {
    return null;
  }

  return getCustomerSubscriptionDetails(email, activeSubscription.id);
};

/**
 * Get details of customer pickup.
 * @param {string} email
 * @param {string} pickupId
 * @returns {Promise<import('../types/swapTypes').SwapPickup | null>}
 */
export const getCustomerPickupDetails = async (email, pickupId) => {
  if (SWAP_USE_MOCK) {
    await delay();
    return getMockCustomerPickup(email, pickupId);
  }

  const session = await createCustomerSession(email);
  const customerTokenScope = createCustomerTokenScope(session?.email || email);
  const customerToken = session?.loginResponse?.token || '';

  if (!pickupId) {
    return null;
  }

  const response = await postJson(
    'v3/pickups/details',
    {
      data_tenancy: 'SWAP.PICKUP.DATA_VIEW.DETAIL_PROTECTED',
      detail_tenancy: 'SWAP.PICKUP.DETAIL_VIEW.ID',
      id: pickupId,
    },
    false,
    {},
    customerToken,
    'getCustomerPickupDetails',
    customerTokenScope
  );

  const responseData = getResponseData(response);
  const pickup = responseData?.pickup || response?.pickup || null;
  console.log('[swapApi] getCustomerPickupDetails raw response', {
    email,
    pickupId,
    response,
    errorJson: response?.error ? JSON.stringify(response.error, null, 2) : '',
    hasPickup: Boolean(pickup),
  });

  return pickup ? mapApiPickupDetailToPickup(pickup) : null;
};

/**
 * Get the latest pickup linked to a subscription.
 * Stub for a dedicated backend API when available.
 * @param {string} email
 * @param {string} subscriptionId
 * @returns {Promise<import('../types/swapTypes').SwapPickup | null>}
 */
export const getLatestPickupForSubscription = async (email, subscriptionId) => {
  if (SWAP_USE_MOCK) {
    await delay();
    const pickups = getMockCustomerProfile(email).pickups || customerPickups;
    return pickups.find((pickup) => String(pickup?.subscriptionId || '') === String(subscriptionId || '')) || null;
  }

  const session = await createCustomerSession(email);
  const customerTokenScope = createCustomerTokenScope(session?.email || email);
  const customerToken = session?.loginResponse?.token || '';

  if (!subscriptionId || !customerToken) {
    return null;
  }

  const response = await postJson(
    'pickups/list/by-subscribe',
    {
      subscribe_id_c: subscriptionId,
    },
    true,
    {},
    customerToken,
    'getLatestPickupForSubscription',
    customerTokenScope
  );

  console.log('[swapApi] getLatestPickupForSubscription response', {
    subscriptionId,
    status: response?.status,
    status_code: response?.status_code,
    success: response?.success || null,
    error: response?.error || null,
  });

  const pickups = getResponseData(response).pickups || EMPTY_ARRAY;

  if (!Array.isArray(pickups) || pickups.length === 0) {
    console.log('[swapApi] getLatestPickupForSubscription resolvedPickup', {
      subscriptionId,
      pickupCount: Array.isArray(pickups) ? pickups.length : 0,
      pickup: null,
    });
    return null;
  }

  const [latestPickup] = [...pickups].sort((left, right) => {
    const leftTime = new Date(left?.date_modified || left?.date_entered || 0).getTime();
    const rightTime = new Date(right?.date_modified || right?.date_entered || 0).getTime();
    return rightTime - leftTime;
  });

  const resolvedPickup = latestPickup ? mapApiPickupDetailToPickup(latestPickup) : null;

  console.log('[swapApi] getLatestPickupForSubscription resolvedPickup', {
    subscriptionId,
    pickupCount: pickups.length,
    pickup: resolvedPickup,
  });

  return resolvedPickup;
};

export const loginAsSwapShopCustomer = async () => {
  const swapShopEmail = (process.env.EXPO_PUBLIC_SWAP_EMAIL || '').trim().toLowerCase();
  if (!swapShopEmail) {
    throw new Error('EXPO_PUBLIC_SWAP_EMAIL is not configured.');
  }

  return loginAsCustomer(swapShopEmail);
};

export const loginAsBuyPointsCustomer = async () => {
  const buyPointsEmail = (process.env.EXPO_PUBLIC_SWAP_BUY_POINTS_EMAIL || '').trim().toLowerCase();
  if (!buyPointsEmail) {
    throw new Error('EXPO_PUBLIC_SWAP_BUY_POINTS_EMAIL is not configured.');
  }

  return loginAsCustomer(buyPointsEmail);
};

export const loginAsBoothCustomer = async () => {
  const boothEmail = (process.env.EXPO_PUBLIC_BOOTH_EMAIL || '').trim().toLowerCase();
  if (!boothEmail) {
    throw new Error('EXPO_PUBLIC_BOOTH_EMAIL is not configured.');
  }

  return loginAsCustomer(boothEmail);
};

/**
 * Get all pickups linked to a subscription.
 * @param {string} email
 * @param {string} subscriptionId
 * @returns {Promise<import('../types/swapTypes').SwapPickup[]>}
 */
export const getPickupsForSubscription = async (email, subscriptionId) => {
  if (SWAP_USE_MOCK) {
    await delay();
    const pickups = getMockCustomerProfile(email).pickups || customerPickups;
    return pickups.filter((pickup) => String(pickup?.subscriptionId || '') === String(subscriptionId || ''));
  }

  const session = await createCustomerSession(email);
  const customerTokenScope = createCustomerTokenScope(session?.email || email);
  const customerToken = session?.loginResponse?.token || '';

  if (!subscriptionId || !customerToken) {
    return EMPTY_ARRAY;
  }

  const response = await postJson(
    'pickups/list/by-subscribe',
    {
      subscribe_id_c: subscriptionId,
    },
    true,
    {},
    customerToken,
    'getPickupsForSubscription',
    customerTokenScope
  );

  const pickups = getResponseData(response).pickups || EMPTY_ARRAY;
  return Array.isArray(pickups) ? pickups.map(mapApiPickupDetailToPickup) : EMPTY_ARRAY;
};

/**
 * Review product with approve/reject action.
 * @param {{ productId: string, action: 'approve' | 'reject', notes?: string, reviewedBy?: string }} params
 * @returns {Promise<import('../types/swapTypes').SwapReviewResponse>}
 */
export const reviewProduct = async ({ productId, action, notes = '', reviewedBy = 'ops@swapaholic.com' }) => {
  await delay();

  const product = mockSwapProducts.find((item) => item.id === productId);

  if (!product) {
    throw new Error('Product not found');
  }

  const now = new Date().toISOString();
  const review = {
    id: `REV-${mockProductReviews.length + 1}`,
    productId,
    action,
    status: action === 'approve' ? 'approved' : 'rejected',
    reviewedBy,
    reviewedAt: now,
    notes,
  };

  product.status_c = action === 'approve' ? 'approved' : 'rejected';
  product.sub_status_c = action === 'approve' ? 'published' : 'needs_changes';
  mockProductReviews.push(review);

  return review;
};

/**
 * Get subscriptions list by tenancy.
 * Endpoint: POST /{api_ver}/subscriptions/list
 * Request: { tenancy: 'SWAP.SUB.TYPE.ITEMS.STORE' | 'SWAP.SUB.TYPE.ITEMS.SHOP' | 'SWAP.SUB.TYPE.POINTS.SHOP' | 'SWAP.SUB.TYPE.CONVERSIONS.SHOP' }
 * @param {import('../types/swapTypes').SwapSubscriptionTenancy} tenancy
 * @returns {Promise<import('../types/swapTypes').SwapApiEnvelope<Record<string, unknown>> | Record<string, unknown>>}
 */
export const getSubscriptionsList = async (tenancy = 'SWAP.SUB.TYPE.ITEMS.STORE', authToken = '', tokenScope = TOKEN_SCOPE.SHOP) => {
  if (SWAP_USE_MOCK) {
    await delay();
    return toMockSubscriptionListResponse(tenancy);
  }

  const resolvedAuthToken = authToken || getCachedStoredAppSession()?.shopToken || (await getStoredShopToken());
  if (!resolvedAuthToken) {
    throw new Error('Operator token is unavailable. Rehydrate app session to obtain and persist it.');
  }
  return postJson('subscriptions/list', { tenancy }, true, {}, resolvedAuthToken, 'getSubscriptionsList', tokenScope);
};

export const getAllSubscriptions = async () => {
  const tenancies = ['SWAP.SUB.TYPE.ITEMS.STORE', 'SWAP.SUB.TYPE.POINTS.SHOP', 'SWAP.SUB.TYPE.CONVERSIONS.SHOP'];
  const responses = await Promise.all(tenancies.map((tenancy) => getSubscriptionsList(tenancy)));
  const subscriptions = responses.flatMap((response) => getResponseData(response).subscriptions || []);
  const uniqueById = new Map();

  subscriptions.forEach((subscription) => {
    if (subscription?.id) {
      uniqueById.set(subscription.id, subscription);
    }
  });

  return Array.from(uniqueById.values());
};

export const getShopPointsSubscriptions = async (authToken = '', tokenScope = TOKEN_SCOPE.SHOP) => {
  const response = await getSubscriptionsList('SWAP.SUB.TYPE.POINTS.SHOP', authToken, tokenScope);
  console.log('[swapApi] getShopPointsSubscriptions raw response', response);
  const subscriptions = getResponseData(response).subscriptions || EMPTY_ARRAY;
  console.log('[swapApi] getShopPointsSubscriptions resolved subscriptions', subscriptions);
  return subscriptions;
};

export const getShopItemSubscriptions = async (authToken = '', tokenScope = TOKEN_SCOPE.SHOP) => {
  const response = await getSubscriptionsList('SWAP.SUB.TYPE.ITEMS.SHOP', authToken, tokenScope);
  console.log('[swapApi] getShopItemSubscriptions raw response', response);
  const subscriptions = getResponseData(response).subscriptions || EMPTY_ARRAY;
  console.log('[swapApi] getShopItemSubscriptions resolved subscriptions', subscriptions);
  return subscriptions;
};

export const saveShopSubscription = async ({
  paymentMode = 'cash',
  srUserId,
  subscription,
  authToken = '',
  tokenScope = TOKEN_SCOPE.SHOP,
  addOns = EMPTY_ARRAY,
  type = 'SWAP.SUBSCRIBE.TYPE.SHOP',
  code = '',
  autoRenew = 'off',
}) => {
  if (!srUserId) {
    throw new Error('Missing sr_user_id for subscription purchase.');
  }

  if (!subscription?.id) {
    throw new Error('Missing subscription data for subscription purchase.');
  }

  const normalizedPaymentMode = String(paymentMode || '').toLowerCase();
  if (!['cash', 'card', 'paynow'].includes(normalizedPaymentMode)) {
    throw new Error('Invalid payment mode. Expected cash, card, or paynow.');
  }

  const path = `v3/subscribes/save/shop/${normalizedPaymentMode}`;
  const payload = {
    sr_user_id: srUserId,
    subscription,
    add_ons: addOns,
    type,
    code_c: code,
    auto_renew_c: autoRenew,
  };

  if (SWAP_USE_MOCK) {
    await delay();
    console.log('[swapApi] saveShopSubscription mock request', {
      useMock: true,
      path,
      payload,
    });
    const response = {
      status: true,
      success: {
        code: 'SUBSCRIBE-201',
        message: 'Subscription purchase created',
        data: {
          id: `SUB-${Date.now()}`,
          payment_mode: normalizedPaymentMode,
          sr_user_id: srUserId,
          subscription,
          add_ons: addOns,
          type,
          code_c: code,
          auto_renew_c: autoRenew,
        },
      },
      error: null,
      status_code: 200,
    };
    console.log('[swapApi] saveShopSubscription mock response', response);
    return response;
  }

  const url = buildUrl(path);

  console.log('[swapApi] saveShopSubscription request', {
    useMock: false,
    method: 'POST',
    url,
    payload,
  });

  try {
    const response = await postJson(
      path,
      payload,
      false,
      {},
      authToken,
      'saveShopSubscription',
      tokenScope
    );
    console.log('[swapApi] saveShopSubscription response', response);
    return response;
  } catch (error) {
    console.error('[swapApi] saveShopSubscription error', {
      method: 'POST',
      url,
      payload,
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

export const updateCustomerSubscribe = async ({
  subscribeId = '',
  subscribe = {},
  customerEmail = '',
  authToken = '',
} = {}) => {
  if (!subscribeId) {
    throw new Error('Subscription id is required for subscription update.');
  }

  const customerAuthToken = await resolveCustomerAuthToken(customerEmail, authToken);
  const customerTokenScope = normalizeEmail(customerEmail) ? createCustomerTokenScope(customerEmail) : '';

  if (SWAP_USE_MOCK) {
    await delay();
    return createSwapSuccessResponse('SUBSCRIBE-200', 'Subscription updated', {
      subscribe_id: subscribeId,
      subscribe: {
        id: subscribeId,
        ...subscribe,
      },
    });
  }

  return postJson(
    'v3/subscribes/update',
    {
      subscribe_id: subscribeId,
      subscribe,
    },
    false,
    {},
    customerAuthToken,
    'updateCustomerSubscribe',
    customerTokenScope
  );
};

export const createCustomerPickup = async ({
  customerEmail = '',
  authToken = '',
  subscribeId = '',
  numberOfItems = '',
  tripDate = new Date(),
} = {}) => {
  if (!subscribeId) {
    throw new Error('Subscription id is required for pickup creation.');
  }

  assertPickupConfig();

  const customerAuthToken = await resolveCustomerAuthToken(customerEmail, authToken);
  const customerTokenScope = normalizeEmail(customerEmail) ? createCustomerTokenScope(customerEmail) : '';
  const payload = {
    trip_date_c: formatPickupTripDate(tripDate),
    trip_time_c: DEFAULT_PICKUP_TRIP_TIME,
    number_of_items_c: String(numberOfItems || '0'),
    ...DEFAULT_PICKUP_ADDRESS,
    subscribe_id_c: subscribeId,
    type_c: 'dropoff',
    origin_c: 'shop',
    customer_address_id_c: null,
    accepted_items_c: '0',
    rejected_items_c: '0',
  };

  if (SWAP_USE_MOCK) {
    await delay();
    return {
      status: true,
      message: 'Dropoff scheduled.',
      pickup_id: `PICKUP-${Date.now()}`,
      subscribe_id: subscribeId,
      status_code: 200,
    };
  }

  return postJson(
    'v3/pickups/save',
    payload,
    false,
    {},
    customerAuthToken,
    'createCustomerPickup',
    customerTokenScope
  );
};

/**
 * Get customer subscribes list using customer id returned by login API.
 * Endpoint: POST /{api_ver}/subscribes/list
 * @param {import('../types/swapTypes').SwapSubscribesRequest} params
 * @returns {Promise<import('../types/swapTypes').SwapApiEnvelope<Record<string, unknown>> | Record<string, unknown>>}
 */
export const getCustomerSubscribesList = async ({
  customerId,
  subscribeType = 'shop',
  ignoreNonPickupSubscribe = false,
  authToken = '',
  tokenScope = '',
}) => {
  if (SWAP_USE_MOCK) {
    await delay();
    return {
      status: true,
      success: {
        code: 'SUBSCRIBE-001',
        message: 'Subscribes fetched',
        data: {
          subscribes: toMockCustomerDetailResponse().success.data.customer.subscribes_list,
        },
      },
      error: null,
      status_code: 200,
    };
  }

  return postJson(
    'subscribes/list',
    {
      tenancy: 'SWAP.SUBSCRIBE.GET.CUST_ID',
      customer_id_c: customerId,
      subscribe_type_c: subscribeType,
      ignore_non_pickup_subscribe: ignoreNonPickupSubscribe,
    },
    true,
    {},
    authToken,
    'getCustomerSubscribesList',
    tokenScope
  );
};

/**
 * Get customer details with subscription and wallet data.
 * Endpoint: POST /{api_ver}/customers/get
 * @returns {Promise<import('../types/swapTypes').SwapApiEnvelope<Record<string, unknown>> | Record<string, unknown>>}
 */
export const getCustomerDetails = async () => {
  if (SWAP_USE_MOCK) {
    await delay();
    return toMockCustomerDetailResponse();
  }

  return postJson(
    'customers/get',
    CUSTOMER_DETAILS_REQUEST,
    true,
    {},
    '',
    'getCustomerDetails',
    TOKEN_SCOPE.OPERATOR
  );
};

export const getCustomerDetailsByToken = async ({ customerEmail = '', authToken = '' } = {}) => {
  if (SWAP_USE_MOCK) {
    await delay();
    return toMockCustomerDetailResponse(customerEmail);
  }

  const customerAuthToken = await resolveCustomerAuthToken(customerEmail, authToken);
  const customerTokenScope = normalizeEmail(customerEmail) ? createCustomerTokenScope(customerEmail) : '';

  return postJson(
    'customers/get',
    CUSTOMER_DETAILS_REQUEST,
    true,
    {},
    customerAuthToken,
    'getCustomerDetailsByToken',
    customerTokenScope
  );
};

export const purchaseFlexiPlan = async ({
  customerEmail = '',
  authToken = '',
  srUserId = '',
  paymentMode = 'cash',
  subscription = null,
  activeSubscription = null,
  onProgress,
} = {}) => {
  assertFlexiPlanPurchasePreflight({
    srUserId,
    paymentMode,
    subscription,
  });

  const customerAuthToken = await resolveCustomerAuthToken(customerEmail, authToken);
  const customerTokenScope = normalizeEmail(customerEmail) ? createCustomerTokenScope(customerEmail) : '';
  const currentActiveSubscriptionId = String(activeSubscription?.id || '').trim();

  if (currentActiveSubscriptionId) {
    const updateResponse = await updateCustomerSubscribe({
      subscribeId: currentActiveSubscriptionId,
      subscribe: {
        status_c: 'completed',
      },
      customerEmail,
      authToken: customerAuthToken,
    });
    assertSwapSuccess(updateResponse);
  }

  onProgress?.('Buying flexi plan');
  const saveResponse = await saveShopSubscription({
    paymentMode,
    srUserId,
    subscription,
    authToken: customerAuthToken,
    tokenScope: customerTokenScope,
  });
  assertSwapSuccess(saveResponse);

  const subscribeId = extractCheckoutSubscribeId(saveResponse);
  if (!subscribeId) {
    throw new Error('Subscription purchase response did not include a subscribe id.');
  }

  onProgress?.('Creating pickup');
  const pickupResponse = await createCustomerPickup({
    customerEmail,
    authToken: customerAuthToken,
    subscribeId,
    numberOfItems: subscription?.number_of_items_c || '0',
    tripDate: new Date(),
  });
  assertSwapSuccess(pickupResponse);
  const pickupId = extractPickupId(pickupResponse);
  if (!pickupId) {
    throw new Error('Pickup creation response did not include a pickup id.');
  }

  let verification;
  try {
    verification = await waitForFlexiPlanVerification({
      customerEmail,
      authToken: customerAuthToken,
      newSubscribeId: subscribeId,
      previousSubscribeId: currentActiveSubscriptionId,
      delayMs: 5000,
    });
  } catch (error) {
    verification = {
      verified: false,
      error: error?.message || 'Verification failed.',
      response: null,
      activeMatchesNew: false,
      previousCompleted: false,
      activeShopSubscribe: null,
      newSubscribe: null,
      previousSubscribe: null,
      customer: null,
    };
  }

  return {
    subscribeId,
    pickupId,
    saveResponse,
    pickupResponse,
    verification,
    verified: verification.verified,
    message: verification.verified
      ? 'Subscription purchased successfully.'
      : verification?.error
        ? `Subscription was saved, but verification failed: ${verification.error}`
        : 'Subscription was saved, but the refreshed customer details did not confirm the update yet.',
  };
};

/**
 * Get items in a pickup.
 * Endpoint: POST /v3/users/customer-items/list/by/pickup
 * @param {import('../types/swapTypes').SwapPickupItemsRequest} params
 * @returns {Promise<import('../types/swapTypes').SwapApiEnvelope<Record<string, unknown>> | Record<string, unknown>>}
 */
export const getItemsByPickup = async ({ pickupId, maxResults = 20, offset = 0, filters = [] }) => {
  if (SWAP_USE_MOCK) {
    await delay();
    const pickup = customerPickups.find((entry) => entry.id === pickupId) || customerPickups[0];
    return {
      status: true,
      success: {
        code: 'ITEM-001',
        message: 'Pickup items fetched',
        data: {
          offset,
          items: pickup.items,
        },
      },
      error: null,
      status_code: 200,
    };
  }

  return postJson(
    'users/customer-items/list/by/pickup',
    {
      parent_filter: pickupId,
      view_tenancy: 'SWAP.ITEM.IMAGE_VIEW.NONE',
      parent_filter_tenancy: 'SWAP.ITEM.PARENT_FILTER.PICKUP_BY_ID',
      max_results: maxResults,
      offset,
      filters,
    },
    false,
    {},
    '',
    'getItemsByPickup',
    TOKEN_SCOPE.OPERATOR
  );
};

/**
 * Get customer unreviewed/unconfirmed items.
 * Endpoint: POST /{api_ver}/customer-items/list
 * @param {import('../types/swapTypes').SwapUnreviewedItemsRequest} params
 * @returns {Promise<import('../types/swapTypes').SwapApiEnvelope<Record<string, unknown>> | Record<string, unknown>>}
 */
export const getCustomerUnreviewedItems = async ({ maxResults = 21, offset = 0, filters = [], customerEmail = '', authToken = '' } = {}) => {
  if (SWAP_USE_MOCK) {
    await delay();
    return {
      status: true,
      success: {
        code: 'ITEM-001',
        message: 'Customer unreviewed items fetched',
        data: {
          offset,
          items: mockSwapProducts.filter((item) => item.status_c === 'confirmation_pending'),
        },
      },
      error: null,
      status_code: 200,
    };
  }

  const customerAuthToken = await resolveCustomerAuthToken(customerEmail, authToken);
  const customerTokenScope = normalizeEmail(customerEmail) ? createCustomerTokenScope(customerEmail) : '';
  const response = await postJson(
    'customer-items/list',
    {
      parent_filter_tenancy: 'SWAP.ITEM.PARENT_FILTER.CUSTOMER.UNCONFIRMED',
      view_tenancy: 'SWAP.ITEM.IMAGE_VIEW.UNCONFIRMED_LIST',
      parent_filter: 'test',
      max_results: maxResults,
      offset,
      filters,
      sort: 'SWAP.ITEM.SORT.DATE.RECENT',
    },
    true,
    {},
    customerAuthToken,
    'getCustomerUnreviewedItems',
    customerTokenScope
  );

  const data = getCustomerItemsListData(response);
  return {
    ...response,
    success: response?.success
      ? {
          ...response.success,
          data: {
            ...data,
            items: Array.isArray(data?.items) ? data.items : EMPTY_ARRAY,
          },
        }
      : response.success,
    error: response?.error
      ? {
          ...response.error,
          data: {
            ...data,
            items: Array.isArray(data?.items) ? data.items : EMPTY_ARRAY,
          },
        }
      : response.error,
  };
};

/**
 * Review a customer item in swap flow.
 * Endpoint: POST /v4/customer-items/review/item
 * @param {import('../types/swapTypes').SwapReviewItemRequest} params
 * @returns {Promise<import('../types/swapTypes').SwapApiEnvelope<import('../types/swapTypes').SwapProduct> | Record<string, unknown>>}
 */
export const reviewCustomerItem = async ({ id, status_c, customerEmail = '', authToken = '' }) => {
  if (SWAP_USE_MOCK) {
    await delay();

    const product = mockSwapProducts.find((item) => String(item.id) === String(id));

    if (!product) {
      return createSwapErrorResponse('CIT-404', 'Customer item not found');
    }

    product.status_c = status_c;
    product.sub_status_c = status_c === 'approved' ? 'published' : status_c;

    return createSwapSuccessResponse('CIT-200', 'Customer item reviewed', product);
  }

  const customerAuthToken = await resolveCustomerAuthToken(customerEmail, authToken);
  const customerTokenScope = normalizeEmail(customerEmail) ? createCustomerTokenScope(customerEmail) : '';
  return postJson(
    'v4/customer-items/review/item',
    {
      id,
      status_c,
    },
    false,
    {},
    customerAuthToken,
    'reviewCustomerItem',
    customerTokenScope
  );
};

/**
 * Add item to customer pickup.
 * Endpoint: POST /v3/users/customer-items/init
 * @param {import('../types/swapTypes').SwapAddItemRequest} params
 * @returns {Promise<import('../types/swapTypes').SwapApiEnvelope<Record<string, unknown>> | Record<string, unknown>>}
 */
export const addItemToCustomerPickup = async ({ pickupId, thumbnailFile }) => {
  if (SWAP_USE_MOCK) {
    await delay();
    const item = {
      id: `ITEM-${Date.now()}`,
      pickup_id_c: pickupId,
      sub_status_c: 'out_inventory',
      thumbnail_c: thumbnailFile?.uri || '',
    };

    return {
      status: true,
      success: {
        code: 'ITEM-201',
        message: 'Customer item created',
        data: item,
      },
      error: null,
      status_code: 200,
    };
  }

  const formData = new FormData();
  formData.append('pickup_id_c', pickupId);
  formData.append('thumbnail_c', thumbnailFile);
  console.log('[swapApi] addItemToCustomerPickup payload', {
    pickupId: String(pickupId || ''),
    thumbnailFile: thumbnailFile
      ? {
          uri: thumbnailFile?.uri || '',
          name: thumbnailFile?.name || '',
          type: thumbnailFile?.type || '',
        }
      : null,
  });

  const response = await postFormData('v3/users/customer-items/init', formData, false, '', 'addItemToCustomerPickup', TOKEN_SCOPE.OPERATOR);
  console.log('[swapApi] addItemToCustomerPickup full response', response);
  return response;
};

export const updateCustomerPickupItem = async ({ id, item = {} } = {}) => {
  if (!id) {
    throw new Error('Customer item id is required.');
  }

  if (SWAP_USE_MOCK) {
    await delay();
    const updatedItem = {
      id,
      ...item,
    };

    return {
      status: true,
      success: {
        code: 'ITEM-200',
        message: 'Customer item updated',
        data: updatedItem,
      },
      error: null,
      status_code: 200,
    };
  }

  return postJson(
    'v3/users/customer-items/update',
    {
      id,
      update_tenancy: 'SWAP.ITEM.UPDATE.ID',
      item,
    },
    false,
    {},
    '',
    'updateCustomerPickupItem',
    TOKEN_SCOPE.OPERATOR
  );
};

/**
 * Create and populate a customer pickup item.
 * @param {import('../types/swapTypes').SwapAddItemRequest & { item?: Record<string, unknown> }} params
 */
export const createCustomerPickupItem = async ({ pickupId, thumbnailFile, item = {} } = {}) => {
  const initResponse = await addItemToCustomerPickup({
    pickupId,
    thumbnailFile,
  });
  const initializedItem = getResponsePrimaryRecord(initResponse);
  const itemId = initializedItem?.id || getResponseData(initResponse)?.id || initResponse?.item?.id || initResponse?.id || '';

  if (!itemId) {
    throw new Error('Customer item was created but no item id was returned.');
  }

  const updateResponse = await updateCustomerPickupItem({
    id: itemId,
    item,
  });
  const updatedItem = getResponsePrimaryRecord(updateResponse);

  return {
    itemId,
    item: updatedItem || { id: itemId, ...item },
    initResponse,
    updateResponse,
  };
};

export const getCustomerProfile = async (email) => {
  if (SWAP_USE_MOCK) {
    await delay();
    return getMockCustomerProfile(email);
  }

  const session = await createCustomerSession(email);
  return session.profile;
};

export const getCustomerSwappedInItems = async (email) => {
  if (SWAP_USE_MOCK) {
    await delay();
    return getMockCustomerProfile(email).swappedInItems || customerSwappedInItems;
  }

  const pickups = await getCustomerPickups(email);
  return pickups.flatMap((pickup) => pickup.items || []);
};

export const getCustomerCheckoutCart = async (email) => {
  if (SWAP_USE_MOCK) {
    await delay();
    return getMockCustomerProfile(email).checkoutCart || customerCheckoutCart;
  }

  return EMPTY_ARRAY;
};

/**
 * Finds a product by scanned QR payload.
 * @param {string} email
 * @param {string} scanText
 * @param {string} [authToken='']
 * @returns {Promise<{ sku: string, name: string, size: string, points: string } | null>}
 */
export const findProductByQrCode = async (email, scanText, authToken = '') => {
  if (SWAP_USE_MOCK) {
    await delay();
    const customerCart = getMockCustomerProfile(email).checkoutCart || customerCheckoutCart;
    const query = String(scanText || '')
      .trim()
      .toLowerCase();

    if (!query) {
      return null;
    }

    return (
      customerCart.find(
        (item) =>
          item.sku?.toLowerCase() === query ||
          item.unique_item_id_c?.toLowerCase() === query ||
          item.name?.toLowerCase() === query ||
          `${item.sku || item.unique_item_id_c || ''} ${item.name}`.toLowerCase().includes(query)
      ) || null
    );
  }

  const query = String(scanText || '').trim();
  if (!query) {
    return null;
  }

  const customerAuthToken = await resolveCustomerAuthToken(email, authToken);
  const customerTokenScope = normalizeEmail(email) ? createCustomerTokenScope(email) : '';
  const response = await postJson(
    'customer-items/get/item',
    {
      data_tenancy: 'SWAP.ITEM.DATA_VIEW.ONLY_RECORD',
      view_tenancy: 'SWAP.ITEM.IMAGE_VIEW.NONE',
      detail_tenancy: 'SWAP.ITEM.DETAIL_VIEW.UNIQUE_ID',
      unique_item_id_c: query,
    },
    true,
    {},
    customerAuthToken,
    'findProductByQrCode',
    customerTokenScope
  );

  if (response?.status === false) {
    const error = getResponseError(response);
    throw new Error(error?.message || 'Unable to find item from QR code.');
  }

  const item = getResponsePrimaryRecord(response);
  if (!item || item.available_c === 'no') {
    return null;
  }

  return mapCustomerItemToCheckoutCartItem(item);
};

export const getSwapPlans = async () => {
  if (SWAP_USE_MOCK) {
    await delay();
    return plans;
  }

  const subscriptions = await getAllSubscriptions();
  return subscriptions.map(formatPlanLabel);
};

export const getBrands = async () => {
  if (SWAP_USE_MOCK) {
    await delay();
    return mockBrands;
  }

  const guestToken = await resolveGuestAuthToken();
  const response = await postJson(
    'guests/brands/list',
    {
      bs_strict: true,
    },
    true,
    {},
    guestToken,
    'getBrands',
    TOKEN_SCOPE.GUEST
  );

  const brands = getResponseDataList(response, 'brands');
  return brands;
};

export const getStyles = async () =>
  getAuthenticatedTaxonomyList({
    path: 'v3/users/styles/list',
    responseKey: 'styles',
    body: {
      max_results: 45,
      offset: 0,
      order_by: 'name ASC',
    },
    mockData: mockStyles,
    callerName: 'getStyles',
    authTokenResolver: resolveOperatorAuthToken,
    tokenScope: TOKEN_SCOPE.OPERATOR,
    withVersion: false,
  });

export const getColors = async () =>
  getAuthenticatedTaxonomyList({
    path: 'guests/colors/list',
    responseKey: 'colors',
    mockData: mockColors,
    callerName: 'getColors',
    authTokenResolver: resolveGuestAuthToken,
    tokenScope: TOKEN_SCOPE.GUEST,
  });

export const getMaterials = async () => {
  if (SWAP_USE_MOCK) {
    await delay();
    return mockMaterials;
  }

  const authToken = await resolveOperatorAuthToken();
  const materials = [];
  const seenMaterialIds = new Set();
  let nextOffset = DEFAULT_MATERIALS_LIST_PARAMS.offset;

  while (nextOffset >= 0) {
    const response = await postJson(
      'v3/users/materials/list',
      {
        ...DEFAULT_MATERIALS_LIST_PARAMS,
        offset: nextOffset,
      },
      false,
      {},
      authToken,
      'getMaterials',
      TOKEN_SCOPE.OPERATOR
    );

    const pageMaterials = Array.isArray(response?.materials) ? response.materials : EMPTY_ARRAY;
    pageMaterials.forEach((material) => {
      const materialId = String(material?.id || '');
      const dedupeKey = materialId || JSON.stringify(material);
      if (!seenMaterialIds.has(dedupeKey)) {
        seenMaterialIds.add(dedupeKey);
        materials.push(material);
      }
    });

    const resolvedNextOffset = Number(response?.next_offset);
    if (Number.isFinite(resolvedNextOffset) && resolvedNextOffset >= 0) {
      nextOffset = resolvedNextOffset;
      continue;
    }

    const totalCount = Number(response?.total_count);
    const resultCount = Number(response?.result_count);
    if (Number.isFinite(totalCount) && materials.length < totalCount && Number.isFinite(resultCount) && resultCount > 0) {
      nextOffset += resultCount;
      continue;
    }

    break;
  }

  return materials;
};

export const getMadeIns = async () =>
  getAuthenticatedTaxonomyList({
    path: 'v3/users/made-ins/list',
    responseKey: 'made_ins',
    mockData: mockMadeIns,
    callerName: 'getMadeIns',
    authTokenResolver: resolveOperatorAuthToken,
    tokenScope: TOKEN_SCOPE.OPERATOR,
    withVersion: false,
  });

export const getOccasions = async () =>
  getAuthenticatedTaxonomyList({
    path: 'v3/users/occasions/list',
    responseKey: 'occasions',
    body: {
      max_results: 100,
      offset: 0,
    },
    mockData: mockOccasions,
    callerName: 'getOccasions',
    authTokenResolver: resolveOperatorAuthToken,
    tokenScope: TOKEN_SCOPE.OPERATOR,
    withVersion: false,
  });

export const getSizes = async () =>
  getAuthenticatedTaxonomyList({
    path: 'guests/sizes/list',
    responseKey: 'sizes',
    mockData: mockSizes,
    callerName: 'getSizes',
    authTokenResolver: resolveGuestAuthToken,
    tokenScope: TOKEN_SCOPE.GUEST,
  });

export const getCategories = async () => {
  if (SWAP_USE_MOCK) {
    await delay();
    return mockCategories;
  }

  const guestToken = await resolveGuestAuthToken();
  const response = await postJson(
    'guests/categories/list',
    {},
    true,
    {},
    guestToken,
    'getCategories',
    TOKEN_SCOPE.GUEST
  );

  const categories = getResponseDataList(response, 'categories');
  return categories;
};

export const getUserSegments = async () => {
  if (SWAP_USE_MOCK) {
    await delay();
    return mockUserSegments;
  }

  const guestToken = await resolveGuestAuthToken();
  const response = await postJson(
    'guests/user-segments/list',
    DEFAULT_TAXONOMY_LIST_PARAMS,
    true,
    {},
    guestToken,
    'getUserSegments',
    TOKEN_SCOPE.GUEST
  );

  const userSegments = getResponseDataList(response, 'user_segments');
  return userSegments;
};

export const getItemEntryOptions = async () => {
  await delay(0);
  return {
    categoryOptions,
    conditionOptions,
    brandOptions: mockBrands,
    userSegmentOptions: mockUserSegments,
    styleOptions: mockStyles,
    sizeOptions: mockSizes,
    materialOptions: mockMaterials,
    madeInOptions: mockMadeIns,
    occasionOptions: mockOccasions,
  };
};

export const getInspectionProducts = async ({ customerEmail = '', authToken = '' } = {}) => {
  if (SWAP_USE_MOCK) {
    await delay();
    return mockSwapProducts;
  }

  const response = await getCustomerUnreviewedItems({ customerEmail, authToken });
  return getCustomerItemsListData(response).items || EMPTY_ARRAY;
};

export const getBoothProducts = async () => {
  if (BOOTH_USE_MOCK) {
    await delay();
    return boothProductsStore.map(formatBoothProduct);
  }

  const response = await fetchBoothProducts({});
  return response.products;
};

const extractAuthSession = (response, fallbackToken = '') => {
  const success = response?.success || {};
  const data = success?.data || {};
  const customer = data?.customer || response?.customer || null;
  const token = data?.token || success?.token || response?.token || fallbackToken || '';

  return {
    token,
    user: customer,
    customer,
    response,
  };
};

const extractGuestSession = (response) => {
  const success = response?.success || {};
  const data = success?.data || {};
  const token = data?.guest_token || '';

  return {
    token,
    guestToken: token,
    sessionId: data?.session_id || '',
    clientIp: data?.client_ip || '',
    exp: data?.exp || null,
    stateHash: data?.state_hash ?? null,
    user: null,
    customer: null,
    response,
  };
};

export const getSellerBooths = async ({
  status = 'pending',
  cycle = 'all',
  search = '',
  page = 1,
  perPage = 50,
} = {}) => {
  if (BOOTH_USE_MOCK) {
    await delay();
    const query = search.trim().toLowerCase();
    const summaries = mockSellerBooths
      .map(getBoothSummary)
      .filter((booth) => {
        if (status && booth.status !== status) {
          return false;
        }

        if (cycle !== 'all' && booth.cycle !== cycle) {
          return false;
        }

        if (!query) {
          return true;
        }

        return (
          booth.name.toLowerCase().includes(query) ||
          booth.business_name?.toLowerCase().includes(query) ||
          booth.seller.toLowerCase().includes(query)
        );
      });

    const totalCount = summaries.length;
    const start = Math.max(0, (page - 1) * perPage);
    return {
      booths: summaries.slice(start, start + perPage),
      totalCount,
    };
  }

  const clauses = [];

  if (status === 'pending') {
    clauses.push({ is_verified: false });
  } else if (status === 'approved') {
    clauses.push({ is_verified: true });
  } else if (status === 'inactive') {
    clauses.push({ is_inactive: true });
  }

  const dateFilter = buildLiveBoothDateFilter(cycle);
  if (dateFilter) {
    clauses.push(dateFilter);
  }

  const query = search.trim();
  if (query) {
    clauses.push({
      _or: [
        { name_contains: query },
        { business_name_contains: query },
        { user: { first_name_contains: query } },
        { user: { last_name_contains: query } },
      ],
    });
  }

  const where = clauses.length === 0 ? {} : clauses.length === 1 ? clauses[0] : { _and: clauses };
  const response = await fetchSellerBooths({ where, start: Math.max(0, (page - 1) * perPage), limit: perPage });

  return {
    booths: response.booths.map((booth) => ({
      ...booth,
      seller: getSellerName(booth),
      items: Array.isArray(booth.booth_products) ? booth.booth_products.length : 0,
      status: booth.is_inactive ? 'inactive' : booth.is_verified ? 'approved' : 'pending',
      cycle: getBoothCycle(booth),
    })),
    totalCount: response.totalCount,
  };
};

export const getBoothProductsByFilter = async ({ boothId, status, search = '' } = {}) => {
  if (BOOTH_USE_MOCK) {
    await delay();
    const query = search.trim().toLowerCase();
    const products = boothProductsStore
      .filter((product) => (boothId ? String(product.seller_booth?.id) === String(boothId) : true))
      .filter((product) => (status ? getBoothProductStatus(product) === status : true))
      .filter((product) => {
        if (!query) {
          return true;
        }

        const formatted = formatBoothProduct(product);
        return formatted.name.toLowerCase().includes(query) || formatted.code.toLowerCase().includes(query);
      })
      .map(formatBoothProduct);

    const booth = mockSellerBooths.find((item) => String(item.id) === String(boothId));
    const counts = boothProductsStore
      .filter((product) => String(product.seller_booth?.id) === String(boothId))
      .reduce(
        (summary, product) => {
          summary.total += 1;
          summary[getBoothProductStatus(product)] += 1;
          return summary;
        },
        { total: 0, pending: 0, approved: 0, sold: 0, rejected: 0, returned: 0 }
      );

    return {
      booth: booth ? getBoothSummary(booth) : null,
      products,
      counts,
    };
  }

  const boothResponse = await fetchSellerBooths({ where: { id: boothId }, start: 0, limit: 1 });
  const booth = boothResponse.booths?.[0] || null;
  const productWhere = { seller_booth: boothId };

  if (status === 'pending') {
    Object.assign(productWhere, { manual_review_passed: false, rejected: false, returned_to_seller: false, sold: false });
  } else if (status === 'approved') {
    Object.assign(productWhere, { manual_review_passed: true, rejected: false, returned_to_seller: false, sold: false });
  } else if (status === 'sold') {
    Object.assign(productWhere, { sold: true });
  } else if (status === 'rejected') {
    Object.assign(productWhere, { rejected: true });
  }

  const productsResponse = await fetchBoothProducts(productWhere);
  const counts = await fetchBoothProductStatusCounts(boothId);
  const returnedResponse = await fetchBoothProducts({ seller_booth: boothId, returned_to_seller: true });
  const filteredProducts = search.trim()
    ? productsResponse.products.filter((product) => {
        const query = search.trim().toLowerCase();
        return product.name?.toLowerCase().includes(query) || product.code?.toLowerCase().includes(query);
      })
    : productsResponse.products;

  return {
    booth: booth
      ? {
          ...booth,
          seller: getSellerName(booth),
          items: Array.isArray(booth.booth_products) ? booth.booth_products.length : counts.total,
          status: booth.is_inactive ? 'inactive' : booth.is_verified ? 'approved' : 'pending',
          cycle: getBoothCycle(booth),
        }
      : null,
    products: filteredProducts,
    counts: {
      ...counts,
      returned: returnedResponse.totalCount,
    },
  };
};

export const getBoothProductById = async (idOrCode) => {
  if (BOOTH_USE_MOCK) {
    await delay();
    const productId = extractBoothProductIdFromCode(idOrCode) || idOrCode;
    const product = boothProductsStore.find((entry) => String(entry.id) === String(productId));
    return product ? formatBoothProduct(product) : null;
  }

  const productId = extractBoothProductIdFromCode(idOrCode) || idOrCode;
  return fetchBoothProductById(productId);
};

export const updateBoothProduct = async (id, updates) => {
  if (BOOTH_USE_MOCK) {
    await delay();
    boothProductsStore = boothProductsStore.map((product) => (String(product.id) === String(id) ? { ...product, ...updates } : product));
    const updated = boothProductsStore.find((product) => String(product.id) === String(id));
    return updated ? formatBoothProduct(updated) : null;
  }

  const updatedProduct = await mutateBoothProduct(id, updates);
  if (updates?.manual_review_passed && updatedProduct?.seller_booth?.id) {
    await mutateBooth(updatedProduct.seller_booth.id, { is_verified: true });
  }
  return updatedProduct;
};

export const getBoothPaymentMethods = async () => {
  if (BOOTH_USE_MOCK) {
    await delay();
    return mockBoothPaymentMethods;
  }

  return fetchBoothPaymentMethods();
};

export const createBoothCheckout = async (checkoutData) => {
  if (BOOTH_USE_MOCK) {
    await delay();
    const paymentMethod = mockBoothPaymentMethods.find((method) => method.id === checkoutData.Booth_payment_method) || null;
    const items = (checkoutData.items || [])
      .map((item) => {
        const product = boothProductsStore.find((entry) => String(entry.id) === String(item.booth_product));
        return product ? { quantity: item.quantity || 1, booth_product: product } : null;
      })
      .filter(Boolean);

    boothProductsStore = boothProductsStore.map((product) =>
      items.some((item) => String(item.booth_product.id) === String(product.id))
        ? { ...product, sold: true, stock_quantity: 0 }
        : product
    );

    const checkout = {
      id: String(4082 + boothCheckoutsStore.length),
      Cart_value: Number(checkoutData.Cart_value || 0),
      created_at: checkoutData.checkout_date || new Date().toISOString(),
      checkout_date: checkoutData.checkout_date || new Date().toISOString(),
      Booth_payment_method: paymentMethod,
      items,
    };

    boothCheckoutsStore = [checkout, ...boothCheckoutsStore];
    return formatBoothCheckout(checkout);
  }

  const checkout = await createLiveBoothCheckout(checkoutData);
  for (const item of checkoutData.items || []) {
    await markLiveProductSale(item.booth_product, item.quantity || 1);
  }
  return checkout;
};

export const getAllBoothCheckouts = async ({
  startDate,
  endDate,
  page = 1,
  perPage = 50,
} = {}) => {
  if (BOOTH_USE_MOCK) {
    await delay();
    const filtered = boothCheckoutsStore.filter((checkout) => {
      const timestamp = new Date(checkout.checkout_date).getTime();
      if (startDate && timestamp < new Date(startDate).getTime()) {
        return false;
      }
      if (endDate && timestamp > new Date(endDate).getTime()) {
        return false;
      }
      return true;
    });

    const totalCount = filtered.length;
    const totalCartValue = filtered.reduce((sum, checkout) => sum + Number(checkout.Cart_value || 0), 0);
    const totalItemsSold = filtered.reduce(
      (sum, checkout) => sum + (checkout.items || []).reduce((itemSum, item) => itemSum + Number(item.quantity || 0), 0),
      0
    );
    const start = Math.max(0, (page - 1) * perPage);

    return {
      checkouts: filtered.slice(start, start + perPage).map(formatBoothCheckout),
      totalCount,
      aggregates: {
        totalCheckouts: totalCount,
        totalCartValue,
        totalItemsSold,
      },
    };
  }

  const where = {};
  if (startDate) {
    where.checkout_date_gte = startDate;
  }
  if (endDate) {
    where.checkout_date_lte = endDate;
  }
  return fetchAllBoothCheckouts({
    start: Math.max(0, (page - 1) * perPage),
    limit: perPage,
    sort: 'checkout_date:desc',
    where: Object.keys(where).length ? where : undefined,
  });
};

export const getBoothCheckout = async (id) => {
  if (BOOTH_USE_MOCK) {
    await delay();
    const checkout = boothCheckoutsStore.find((entry) => String(entry.id) === String(id));
    return { checkout: checkout ? formatBoothCheckout(checkout) : null };
  }

  return fetchBoothCheckout(id);
};

export const getPickupStatus = (pickup) => getMockPickupStatus(pickup);
export const formatRemainingItems = (count) => formatMockRemainingItems(count);

/**
 * API runtime configuration for diagnostics.
 */
export const swapApiConfig = {
  url: SWAP_API_URL,
  walletUrl: SWAP_WALLET_API_URL,
  version: SWAP_API_VERSION,
  useMock: SWAP_USE_MOCK,
  boothUseMock: BOOTH_USE_MOCK,
};
