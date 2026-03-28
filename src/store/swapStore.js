import { create } from 'zustand';
import {
  getActivePackageDetails,
  getAllSubscriptions,
  getCustomerOrderDetails,
  getCustomerOrders,
  getCustomerPickupDetails,
  getCustomerPickups,
  getCustomerProfile,
  getCustomerSubscriptionDetails,
  getCustomerSubscriptions,
  getCustomerSwappedInItems,
  getCustomerUnreviewedItems,
  getShopItemSubscriptions,
  getShopPointsSubscriptions,
} from '../api/swapOpsApi';

const CUSTOMER_CACHE_TTL_MS = 30 * 60 * 1000;

const normalizeEmail = (value = '') => String(value || '').trim().toLowerCase();

const createCacheEntry = (data = null, fetchedAt = 0) => ({
  data,
  loading: false,
  error: '',
  fetchedAt,
  invalidated: false,
});

const toLoadedEntry = (data) => createCacheEntry(data, Date.now());

const createCustomerDataCache = () => ({
  profile: createCacheEntry(null),
  activePackage: createCacheEntry(null),
  pickups: createCacheEntry([]),
  subscriptions: createCacheEntry([]),
  orders: createCacheEntry([]),
  swappedInItems: createCacheEntry([]),
  pickupDetailsById: {},
  subscriptionDetailsById: {},
  orderDetailsById: {},
  unreviewedItemsByKey: {},
});

const getCustomerOwnerKey = ({ email = '', customerId = '' } = {}) => String(customerId || normalizeEmail(email) || '');

export const buildCustomerUnreviewedItemsCacheKey = ({ maxResults = 21, offset = 0, filters = [] } = {}) =>
  JSON.stringify({
    maxResults,
    offset,
    filters: Array.isArray(filters) ? filters : [],
  });

const getEntryFromMap = (map, key) => map?.[key] || createCacheEntry(null);

const isCustomerCacheUsable = (entry, ttlMs = CUSTOMER_CACHE_TTL_MS) => {
  if (!entry || entry.invalidated || !entry.fetchedAt) {
    return false;
  }

  return Date.now() - entry.fetchedAt < ttlMs;
};

const invalidateEntry = (entry) => ({
  ...entry,
  invalidated: true,
});

const invalidateEntryMap = (map = {}) =>
  Object.fromEntries(Object.entries(map).map(([key, entry]) => [key, invalidateEntry(entry)]));

const getCustomerIdFromSession = (session) =>
  session?.loginResponse?.customer?.id || session?.profile?.id || session?.loginResponse?.user?.id || '';

export const useSwapStore = create((set, get) => ({
  allSubscriptions: [],
  subscriptionsLoaded: false,
  subscriptionsLoading: false,
  subscriptionsError: '',
  shopPointsSubscriptions: [],
  shopPointsSubscriptionsLoaded: false,
  shopPointsSubscriptionsLoading: false,
  shopPointsSubscriptionsError: '',
  shopItemsSubscriptions: [],
  shopItemsSubscriptionsLoaded: false,
  shopItemsSubscriptionsLoading: false,
  shopItemsSubscriptionsError: '',
  activeCustomer: null,
  currentCustomerOwnerKey: '',
  currentCustomerData: createCustomerDataCache(),
  customerCacheTtlMs: CUSTOMER_CACHE_TTL_MS,
  isCustomerCacheUsable,
  clearCurrentCustomerData: () =>
    set({
      currentCustomerData: createCustomerDataCache(),
    }),
  invalidateCustomerCache: (keysOrRules = []) =>
    set((state) => {
      const keys = Array.isArray(keysOrRules) ? keysOrRules : [keysOrRules];
      if (keys.length === 0) {
        return state;
      }

      const currentCustomerData = { ...state.currentCustomerData };

      keys.forEach((key) => {
        switch (key) {
          case 'profile':
          case 'activePackage':
          case 'pickups':
          case 'subscriptions':
          case 'orders':
          case 'swappedInItems':
            currentCustomerData[key] = invalidateEntry(currentCustomerData[key]);
            break;
          case 'pickupDetailsById':
          case 'subscriptionDetailsById':
          case 'orderDetailsById':
          case 'unreviewedItemsByKey':
            currentCustomerData[key] = invalidateEntryMap(currentCustomerData[key]);
            break;
          default:
            break;
        }
      });

      return {
        currentCustomerData,
      };
    }),
  setActiveCustomerSession: (session) => {
    const email = normalizeEmail(session?.email || session?.profile?.email || session?.profile?.email_c || '');
    const token = session?.loginResponse?.token || session?.token || '';
    const details = session?.profile || session?.loginResponse?.customer || null;
    const customerId = getCustomerIdFromSession(session) || details?.id || '';
    const ownerKey = getCustomerOwnerKey({ email, customerId });

    set((state) => {
      const customerChanged = state.currentCustomerOwnerKey && state.currentCustomerOwnerKey !== ownerKey;
      const currentCustomerData = customerChanged ? createCustomerDataCache() : { ...state.currentCustomerData };

      if (details) {
        currentCustomerData.profile = toLoadedEntry(details);
      }

      return {
        activeCustomer: {
          email,
          token,
          details,
          loginResponse: session?.loginResponse || null,
          walletResponse: session?.walletResponse || null,
        },
        currentCustomerOwnerKey: ownerKey,
        currentCustomerData,
      };
    });
  },
  fetchCustomerProfileIfNeeded: async (email, { force = false } = {}) => {
    const normalizedEmail = normalizeEmail(email || get().activeCustomer?.email || '');
    const currentEntry = get().currentCustomerData.profile;

    if (!force && isCustomerCacheUsable(currentEntry, get().customerCacheTtlMs)) {
      return currentEntry.data;
    }

    set((state) => ({
      currentCustomerData: {
        ...state.currentCustomerData,
        profile: {
          ...state.currentCustomerData.profile,
          loading: true,
          error: '',
        },
      },
    }));

    try {
      const profile = await getCustomerProfile(normalizedEmail);
      set((state) => ({
        currentCustomerOwnerKey: getCustomerOwnerKey({ email: normalizedEmail, customerId: profile?.id || getCustomerIdFromSession({ profile }) }),
        currentCustomerData: {
          ...state.currentCustomerData,
          profile: toLoadedEntry(profile),
        },
      }));
      return profile;
    } catch (error) {
      set((state) => ({
        currentCustomerData: {
          ...state.currentCustomerData,
          profile: {
            ...state.currentCustomerData.profile,
            loading: false,
            error: error?.message || 'Failed to load customer profile.',
          },
        },
      }));
      throw error;
    }
  },
  fetchCustomerActivePackageIfNeeded: async (email, { force = false } = {}) => {
    const normalizedEmail = normalizeEmail(email || get().activeCustomer?.email || '');
    const currentEntry = get().currentCustomerData.activePackage;

    if (!force && isCustomerCacheUsable(currentEntry, get().customerCacheTtlMs)) {
      return currentEntry.data;
    }

    set((state) => ({
      currentCustomerData: {
        ...state.currentCustomerData,
        activePackage: {
          ...state.currentCustomerData.activePackage,
          loading: true,
          error: '',
        },
      },
    }));

    try {
      const activePackage = await getActivePackageDetails(normalizedEmail);
      set((state) => ({
        currentCustomerData: {
          ...state.currentCustomerData,
          activePackage: toLoadedEntry(activePackage),
        },
      }));
      return activePackage;
    } catch (error) {
      set((state) => ({
        currentCustomerData: {
          ...state.currentCustomerData,
          activePackage: {
            ...state.currentCustomerData.activePackage,
            loading: false,
            error: error?.message || 'Failed to load active package.',
          },
        },
      }));
      throw error;
    }
  },
  fetchCustomerPickupsIfNeeded: async (email, { force = false } = {}) => {
    const normalizedEmail = normalizeEmail(email || get().activeCustomer?.email || '');
    const currentEntry = get().currentCustomerData.pickups;

    if (!force && isCustomerCacheUsable(currentEntry, get().customerCacheTtlMs)) {
      return currentEntry.data;
    }

    set((state) => ({
      currentCustomerData: {
        ...state.currentCustomerData,
        pickups: {
          ...state.currentCustomerData.pickups,
          loading: true,
          error: '',
        },
      },
    }));

    try {
      const pickups = await getCustomerPickups(normalizedEmail);
      set((state) => ({
        currentCustomerData: {
          ...state.currentCustomerData,
          pickups: toLoadedEntry(pickups || []),
        },
      }));
      return pickups || [];
    } catch (error) {
      set((state) => ({
        currentCustomerData: {
          ...state.currentCustomerData,
          pickups: {
            ...state.currentCustomerData.pickups,
            loading: false,
            error: error?.message || 'Failed to load pickups.',
          },
        },
      }));
      throw error;
    }
  },
  fetchCustomerPickupDetailIfNeeded: async (email, pickupId, { force = false } = {}) => {
    const key = String(pickupId || '');
    const currentEntry = getEntryFromMap(get().currentCustomerData.pickupDetailsById, key);

    if (!force && isCustomerCacheUsable(currentEntry, get().customerCacheTtlMs)) {
      return currentEntry.data;
    }

    const cachedPickupList = get().currentCustomerData.pickups;
    if (!force && isCustomerCacheUsable(cachedPickupList, get().customerCacheTtlMs)) {
      const derivedPickup = (cachedPickupList.data || []).find((pickup) => String(pickup?.id) === key) || null;
      if (derivedPickup) {
        set((state) => ({
          currentCustomerData: {
            ...state.currentCustomerData,
            pickupDetailsById: {
              ...state.currentCustomerData.pickupDetailsById,
              [key]: toLoadedEntry(derivedPickup),
            },
          },
        }));
        return derivedPickup;
      }
    }

    set((state) => ({
      currentCustomerData: {
        ...state.currentCustomerData,
        pickupDetailsById: {
          ...state.currentCustomerData.pickupDetailsById,
          [key]: {
            ...currentEntry,
            loading: true,
            error: '',
          },
        },
      },
    }));

    try {
      const pickup = await getCustomerPickupDetails(email, pickupId);
      set((state) => ({
        currentCustomerData: {
          ...state.currentCustomerData,
          pickupDetailsById: {
            ...state.currentCustomerData.pickupDetailsById,
            [key]: toLoadedEntry(pickup),
          },
        },
      }));
      return pickup;
    } catch (error) {
      set((state) => ({
        currentCustomerData: {
          ...state.currentCustomerData,
          pickupDetailsById: {
            ...state.currentCustomerData.pickupDetailsById,
            [key]: {
              ...currentEntry,
              loading: false,
              error: error?.message || 'Failed to load pickup details.',
            },
          },
        },
      }));
      throw error;
    }
  },
  fetchCustomerSubscriptionsIfNeeded: async (email, { force = false } = {}) => {
    const normalizedEmail = normalizeEmail(email || get().activeCustomer?.email || '');
    const currentEntry = get().currentCustomerData.subscriptions;

    if (!force && isCustomerCacheUsable(currentEntry, get().customerCacheTtlMs)) {
      return currentEntry.data;
    }

    set((state) => ({
      currentCustomerData: {
        ...state.currentCustomerData,
        subscriptions: {
          ...state.currentCustomerData.subscriptions,
          loading: true,
          error: '',
        },
      },
    }));

    try {
      const subscriptions = await getCustomerSubscriptions(normalizedEmail);
      set((state) => ({
        currentCustomerData: {
          ...state.currentCustomerData,
          subscriptions: toLoadedEntry(subscriptions || []),
        },
      }));
      return subscriptions || [];
    } catch (error) {
      set((state) => ({
        currentCustomerData: {
          ...state.currentCustomerData,
          subscriptions: {
            ...state.currentCustomerData.subscriptions,
            loading: false,
            error: error?.message || 'Failed to load subscriptions.',
          },
        },
      }));
      throw error;
    }
  },
  fetchCustomerSubscriptionDetailIfNeeded: async (email, subscriptionId, { force = false } = {}) => {
    const key = String(subscriptionId || '');
    const currentEntry = getEntryFromMap(get().currentCustomerData.subscriptionDetailsById, key);

    if (!force && isCustomerCacheUsable(currentEntry, get().customerCacheTtlMs)) {
      return currentEntry.data;
    }

    set((state) => ({
      currentCustomerData: {
        ...state.currentCustomerData,
        subscriptionDetailsById: {
          ...state.currentCustomerData.subscriptionDetailsById,
          [key]: {
            ...currentEntry,
            loading: true,
            error: '',
          },
        },
      },
    }));

    try {
      const subscription = await getCustomerSubscriptionDetails(email, subscriptionId);
      set((state) => ({
        currentCustomerData: {
          ...state.currentCustomerData,
          subscriptionDetailsById: {
            ...state.currentCustomerData.subscriptionDetailsById,
            [key]: toLoadedEntry(subscription),
          },
        },
      }));
      return subscription;
    } catch (error) {
      set((state) => ({
        currentCustomerData: {
          ...state.currentCustomerData,
          subscriptionDetailsById: {
            ...state.currentCustomerData.subscriptionDetailsById,
            [key]: {
              ...currentEntry,
              loading: false,
              error: error?.message || 'Failed to load subscription details.',
            },
          },
        },
      }));
      throw error;
    }
  },
  fetchCustomerOrdersIfNeeded: async (email, { force = false } = {}) => {
    const normalizedEmail = normalizeEmail(email || get().activeCustomer?.email || '');
    const currentEntry = get().currentCustomerData.orders;

    if (!force && isCustomerCacheUsable(currentEntry, get().customerCacheTtlMs)) {
      return currentEntry.data;
    }

    set((state) => ({
      currentCustomerData: {
        ...state.currentCustomerData,
        orders: {
          ...state.currentCustomerData.orders,
          loading: true,
          error: '',
        },
      },
    }));

    try {
      const orders = await getCustomerOrders(normalizedEmail);
      set((state) => ({
        currentCustomerData: {
          ...state.currentCustomerData,
          orders: toLoadedEntry(orders || []),
        },
      }));
      return orders || [];
    } catch (error) {
      set((state) => ({
        currentCustomerData: {
          ...state.currentCustomerData,
          orders: {
            ...state.currentCustomerData.orders,
            loading: false,
            error: error?.message || 'Failed to load orders.',
          },
        },
      }));
      throw error;
    }
  },
  fetchCustomerOrderDetailIfNeeded: async (email, orderId, { force = false } = {}) => {
    const key = String(orderId || '');
    const currentEntry = getEntryFromMap(get().currentCustomerData.orderDetailsById, key);

    if (!force && isCustomerCacheUsable(currentEntry, get().customerCacheTtlMs)) {
      return currentEntry.data;
    }

    set((state) => ({
      currentCustomerData: {
        ...state.currentCustomerData,
        orderDetailsById: {
          ...state.currentCustomerData.orderDetailsById,
          [key]: {
            ...currentEntry,
            loading: true,
            error: '',
          },
        },
      },
    }));

    try {
      const order = await getCustomerOrderDetails(email, orderId);
      set((state) => ({
        currentCustomerData: {
          ...state.currentCustomerData,
          orderDetailsById: {
            ...state.currentCustomerData.orderDetailsById,
            [key]: toLoadedEntry(order),
          },
        },
      }));
      return order;
    } catch (error) {
      set((state) => ({
        currentCustomerData: {
          ...state.currentCustomerData,
          orderDetailsById: {
            ...state.currentCustomerData.orderDetailsById,
            [key]: {
              ...currentEntry,
              loading: false,
              error: error?.message || 'Failed to load order details.',
            },
          },
        },
      }));
      throw error;
    }
  },
  fetchCustomerSwappedInItemsIfNeeded: async (email, { force = false } = {}) => {
    const normalizedEmail = normalizeEmail(email || get().activeCustomer?.email || '');
    const currentEntry = get().currentCustomerData.swappedInItems;

    if (!force && isCustomerCacheUsable(currentEntry, get().customerCacheTtlMs)) {
      return currentEntry.data;
    }

    const cachedPickupList = get().currentCustomerData.pickups;
    if (!force && isCustomerCacheUsable(cachedPickupList, get().customerCacheTtlMs)) {
      const derivedItems = (cachedPickupList.data || []).flatMap((pickup) => pickup?.items || []);
      set((state) => ({
        currentCustomerData: {
          ...state.currentCustomerData,
          swappedInItems: toLoadedEntry(derivedItems),
        },
      }));
      return derivedItems;
    }

    set((state) => ({
      currentCustomerData: {
        ...state.currentCustomerData,
        swappedInItems: {
          ...state.currentCustomerData.swappedInItems,
          loading: true,
          error: '',
        },
      },
    }));

    try {
      const items = await getCustomerSwappedInItems(normalizedEmail);
      set((state) => ({
        currentCustomerData: {
          ...state.currentCustomerData,
          swappedInItems: toLoadedEntry(items || []),
        },
      }));
      return items || [];
    } catch (error) {
      set((state) => ({
        currentCustomerData: {
          ...state.currentCustomerData,
          swappedInItems: {
            ...state.currentCustomerData.swappedInItems,
            loading: false,
            error: error?.message || 'Failed to load swapped-in items.',
          },
        },
      }));
      throw error;
    }
  },
  fetchCustomerUnreviewedItemsIfNeeded: async (
    { maxResults = 21, offset = 0, filters = [], customerEmail = '', authToken = '' } = {},
    { force = false } = {}
  ) => {
    const key = buildCustomerUnreviewedItemsCacheKey({ maxResults, offset, filters });
    const currentEntry = getEntryFromMap(get().currentCustomerData.unreviewedItemsByKey, key);

    if (!force && isCustomerCacheUsable(currentEntry, get().customerCacheTtlMs)) {
      return currentEntry.data;
    }

    set((state) => ({
      currentCustomerData: {
        ...state.currentCustomerData,
        unreviewedItemsByKey: {
          ...state.currentCustomerData.unreviewedItemsByKey,
          [key]: {
            ...currentEntry,
            loading: true,
            error: '',
          },
        },
      },
    }));

    try {
      const response = await getCustomerUnreviewedItems({
        maxResults,
        offset,
        filters,
        customerEmail,
        authToken,
      });
      set((state) => ({
        currentCustomerData: {
          ...state.currentCustomerData,
          unreviewedItemsByKey: {
            ...state.currentCustomerData.unreviewedItemsByKey,
            [key]: toLoadedEntry(response),
          },
        },
      }));
      return response;
    } catch (error) {
      set((state) => ({
        currentCustomerData: {
          ...state.currentCustomerData,
          unreviewedItemsByKey: {
            ...state.currentCustomerData.unreviewedItemsByKey,
            [key]: {
              ...currentEntry,
              loading: false,
              error: error?.message || 'Failed to load review items.',
            },
          },
        },
      }));
      throw error;
    }
  },
  fetchAllSubscriptions: async ({ force = false } = {}) => {
    if (!force && (get().subscriptionsLoaded || get().subscriptionsLoading)) {
      return get().allSubscriptions;
    }

    set({ subscriptionsLoading: true, subscriptionsError: '' });

    try {
      const allSubscriptions = await getAllSubscriptions();
      set({
        allSubscriptions,
        subscriptionsLoaded: true,
        subscriptionsLoading: false,
      });
      return allSubscriptions;
    } catch (error) {
      set({
        subscriptionsLoading: false,
        subscriptionsError: error?.message || 'Failed to fetch subscriptions.',
      });
      throw error;
    }
  },
  fetchShopPointsSubscriptions: async ({ force = false } = {}) => {
    if (!force && (get().shopPointsSubscriptionsLoaded || get().shopPointsSubscriptionsLoading)) {
      return get().shopPointsSubscriptions;
    }

    set({
      shopPointsSubscriptionsLoading: true,
      shopPointsSubscriptionsError: '',
    });

    try {
      const shopPointsSubscriptions = await getShopPointsSubscriptions();
      set({
        shopPointsSubscriptions,
        shopPointsSubscriptionsLoaded: true,
        shopPointsSubscriptionsLoading: false,
      });
      return shopPointsSubscriptions;
    } catch (error) {
      set({
        shopPointsSubscriptionsLoading: false,
        shopPointsSubscriptionsError: error?.message || 'Failed to fetch shop points subscriptions.',
      });
      throw error;
    }
  },
  fetchShopItemSubscriptions: async ({ force = false } = {}) => {
    if (!force && (get().shopItemsSubscriptionsLoaded || get().shopItemsSubscriptionsLoading)) {
      return get().shopItemsSubscriptions;
    }

    set({
      shopItemsSubscriptionsLoading: true,
      shopItemsSubscriptionsError: '',
    });

    try {
      const shopItemsSubscriptions = await getShopItemSubscriptions();
      set({
        shopItemsSubscriptions,
        shopItemsSubscriptionsLoaded: true,
        shopItemsSubscriptionsLoading: false,
      });
      return shopItemsSubscriptions;
    } catch (error) {
      set({
        shopItemsSubscriptionsLoading: false,
        shopItemsSubscriptionsError: error?.message || 'Failed to fetch shop item subscriptions.',
      });
      throw error;
    }
  },
  fetchShopSubscriptions: async ({ force = false } = {}) => {
    const [shopPointsSubscriptions, shopItemsSubscriptions] = await Promise.all([
      get().fetchShopPointsSubscriptions({ force }),
      get().fetchShopItemSubscriptions({ force }),
    ]);

    return {
      shopPointsSubscriptions,
      shopItemsSubscriptions,
    };
  },
}));
