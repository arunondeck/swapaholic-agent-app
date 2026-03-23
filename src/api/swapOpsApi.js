import {
  customerOrders,
  customerPickups,
  customerSubscriptions,
  customerSuccessData,
  getCustomerPickup,
  getCustomerProfile,
  getCustomerSubscription,
  mockProductReviews,
  mockSwapProducts,
  swapSubscriptionCatalog,
} from '../data/mockData';

/**
 * @typedef {import('../data/mockData').SwapCustomer} SwapCustomer
 */

/**
 * @typedef {{ token: string, customer: SwapCustomer, state_hash: null }} SwapLoginResponse
 */

/**
 * @typedef {{ id: string, status: string, date: string, itemCount: string, total: string }} SwapOrder
 */

/**
 * @typedef {{ id: string, subscriptionId: string, date: string, address: string, totalItems: number, remainingItems: number, items: Array<Record<string, string>> }} SwapPickup
 */

/**
 * @typedef {{ id: string, plan: string, status: string, startDate: string, renewalDate: string, itemsRemaining: number, items: Array<Record<string, string>> }} SwapSubscription
 */

/**
 * @typedef {{ id: string, productId: string, action: 'approve' | 'reject', status: string, reviewedBy: string, reviewedAt: string, notes: string }} SwapReviewResponse
 */

/**
 * @typedef {'SWAP.SUB.TYPE.ITEMS.STORE' | 'SWAP.SUB.TYPE.POINTS.SHOP' | 'SWAP.SUB.TYPE.CONVERSIONS.SHOP'} SwapSubscriptionTenancy
 */

/**
 * @typedef {{ customerId: string, subscribeType?: 'shop' | 'store' | 'event', ignoreNonPickupSubscribe?: boolean }} SwapSubscribesRequest
 */

/**
 * @typedef {{ pickupId: string, maxResults?: number, offset?: number, filters?: Array<Record<string, unknown>> }} SwapPickupItemsRequest
 */

/**
 * @typedef {{ maxResults?: number, offset?: number, filters?: Array<Record<string, unknown>> }} SwapUnreviewedItemsRequest
 */

/**
 * @typedef {{ pickupId: string, thumbnailFile: Blob | { uri: string, name?: string, type?: string } }} SwapAddItemRequest
 */

/**
 * API response envelope.
 * @typedef {{ status: boolean, success: Record<string, unknown>, error: unknown, status_code: number }} SwapApiEnvelope
 */

/**
 * Creates an async delay used by mock-mode endpoints.
 * @param {number} [ms=150]
 * @returns {Promise<void>}
 */
const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

const SWAP_API_URL = (process.env.EXPO_PUBLIC_SWAP_API_URL || '').replace(/\/$/, '');
const SWAP_API_VERSION = process.env.EXPO_PUBLIC_SWAP_API_VERSION || 'v3';
const SWAP_USE_MOCK = (process.env.EXPO_PUBLIC_SWAP_USE_MOCK || 'true').toLowerCase() === 'true';

/**
 * Maps local customer profile data to the login response payload shape.
 * @param {ReturnType<typeof getCustomerProfile>} customer
 * @returns {SwapLoginResponse}
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
    throw new Error('EXPO_PUBLIC_SWAP_API_URL is required when EXPO_PUBLIC_SWAP_USE_MOCK is false.');
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

/**
 * Sends a POST request with JSON payload.
 * @param {string} path
 * @param {Record<string, unknown>} body
 * @param {boolean} [withVersion=true]
 * @returns {Promise<Record<string, unknown>>}
 */
const postJson = async (path, body, withVersion = true) => {
  const response = await fetch(buildUrl(path, withVersion), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Swap API request failed (${response.status}): ${errorText}`);
  }

  return response.json();
};

/**
 * Sends a POST request with multipart/form-data payload.
 * @param {string} path
 * @param {FormData} formData
 * @param {boolean} [withVersion=true]
 * @returns {Promise<Record<string, unknown>>}
 */
const postFormData = async (path, formData, withVersion = true) => {
  const response = await fetch(buildUrl(path, withVersion), {
    method: 'POST',
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
 * @param {SwapSubscriptionTenancy} tenancy
 * @returns {SwapApiEnvelope}
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
 * @returns {SwapApiEnvelope}
 */
const toMockCustomerDetailResponse = (customerId = customerSuccessData.customer.id) => ({
  status: true,
  success: {
    code: 'CUS-001',
    message: 'Customer fetched',
    data: {
      customer: {
        ...customerSuccessData.customer,
        id: customerId,
        subscribes_list: customerSubscriptions.map((subscription) => ({
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
          shop: Number.parseInt(customerSuccessData.customer.total_items_surrendered_c || '0', 10),
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
 * Login as customer using email.
 * Endpoint: POST /{api_ver}/yHncKdVLF2/customers/mime/login/email/3BCB2
 * Request: { email_c: string }
 * Returns a token and customer profile. In mock mode this maps to local customer data.
 * @param {string} email
 * @returns {Promise<SwapLoginResponse | Record<string, unknown>>}
 */
export const loginAsCustomer = async (email) => {
  if (SWAP_USE_MOCK) {
    await delay();
    const customer = getCustomerProfile(email);
    return toLoginPayload(customer);
  }

  return postJson('yHncKdVLF2/customers/mime/login/email/3BCB2', { email_c: email });
};

/**
 * Get customer orders.
 * @param {string} email
 * @returns {Promise<SwapOrder[]>}
 */
export const getCustomerOrders = async (email) => {
  await delay();
  return getCustomerProfile(email).orders || customerOrders;
};

/**
 * Get customer subscriptions.
 * @param {string} email
 * @returns {Promise<SwapSubscription[]>}
 */
export const getCustomerSubscriptions = async (email) => {
  await delay();
  return getCustomerProfile(email).subscriptions || customerSubscriptions;
};

/**
 * Get customer pickups.
 * @param {string} email
 * @returns {Promise<SwapPickup[]>}
 */
export const getCustomerPickups = async (email) => {
  await delay();
  return getCustomerProfile(email).pickups || customerPickups;
};

/**
 * Get details of customer subscription.
 * @param {string} email
 * @param {string} subscriptionId
 * @returns {Promise<SwapSubscription>}
 */
export const getCustomerSubscriptionDetails = async (email, subscriptionId) => {
  await delay();
  return getCustomerSubscription(email, subscriptionId);
};

/**
 * Get details of customer pickup.
 * @param {string} email
 * @param {string} pickupId
 * @returns {Promise<SwapPickup>}
 */
export const getCustomerPickupDetails = async (email, pickupId) => {
  await delay();
  return getCustomerPickup(email, pickupId);
};

/**
 * Review product with approve/reject action.
 * @param {{ productId: string, action: 'approve' | 'reject', notes?: string, reviewedBy?: string }} params
 * @returns {Promise<SwapReviewResponse>}
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
 * @param {SwapSubscriptionTenancy} tenancy
 * @returns {Promise<SwapApiEnvelope | Record<string, unknown>>}
 */
export const getSubscriptionsList = async (tenancy = 'SWAP.SUB.TYPE.ITEMS.STORE') => {
  if (SWAP_USE_MOCK) {
    await delay();
    return toMockSubscriptionListResponse(tenancy);
  }

  return postJson('subscriptions/list', { tenancy });
};

/**
 * Get customer subscribes list using customer id returned by login API.
 * Endpoint: POST /{api_ver}/subscribes/list
 * @param {SwapSubscribesRequest} params
 * @returns {Promise<SwapApiEnvelope | Record<string, unknown>>}
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
          subscribes: toMockCustomerDetailResponse(customerId).success.data.customer.subscribes_list,
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
 * @returns {Promise<SwapApiEnvelope | Record<string, unknown>>}
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
 * @param {SwapPickupItemsRequest} params
 * @returns {Promise<SwapApiEnvelope | Record<string, unknown>>}
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
 * @param {SwapUnreviewedItemsRequest} params
 * @returns {Promise<SwapApiEnvelope | Record<string, unknown>>}
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
 * Add item to customer pickup.
 * Endpoint: POST /v3/users/customer-items/init
 * @param {SwapAddItemRequest} params
 * @returns {Promise<SwapApiEnvelope | Record<string, unknown>>}
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

/**
 * API runtime configuration for diagnostics.
 */
export const swapApiConfig = {
  url: SWAP_API_URL,
  version: SWAP_API_VERSION,
  useMock: SWAP_USE_MOCK,
};
