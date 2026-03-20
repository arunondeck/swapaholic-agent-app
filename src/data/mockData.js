export const mockBoothProducts = [
  { id: 'BT-1021', name: 'Classic Denim Jacket', brand: "Levi's", size: 'M', price: '$42' },
  { id: 'BT-1022', name: 'Flow Midi Dress', brand: 'Zara', size: 'S', price: '$28' },
  { id: 'BT-1023', name: 'Vintage Tee', brand: 'Nike', size: 'L', price: '$19' },
];

export const mockSwapProducts = [
  { sku: 'SW-7004', name: 'Linen Shirt', status: 'Pending inspection', points: '-' },
  { sku: 'SW-7005', name: 'Cargo Pants', status: 'Inspected', points: '45 pts' },
  { sku: 'SW-7006', name: 'Wool Cardigan', status: 'Approved by customer', points: '55 pts' },
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

const defaultCustomer = {
  name: 'Ava Shah',
  email: 'ava.shah@swapaholic.com',
  points: '420 pts',
  activePackage: 'Power Swap - 4 pickups / month',
  pointsExpiryDate: '30 Apr 2026',
  itemsSwappedIn: 14,
  itemsSwappedOut: 9,
  ordersMade: 6,
  subscriptions: customerSubscriptions,
  pickups: customerPickups,
  orders: customerOrders,
  swappedInItems: customerSwappedInItems,
  checkoutCart: customerCheckoutCart,
};

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
