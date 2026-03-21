export const mockBoothProducts = [
  { id: 'BT-1021', name: 'Classic Denim Jacket', brand: "Levi's", size: 'M', price: '$42' },
  { id: 'BT-1022', name: 'Flow Midi Dress', brand: 'Zara', size: 'S', price: '$28' },
  { id: 'BT-1023', name: 'Vintage Tee', brand: 'Nike', size: 'L', price: '$19' },
];

/**
 * @typedef {Object} SwapNamedEntity
 * @property {string} id
 * @property {string} name
 */

/**
 * @typedef {SwapNamedEntity & {code_c?: string, google_product_category_c?: string}} SwapCategory
 * @typedef {SwapNamedEntity & {code_c?: string}} SwapColor
 * @typedef {SwapNamedEntity & {code_c?: string}} SwapStyle
 * @typedef {SwapNamedEntity & {us_size_c?: string, standard_c?: string, type_c?: string}} SwapSize
 * @typedef {SwapNamedEntity & {type_c?: string}} SwapCustomerInfo
 * @typedef {SwapNamedEntity & {tiled_collection_c?: string}} SwapCollection
 * @typedef {SwapNamedEntity & {subscribe_type_c?: string, status_c?: string}} SwapSubscribe
 */

/**
 * @typedef {Object} SwapImage
 * @property {string} id
 * @property {string} name
 * @property {string} type_c
 * @property {string} unique_id_c
 * @property {string} date_entered
 * @property {number} sequence_no
 */

/**
 * @typedef {Object} SwapProduct
 * @property {string} id
 * @property {string} name
 * @property {string} rubric_points_c
 * @property {string} evaluated_points_c
 * @property {string} markup_percentage_c
 * @property {string} markdown_percentage_c
 * @property {string} stage_c
 * @property {string} status_c
 * @property {string} sub_status_c
 * @property {string} location_c
 * @property {string} unique_item_id_c
 * @property {string} date_entered
 * @property {string} thumbnail_c
 * @property {string} available_c
 * @property {SwapImage[]} images
 * @property {SwapNamedEntity} brand
 * @property {SwapNamedEntity} occasion
 * @property {SwapSize} size
 * @property {SwapNamedEntity} made_in
 * @property {SwapStyle} style
 * @property {SwapColor} color
 * @property {SwapNamedEntity[]} materials
 * @property {SwapNamedEntity[]} policies
 * @property {SwapNamedEntity & {code_c?: string}} user_segment
 * @property {SwapCategory} category
 * @property {SwapCustomerInfo} customer
 * @property {SwapNamedEntity} pick_up
 * @property {SwapCollection[]} collections
 * @property {null | Record<string, unknown>} cart
 */

/**
 * @typedef {SwapNamedEntity & {
 *   validity_c?: string,
 *   number_of_items_c?: string,
 *   price_c?: string,
 *   type_c?: string,
 *   status_c?: string
 * }} SwapSubscriptionPlan
 */

/**
 * @typedef {SwapSubscribe & {
 *   number_of_items_c?: string,
 *   expiry_date_c?: string,
 *   number_of_accepted_items_c?: string,
 *   number_of_rejected_items_c?: string,
 *   items_swapped_c?: string,
 *   subscription?: SwapSubscriptionPlan | null
 * }} SwapCustomerSubscribe
 */

/**
 * @typedef {SwapCustomerInfo & {
 *   first_name_c?: string,
 *   last_name_c?: string,
 *   email_c?: string,
 *   mobile_c?: string,
 *   status_c?: string,
 *   total_items_surrendered_c?: string,
 *   total_items_swapped_c?: string,
 *   total_available_points_c?: string,
 *   subscribe?: SwapCustomerSubscribe | null,
 *   shop_subscribe?: SwapCustomerSubscribe | null,
 *   event_subscribe?: SwapCustomerSubscribe | null
 * }} SwapCustomer
 */

/**
 * @typedef {Object} SwapCustomerOrder
 * @property {string} id
 * @property {string} status
 * @property {string} date
 * @property {string} itemCount
 * @property {string} total
 */

/**
 * @typedef {Object} SwapCustomerPickup
 * @property {string} id
 * @property {string} subscriptionId
 * @property {string} date
 * @property {string} address
 * @property {number} totalItems
 * @property {number} remainingItems
 * @property {Array<Record<string, string>>} items
 */

/**
 * @typedef {Object} SwapProductReview
 * @property {string} id
 * @property {string} productId
 * @property {string} action
 * @property {string} status
 * @property {string} reviewedBy
 * @property {string} reviewedAt
 * @property {string} notes
 */

/** @type {SwapProduct[]} */
export const mockSwapProducts = [
  {
    id: '99aecefd-7daf-3888-2f5f-61fb95f2a026',
    name: 'Unbranded',
    rubric_points_c: '3',
    evaluated_points_c: '3',
    markup_percentage_c: '0',
    markdown_percentage_c: '0',
    stage_c: 'in_store',
    status_c: 'confirmation_pending',
    sub_status_c: 'published',
    location_c: 'S1-A2-E-4',
    unique_item_id_c: 'ITEM-1643877635-787',
    date_entered: '2022-02-03 08:40:35',
    thumbnail_c: 'https://s3.ap-southeast-1.amazonaws.com/cdn.xchangers/image_assets/customer_items_v3/ITEM-1643877635-787/operator-ORIGINAL',
    available_c: 'yes',
    images: [
      {
        id: 'b6e7369f-cb0b-04d1-3a17-61fcd2ac95fa',
        name: 'https://s3.ap-southeast-1.amazonaws.com/cdn.xchangers/image_assets/customer_items_v3/ITEM-1643877635-787/front-DISPLAY.png',
        type_c: 'high_resolution',
        unique_id_c: '',
        date_entered: '2022-02-04 07:16:01',
        sequence_no: 1,
      },
      {
        id: 'e1369df9-af42-65eb-cf51-61fcd2d8f717',
        name: 'https://s3.ap-southeast-1.amazonaws.com/cdn.xchangers/image_assets/customer_items_v3/ITEM-1643877635-787/side-DISPLAY.png',
        type_c: 'high_resolution',
        unique_id_c: '',
        date_entered: '2022-02-04 07:16:01',
        sequence_no: 2,
      },
    ],
    cart: null,
    brand: { id: 'af6f8417-7a35-a0db-6b70-5a0d7cfed187', name: 'Unbranded' },
    occasion: { id: '2458adf8-7d7f-2895-9436-5a0a8674eeea', name: 'Casual' },
    size: { id: 'acb143d2-37a5-677a-9eeb-5a2ba03ffa95', name: '12', us_size_c: '8', standard_c: 'M', type_c: 'item_women' },
    made_in: { id: 'e44b2021-7a5a-d798-8751-5a0557eca1a2', name: 'Unknown or Invalid Region' },
    style: { id: '699bdcb4-2eb6-cee6-aa42-5bb5f4ff1be6', name: 'Booty Shorts', code_c: 'BBS' },
    color: { id: '13c0d001-9851-2a48-3426-5a1ff1b25e95', name: 'Red', code_c: 'RE' },
    materials: [{ id: 'cf25bdea-1925-d10c-a128-5b7125077d2d', name: 'Unknown' }],
    policies: [
      { id: '1dccba66-8ebe-f856-4e98-5a0a93e769e9', name: 'Shipping' },
      { id: 'b6746100-90ea-6eff-2699-5a0a92abb3d1', name: 'Returnable' },
    ],
    user_segment: { id: '300a9cf6-6a59-aacc-23d3-5a059a517f72', name: 'WOMEN', code_c: 'W' },
    category: { id: '470dbf7b-7062-6f88-983e-5b190f657ec4', name: 'Shorts', google_product_category_c: '207', code_c: 'SH' },
    customer: { id: '27cdab02-1a33-9eac-98f1-606d0e9b4dfc', name: 'Swap Inv 2021', type_c: '' },
    pick_up: { id: '332f4ec3-1154-f095-f8d4-606d14d48074', name: 'Dropoff-Swap Inv 2021-Dropoff' },
    collections: [{ id: '5e3b3ee4-1729-23e1-39c5-63589e83142c', name: 'Relove At First Sight', tiled_collection_c: '' }],
  },
];

export const plans = [
  'Lite Swap - 1 pickup / month',
  'Standard Swap - 2 pickups / month',
  'Power Swap - 4 pickups / month',
];

export const categoryOptions = {
  Top: ['T-Shirt', 'Shirt', 'Blouse', 'Tank'],
  Dress: ['Mini Dress', 'Midi Dress', 'Maxi Dress'],
  Shorts: ['Denim Shorts', 'Tailored Shorts', 'Casual Shorts'],
  Skirt: ['Mini Skirt', 'Midi Skirt', 'Pleated Skirt'],
};

export const colorOptions = ['Black', 'White', 'Blue', 'Green', 'Pink', 'Beige'];
export const conditionOptions = ['New', 'Gently Used', 'Slight Damage'];

const createItem = ({
  id,
  brand,
  category,
  subcategory,
  size,
  points,
  material,
  color,
  condition,
  damage,
}) => ({
  id,
  brand,
  category,
  subcategory,
  size,
  points,
  material,
  color,
  condition,
  damage,
  image: `https://placehold.co/120x120/png?text=${encodeURIComponent(category)}`,
});

const pickupOneItems = [
  createItem({
    id: 'SIN-3301',
    brand: 'Zara',
    category: 'Dress',
    subcategory: 'Midi Dress',
    size: 'M',
    points: '40 pts',
    material: 'Cotton',
    color: 'Pink',
    condition: 'Gently Used',
    damage: 'None',
  }),
  createItem({
    id: 'SIN-3302',
    brand: 'H&M',
    category: 'Top',
    subcategory: 'Blouse',
    size: 'S',
    points: '25 pts',
    material: 'Rayon',
    color: 'White',
    condition: 'Gently Used',
    damage: 'None',
  }),
  createItem({
    id: 'SIN-3303',
    brand: 'Mango',
    category: 'Skirt',
    subcategory: 'Pleated Skirt',
    size: 'M',
    points: '30 pts',
    material: 'Polyester',
    color: 'Blue',
    condition: 'New',
    damage: 'None',
  }),
];

const pickupTwoItems = [
  createItem({
    id: 'SIN-3208',
    brand: 'Nike',
    category: 'Shorts',
    subcategory: 'Casual Shorts',
    size: 'M',
    points: '22 pts',
    material: 'Cotton',
    color: 'Black',
    condition: 'Gently Used',
    damage: 'None',
  }),
  createItem({
    id: 'SIN-3209',
    brand: 'Forever 21',
    category: 'Top',
    subcategory: 'T-Shirt',
    size: 'S',
    points: '18 pts',
    material: 'Cotton',
    color: 'Green',
    condition: 'Slight Damage',
    damage: 'Small stitch pull',
  }),
];

const subscriptionOneItems = [...pickupOneItems];
const subscriptionTwoItems = [...pickupTwoItems];

export const customerSubscriptions = [
  {
    id: 'SUB-2401',
    plan: 'Power Swap - 4 pickups / month',
    status: 'Active',
    startDate: '10 Mar 2026',
    renewalDate: '10 Apr 2026',
    itemsRemaining: 8,
    items: subscriptionOneItems,
  },
  {
    id: 'SUB-2217',
    plan: 'Standard Swap - 2 pickups / month',
    status: 'Completed',
    startDate: '10 Feb 2026',
    renewalDate: '10 Mar 2026',
    itemsRemaining: 0,
    items: subscriptionTwoItems,
  },
];

/** @type {SwapSubscriptionPlan[]} */
export const swapSubscriptionCatalog = [
  {
    id: 'PLAN-LITE',
    name: 'Lite Swap',
    validity_c: '1',
    number_of_items_c: '1',
    price_c: '899',
    type_c: 'monthly',
    status_c: 'active',
  },
  {
    id: 'PLAN-STANDARD',
    name: 'Standard Swap',
    validity_c: '1',
    number_of_items_c: '2',
    price_c: '1499',
    type_c: 'monthly',
    status_c: 'active',
  },
  {
    id: 'PLAN-POWER',
    name: 'Power Swap',
    validity_c: '1',
    number_of_items_c: '4',
    price_c: '2499',
    type_c: 'monthly',
    status_c: 'active',
  },
];

/** @type {SwapProductReview[]} */
export const mockProductReviews = [];

/** @type {SwapCustomerPickup[]} */
export const customerPickups = [
  {
    id: 'PK-9011',
    subscriptionId: 'SUB-2401',
    date: '24 Mar 2026',
    address: 'Indiranagar, Bengaluru',
    totalItems: 5,
    remainingItems: 2,
    items: pickupOneItems,
  },
  {
    id: 'PK-8942',
    subscriptionId: 'SUB-2217',
    date: '11 Mar 2026',
    address: 'Indiranagar, Bengaluru',
    totalItems: 2,
    remainingItems: 0,
    items: pickupTwoItems,
  },
];

/** @type {SwapCustomerOrder[]} */
export const customerOrders = [
  {
    id: 'ORD-8127',
    status: 'Packed',
    date: '18 Mar 2026',
    itemCount: '3 items',
    total: '135 pts',
  },
  {
    id: 'ORD-8038',
    status: 'Delivered',
    date: '02 Mar 2026',
    itemCount: '2 items',
    total: '90 pts',
  },
];

export const customerSwappedInItems = [...pickupOneItems, ...pickupTwoItems];

export const customerCheckoutCart = [
  { sku: 'SW-4410', name: 'Beige Utility Jacket', size: 'M', points: '55 pts' },
  { sku: 'SW-4418', name: 'Black Pleated Skirt', size: 'S', points: '45 pts' },
  { sku: 'SW-4426', name: 'Striped Knit Top', size: 'M', points: '30 pts' },
];

const shopSubscribe = {
  id: '53fa6412-5280-6332-a1ca-675d36531409',
  name: 'Calyn Koh-12-2024',
  subscribe_type_c: 'shop',
  status_c: 'active',
  number_of_items_c: '16',
  expiry_date_c: '2026-08-02 23:59:59',
  number_of_accepted_items_c: '16',
  number_of_rejected_items_c: '0',
  items_swapped_c: '36',
  subscription: {
    id: '5375c1af-c04e-d550-cd3e-5f43a5601eea',
    name: 'Flexi Swap Shopper',
    validity_c: '6',
    number_of_items_c: '1',
    price_c: '8',
    type_c: 'items',
    status_c: 'active',
  },
};

/** @type {{ token: string, customer: SwapCustomer, state_hash: null }} */
export const customerSuccessData = {
  token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.mock-token',
  customer: {
    id: 'a1db68ec-77e9-b8a7-7031-6720f3a27402',
    name: 'Calyn Koh',
    first_name_c: 'Calyn',
    last_name_c: 'Koh',
    type_c: '',
    email_c: 'calynkohkl@gmail.com',
    mobile_c: '+6597872901',
    status_c: 'active',
    total_items_surrendered_c: '16',
    total_items_swapped_c: '8',
    total_available_points_c: '0',
    subscribe: null,
    shop_subscribe: shopSubscribe,
    event_subscribe: null,
  },
  state_hash: null,
};

const mapApiCustomerToProfile = (apiCustomer) => ({
  id: apiCustomer.id,
  name: apiCustomer.name,
  email: apiCustomer.email_c || '',
  points: `${apiCustomer.total_available_points_c || '0'} pts`,
  activePackage: apiCustomer.shop_subscribe?.subscription?.name || 'No active package',
  pointsExpiryDate: apiCustomer.shop_subscribe?.expiry_date_c || 'NA',
  itemsSwappedIn: Number.parseInt(apiCustomer.total_items_surrendered_c || '0', 10),
  itemsSwappedOut: Number.parseInt(apiCustomer.total_items_swapped_c || '0', 10),
  ordersMade: customerOrders.length,
  customerSubscribe: {
    subscribe: apiCustomer.subscribe,
    shop_subscribe: apiCustomer.shop_subscribe,
    event_subscribe: apiCustomer.event_subscribe,
  },
  subscriptions: customerSubscriptions,
  pickups: customerPickups,
  orders: customerOrders,
  swappedInItems: customerSwappedInItems,
  checkoutCart: customerCheckoutCart,
});

const defaultCustomer = mapApiCustomerToProfile(customerSuccessData.customer);

export const customerDirectory = {
  [defaultCustomer.email]: defaultCustomer,
  'meera.iyer@swapaholic.com': {
    ...defaultCustomer,
    name: 'Meera Iyer',
    email: 'meera.iyer@swapaholic.com',
    points: '285 pts',
    activePackage: 'Standard Swap - 2 pickups / month',
    pointsExpiryDate: '12 May 2026',
    itemsSwappedIn: 11,
    itemsSwappedOut: 7,
    ordersMade: 4,
    subscriptions: [
      {
        id: 'SUB-2416',
        plan: 'Standard Swap - 2 pickups / month',
        status: 'Active',
        startDate: '12 Mar 2026',
        renewalDate: '12 Apr 2026',
        itemsRemaining: 3,
        items: [
          createItem({
            id: 'SIN-3410',
            brand: 'Uniqlo',
            category: 'Top',
            subcategory: 'Shirt',
            size: 'M',
            points: '24 pts',
            material: 'Cotton',
            color: 'White',
            condition: 'Gently Used',
            damage: 'None',
          }),
          createItem({
            id: 'SIN-3411',
            brand: 'Zudio',
            category: 'Skirt',
            subcategory: 'Mini Skirt',
            size: 'S',
            points: '20 pts',
            material: 'Denim',
            color: 'Blue',
            condition: 'Gently Used',
            damage: 'None',
          }),
        ],
      },
    ],
    pickups: [
      {
        id: 'PK-9020',
        subscriptionId: 'SUB-2416',
        date: '21 Mar 2026',
        address: 'Koramangala, Bengaluru',
        totalItems: 4,
        remainingItems: 1,
        items: [
          createItem({
            id: 'SIN-3410',
            brand: 'Uniqlo',
            category: 'Top',
            subcategory: 'Shirt',
            size: 'M',
            points: '24 pts',
            material: 'Cotton',
            color: 'White',
            condition: 'Gently Used',
            damage: 'None',
          }),
          createItem({
            id: 'SIN-3411',
            brand: 'Zudio',
            category: 'Skirt',
            subcategory: 'Mini Skirt',
            size: 'S',
            points: '20 pts',
            material: 'Denim',
            color: 'Blue',
            condition: 'Gently Used',
            damage: 'None',
          }),
          createItem({
            id: 'SIN-3412',
            brand: 'Only',
            category: 'Dress',
            subcategory: 'Mini Dress',
            size: 'M',
            points: '32 pts',
            material: 'Linen',
            color: 'Beige',
            condition: 'New',
            damage: 'None',
          }),
        ],
      },
    ],
  },
};

const titleCase = (value) =>
  value
    .split(/[.\-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export const getPickupStatus = (pickup) => (pickup.remainingItems === 0 ? 'Complete' : 'Incomplete');
export const formatRemainingItems = (count) => `${count} item${count === 1 ? '' : 's'}`;

export const getCustomerProfile = (email = '') => {
  const normalizedEmail = email.trim().toLowerCase();
  const exactMatch = customerDirectory[normalizedEmail];

  if (exactMatch) {
    return exactMatch;
  }

  const localPart = normalizedEmail.split('@')[0] || 'Customer';

  return {
    ...defaultCustomer,
    name: titleCase(localPart),
    email: normalizedEmail || defaultCustomer.email,
  };
};

export const getCustomerPickup = (email = '', pickupId = '') => {
  const customer = getCustomerProfile(email);
  return customer.pickups.find((pickup) => pickup.id === pickupId) || customer.pickups[0];
};

export const getCustomerSubscription = (email = '', subscriptionId = '') => {
  const customer = getCustomerProfile(email);
  return customer.subscriptions.find((subscription) => subscription.id === subscriptionId) || customer.subscriptions[0];
};
