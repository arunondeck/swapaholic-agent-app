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
  mockBoothProducts,
  mockProductReviews,
  mockSwapProducts,
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
import { getCachedStoredAppSession, getStoredShopToken } from '../store/appSessionStorage';
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
const APP_LOGIN_PATH = 'guests/customers/get-started';
const APP_GUEST_REGISTER_PATH = 'guests/register';
const APP_LOGIN_TENANCY = 'SWAP.AUTH.TYPE.EMAIL';
const SWAP_ORDER_CREATE_PATH = 'orders/init';
const EMPTY_ARRAY = [];
const customerSessionCache = new Map();
let boothProductsStore = mockBoothProducts.map((product) => ({ ...product }));
let boothCheckoutsStore = mockBoothCheckouts.map((checkout) => ({
  ...checkout,
  items: (checkout.items || []).map((item) => ({ ...item })),
}));
let customerOrdersStore = customerOrders.map((order) => ({ ...order }));

const getResponseData = (response) => response?.success?.data || {};

const getResponseError = (response) => response?.error || null;

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

const mapApiSubscribeToSubscription = (subscription) => ({
  id: subscription.id,
  plan: subscription.subscription?.name || subscription.name || 'Subscription',
  status: subscription.status_c || 'Unknown',
  startDate: subscription.date_entered || 'NA',
  renewalDate: subscription.expiry_date_c || 'NA',
  itemsRemaining: toNumber(subscription.number_of_items_c),
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

const mapApiPickupToPickup = (pickup) => ({
  id: pickup?.id || pickup?.pickup_id_c || '',
  subscriptionId: pickup?.subscribe_id_c || pickup?.subscription_id_c || '',
  date: pickup?.date_entered || pickup?.pickup_date_c || 'NA',
  address: pickup?.pickup_address_c || pickup?.address_c || 'NA',
  totalItems: toNumber(pickup?.number_of_items_c),
  remainingItems: toNumber(pickup?.remaining_items_c, toNumber(pickup?.number_of_items_c)),
  items: pickup?.items || EMPTY_ARRAY,
});

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

const withSwapAuthHeader = async (headers = {}) => {
  if (headers.Authorization) {
    return headers;
  }

  const token = getCachedStoredAppSession()?.shopToken || (await getStoredShopToken());
  return token ? { ...headers, Authorization: `Bearer ${token}` } : headers;
};

/**
 * Sends a POST request with JSON payload.
 * @param {string} path
 * @param {Record<string, unknown>} body
 * @param {boolean} [withVersion=true]
 * @returns {Promise<Record<string, unknown>>}
 */
const postJson = async (path, body, withVersion = true, extraHeaders = {}) => {
  const headers = await withSwapAuthHeader({
    'Content-Type': 'application/json',
    ...extraHeaders,
  });

  const response = await fetch(buildUrl(path, withVersion), {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Swap API request failed (${response.status}): ${errorText}`);
  }

  return response.json();
};

const getJson = async (url, headers = {}) => {
  const requestHeaders = await withSwapAuthHeader(headers);
  const response = await fetch(url, {
    method: 'GET',
    headers: requestHeaders,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Swap API request failed (${response.status}): ${errorText}`);
  }

  return response.json();
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
  if (response?.status === false) {
    const error = getResponseError(response);
    throw new Error(error?.message || 'Something went wrong');
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
const postFormData = async (path, formData, withVersion = true) => {
  const headers = await withSwapAuthHeader();
  const response = await fetch(buildUrl(path, withVersion), {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Swap API request failed (${response.status}): ${errorText}`);
  }

  return response.json();
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
    const response = await postJson(path, payload);
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
    authToken ? { Authorization: `Bearer ${authToken}` } : {}
  );

  const session = extractAuthSession(response);
  if (!session.token) {
    throw new Error('Login failed: no token received.');
  }

  return session;
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

  const response = await postJson(APP_GUEST_REGISTER_PATH, {});
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
    }
  );

  if (!response?.status) {
    const message = response?.error?.message || response?.success?.message || 'Session expired.';
    throw new Error(message);
  }

  return extractAuthSession(response, token);
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

  return getJson(buildWalletUrl('v1/wallet/get/balances'), token ? { Authorization: `Bearer ${token}` } : {});
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

export const authenticateCustomer = async (email) => {
  if (SWAP_USE_MOCK) {
    await delay();
    return {
      email,
      loginResponse: toLoginPayload(getMockCustomerProfile(email)),
      profile: getMockCustomerProfile(email),
      walletResponse: await getWalletBalances('', email),
    };
  }

  return createCustomerSession(email);
};

/**
 * Get customer orders.
 * @param {string} email
 * @returns {Promise<import('../types/swapTypes').SwapCustomerOrder[]>}
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

  return EMPTY_ARRAY;
};

/**
 * Create a swap order.
 * Endpoint: POST /{api_ver}/orders/init
 * @param {import('../types/swapTypes').SwapOrderCreateRequest} orderData
 * @returns {Promise<import('../types/swapTypes').SwapApiEnvelope<import('../types/swapTypes').SwapOrderCreateResponseData>>}
 */
export const createSwapOrder = async (orderData) => {
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

  return postJson(SWAP_ORDER_CREATE_PATH, orderData);
};

/**
 * Places a customer order for the swap checkout flow.
 * @param {{ email: string, items: Array<{ id?: string, name?: string, sku?: string, points?: string | number }>, paymentMethod: 'cash' | 'card' | 'paynow', subscribeId?: string }} orderData
 * @returns {Promise<import('../types/swapTypes').SwapCustomerOrder>}
 */
export const placeCustomerOrder = async ({ email, items = [], paymentMethod, subscribeId = '' }) => {
  const eligibleItems = items.filter((item) => item?.id && !String(item.id).startsWith('manual-'));

  if (subscribeId && eligibleItems.length === items.length && eligibleItems.length > 0) {
    const response = await createSwapOrder({
      subscribe_id_c: subscribeId,
      customer_address_id_c: '',
      items: eligibleItems.map((item) => ({
        id: item.id,
        evaluated_points_c: String(Number.parseInt(String(item.points || '0').replace(/[^\d-]/g, ''), 10) || 0),
      })),
      customer_address: '.',
    });

    const data = assertSwapSuccess(response);
    const createdOrder = data?.order;
    const totalPoints = Number.parseInt(createdOrder?.order_cost_c || '0', 10) || 0;
    const itemCount = Number.parseInt(createdOrder?.total_items_c || '0', 10) || eligibleItems.length;

    return {
      id: createdOrder?.unique_id_c || createdOrder?.id || `ORD-${Date.now()}`,
      status: createdOrder?.status_c || 'Placed',
      date: createdOrder?.order_date_c || new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date()),
      itemCount: `${itemCount} item${itemCount === 1 ? '' : 's'}`,
      total: `${totalPoints} pts`,
      paymentMethod,
      email,
    };
  }

  if (!SWAP_USE_MOCK) {
    throw new Error('Swap order placement requires product ids and a subscribe id.');
  }

  await delay();

  const totalPoints = (items || []).reduce((sum, item) => {
    const value = Number.parseInt(String(item?.points || '0').replace(/[^\d-]/g, ''), 10);
    return sum + (Number.isNaN(value) ? 0 : value);
  }, 0);

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
};

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
  const loginResponse = session?.loginResponse;
  const customerId = loginResponse?.customer?.id;

  if (!customerId) {
    return EMPTY_ARRAY;
  }

  const response = await getCustomerSubscribesList({ customerId });
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
  const customerId = session?.loginResponse?.customer?.id;

  if (!customerId) {
    return EMPTY_ARRAY;
  }

  const response = await getCustomerSubscribesList({
    customerId,
    subscribeType: 'shop',
    ignoreNonPickupSubscribe: true,
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

  const session = await createCustomerSession(email);
  const customerId = session?.loginResponse?.customer?.id;

  if (!customerId) {
    return EMPTY_ARRAY;
  }

  const response = await postJson('pickups/list', {
    tenancy: 'SWAP.PICKUPS.GET.CUST_ID',
    customer_id_c: customerId,
    max_results: 100,
    offset: 0,
  });

  return (getResponseData(response).pickups || []).map(mapApiPickupToPickup);
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
  const customerId = session?.loginResponse?.customer?.id;

  if (!customerId) {
    return null;
  }

  const response = await postJson('subscribes/get', {
    tenancy: 'SWAP.SUBSCRIBE.GET.BY_ID',
    customer_id_c: customerId,
    subscribe_id_c: subscriptionId,
    fetch_items: true,
  });

  const subscription = getResponseData(response).subscribe || getResponseData(response).subscription || null;

  if (!subscription) {
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
 * @returns {Promise<import('../types/swapTypes').SwapPickup>}
 */
export const getCustomerPickupDetails = async (email, pickupId) => {
  if (SWAP_USE_MOCK) {
    await delay();
    return getMockCustomerPickup(email, pickupId);
  }

  const pickups = await getCustomerPickups(email);
  return pickups.find((pickup) => pickup.id === pickupId) || pickups[0] || null;
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
 * Request: { tenancy: 'SWAP.SUB.TYPE.ITEMS.STORE' | 'SWAP.SUB.TYPE.POINTS.SHOP' | 'SWAP.SUB.TYPE.CONVERSIONS.SHOP' }
 * @param {import('../types/swapTypes').SwapSubscriptionTenancy} tenancy
 * @returns {Promise<import('../types/swapTypes').SwapApiEnvelope<Record<string, unknown>> | Record<string, unknown>>}
 */
export const getSubscriptionsList = async (tenancy = 'SWAP.SUB.TYPE.ITEMS.STORE') => {
  if (SWAP_USE_MOCK) {
    await delay();
    return toMockSubscriptionListResponse(tenancy);
  }

  return postJson('subscriptions/list', { tenancy });
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

  return postJson('subscribes/list', {
    tenancy: 'SWAP.SUBSCRIBE.GET.CUST_ID',
    customer_id_c: customerId,
    subscribe_type_c: subscribeType,
    ignore_non_pickup_subscribe: ignoreNonPickupSubscribe,
  });
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

  return postJson('customers/get', {
    data_tenancy: 'SWAP.CUSTOMER.DATA_VIEW.DETAIL_PROTECTED',
    detail_tenancy: 'SWAP.CUSTOMER.DETAIL_VIEW.TOKEN',
    fetch_subscription: 'true',
    fetch_pending_subscribe: 'true',
    ignore_non_pickup_subscribe: 'true',
    reset_cache: true,
    fetch_wallets: true,
    fetch_subscribe_list: true,
  });
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
  );
};

/**
 * Get customer unreviewed/unconfirmed items.
 * Endpoint: POST /{api_ver}/customer-items/list
 * @param {import('../types/swapTypes').SwapUnreviewedItemsRequest} params
 * @returns {Promise<import('../types/swapTypes').SwapApiEnvelope<Record<string, unknown>> | Record<string, unknown>>}
 */
export const getCustomerUnreviewedItems = async ({ maxResults = 21, offset = 0, filters = [] } = {}) => {
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

  return postJson('customer-items/list', {
    parent_filter_tenancy: 'SWAP.ITEM.PARENT_FILTER.CUSTOMER.UNCONFIRMED',
    view_tenancy: 'SWAP.ITEM.IMAGE_VIEW.UNCONFIRMED_LIST',
    parent_filter: '',
    max_results: maxResults,
    offset,
    filters,
    sort: 'SWAP.ITEM.SORT.DATE.RECENT',
  });
};

/**
 * Review a customer item in swap flow.
 * Endpoint: POST /v4/customer-items/review/item
 * @param {import('../types/swapTypes').SwapReviewItemRequest} params
 * @returns {Promise<import('../types/swapTypes').SwapApiEnvelope<import('../types/swapTypes').SwapProduct> | Record<string, unknown>>}
 */
export const reviewCustomerItem = async ({ id, status_c }) => {
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

  return postJson(
    'v4/customer-items/review/item',
    {
      id,
      status_c,
    },
    false
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
    return {
      status: true,
      success: {
        code: 'ITEM-201',
        message: 'Customer item created',
        data: {
          id: `ITEM-${Date.now()}`,
          pickup_id_c: pickupId,
        },
      },
      error: null,
      status_code: 200,
    };
  }

  const formData = new FormData();
  formData.append('pickup_id_c', pickupId);
  formData.append('thumbnail_c', thumbnailFile);

  return postFormData('users/customer-items/init', formData, false);
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
 * @returns {Promise<{ sku: string, name: string, size: string, points: string } | null>}
 */
export const findProductByQrCode = async (email, scanText) => {
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

  // Stub for live API integration.
  // TODO: Replace with endpoint when product lookup API is available.
  return null;
};

export const getSwapPlans = async () => {
  if (SWAP_USE_MOCK) {
    await delay();
    return plans;
  }

  const subscriptions = await getAllSubscriptions();
  return subscriptions.map(formatPlanLabel);
};

export const getItemEntryOptions = async () => {
  await delay(0);
  return {
    categoryOptions,
    colorOptions,
    conditionOptions,
  };
};

export const getInspectionProducts = async () => {
  if (SWAP_USE_MOCK) {
    await delay();
    return mockSwapProducts;
  }

  const response = await getCustomerUnreviewedItems();
  return getResponseData(response).items || EMPTY_ARRAY;
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
