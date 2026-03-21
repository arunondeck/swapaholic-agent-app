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

const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

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
 * Loginascustomer - to use when customer email is provided to set the token and get customer data.
 * @param {string} email
 * @returns {Promise<SwapLoginResponse>}
 */
export const loginAsCustomer = async (email) => {
  await delay();
  const customer = getCustomerProfile(email);
  return toLoginPayload(customer);
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
 * Get details of customersubscription.
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
 * reviewproduct - to use in approve. Review products.
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
 * Get list of subscriptions.
 * @returns {Promise<Array<{ id: string, name: string, validity_c?: string, number_of_items_c?: string, price_c?: string, type_c?: string, status_c?: string }>>}
 */
export const getSubscriptionsList = async () => {
  await delay();
  return swapSubscriptionCatalog;
};
