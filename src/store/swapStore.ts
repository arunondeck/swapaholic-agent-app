import { create } from 'zustand';
import {
  getAllSubscriptions,
  getBrands,
  getColors,
  getCustomerCheckoutCart,
  getCategories,
  getCustomerOrderDetails,
  getCustomerOrders,
  getCustomerPickupDetails,
  getCustomerPickups,
  getCustomerProfile,
  getCustomerSubscriptionDetails,
  getCustomerSubscriptions,
  getCustomerSwappedInItems,
  getCustomerUnreviewedItems,
  getMadeIns,
  getMaterials,
  getOccasions,
  getSizes,
  getShopItemSubscriptions,
  getShopPointsSubscriptions,
  getStyles,
  getUserSegments,
} from '../api/swapOpsApi';
import { categoryOptions, conditionOptions } from '../data/mockData';

const CUSTOMER_CACHE_TTL_MS = 30 * 60 * 1000;
const REFERENCE_DATA_TTL_MS = 12 * 60 * 60 * 1000;
let referenceDataRequest = null;

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
  checkoutCart: createCacheEntry([]),
  pickups: createCacheEntry([]),
  subscriptions: createCacheEntry([]),
  orders: createCacheEntry([]),
  swappedInItems: createCacheEntry([]),
  pickupRefreshRequestsById: {},
  pickupDetailsById: {},
  subscriptionDetailsById: {},
  orderDetailsById: {},
  unreviewedItemsByKey: {},
});

const createReferenceDataCache = () => ({
  brands: createCacheEntry([]),
  categories: createCacheEntry([]),
  userSegments: createCacheEntry([]),
  colors: createCacheEntry([]),
  styles: createCacheEntry([]),
  sizes: createCacheEntry([]),
  materials: createCacheEntry([]),
  madeIns: createCacheEntry([]),
  occasions: createCacheEntry([]),
});

const REFERENCE_DATA_KEYS = ['brands', 'categories', 'userSegments', 'colors', 'styles', 'sizes', 'materials', 'madeIns', 'occasions'];

const createItemEntryOptions = ({
  categories = [],
  brands = [],
  userSegments = [],
  colors = [],
  styles = [],
  sizes = [],
  materials = [],
  madeIns = [],
  occasions = [],
} = {}) => {
  const categoryEntities = Array.isArray(categories)
    ? categories
        .map((category, index) => {
          const name = String(category?.name || '').trim();
          if (!name) {
            return null;
          }

          return {
            id: String(category?.id || `category-${index + 1}`),
            name,
          };
        })
        .filter(Boolean)
    : [];
  const resolvedCategoryEntities =
    categoryEntities.length > 0
      ? categoryEntities
      : Object.keys(categoryOptions).map((name, index) => ({
          id: `mock-category-${index + 1}`,
          name,
        }));
  const resolvedCategoryNames = resolvedCategoryEntities.map((category) => category.name);
  const resolvedCategoryOptions = Object.fromEntries(
    resolvedCategoryNames.map((name) => [name, categoryOptions[name] || [name]])
  );

  return {
    categoryEntities: resolvedCategoryEntities,
    categoryOptions: resolvedCategoryOptions,
    conditionOptions,
    brandOptions: Array.isArray(brands) ? brands : [],
    userSegmentOptions: Array.isArray(userSegments) ? userSegments : [],
    colorOptions: Array.isArray(colors) ? colors : [],
    styleOptions: Array.isArray(styles) ? styles : [],
    sizeOptions: Array.isArray(sizes) ? sizes : [],
    materialOptions: Array.isArray(materials) ? materials : [],
    madeInOptions: Array.isArray(madeIns) ? madeIns : [],
    occasionOptions: Array.isArray(occasions) ? occasions : [],
  };
};

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

const resolveActiveSubscriptionFromList = (subscriptions = []) =>
  Array.isArray(subscriptions)
    ? subscriptions.find((subscription) => String(subscription?.status || '').trim().toLowerCase() === 'active') || null
    : null;

const mergePickupIntoList = (entry, pickup) => {
  if (!entry || !Array.isArray(entry.data) || !pickup?.id) {
    return entry;
  }

  const pickupId = String(pickup.id);
  let didReplace = false;
  const nextData = entry.data.map((existingPickup) => {
    if (String(existingPickup?.id || '') !== pickupId) {
      return existingPickup;
    }

    didReplace = true;
    return pickup;
  });

  return didReplace
    ? {
        ...entry,
        data: nextData,
      }
    : entry;
};

export const useSwapStore = create<any>((set, get) => ({
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
  currentCustomerEmail: '',
  currentCustomerOwnerKey: '',
  currentCustomerData: createCustomerDataCache(),
  referenceData: createReferenceDataCache(),
  referenceDataTtlMs: REFERENCE_DATA_TTL_MS,
  customerCacheTtlMs: CUSTOMER_CACHE_TTL_MS,
  isCustomerCacheUsable,
  getItemEntryOptions: () => {
    const state = get();
    return createItemEntryOptions({
      brands: state.referenceData.brands.data,
      categories: state.referenceData.categories.data,
      userSegments: state.referenceData.userSegments.data,
      colors: state.referenceData.colors.data,
      styles: state.referenceData.styles.data,
      sizes: state.referenceData.sizes.data,
      materials: state.referenceData.materials.data,
      madeIns: state.referenceData.madeIns.data,
      occasions: state.referenceData.occasions.data,
    });
  },
  clearCurrentCustomerData: () =>
    set({
      currentCustomerEmail: '',
      currentCustomerData: createCustomerDataCache(),
    }),
  fetchReferenceDataIfNeeded: async ({ force = false } = {}) => {
    const state = get();
    const { referenceData, referenceDataTtlMs } = state;
    const hasUsableReferenceData = REFERENCE_DATA_KEYS.every((key) =>
      isCustomerCacheUsable(referenceData[key], referenceDataTtlMs)
    );

    if (!force && hasUsableReferenceData) {
      return Object.fromEntries(REFERENCE_DATA_KEYS.map((key) => [key, referenceData[key].data || []]));
    }

    if (!force && REFERENCE_DATA_KEYS.some((key) => referenceData[key].loading)) {
      if (referenceDataRequest) {
        return referenceDataRequest;
      }

      return Object.fromEntries(REFERENCE_DATA_KEYS.map((key) => [key, referenceData[key].data || []]));
    }

    set((currentState) => ({
      referenceData: Object.fromEntries(
        REFERENCE_DATA_KEYS.map((key) => [
          key,
          {
            ...currentState.referenceData[key],
            loading: true,
            error: '',
          },
        ])
      ),
    }));

    referenceDataRequest = Promise.all([
      getBrands(),
      getCategories(),
      getUserSegments(),
      getColors(),
      getStyles(),
      getSizes(),
      getMaterials(),
      getMadeIns(),
      getOccasions(),
    ])
      .then(([brands, categories, userSegments, colors, styles, sizes, materials, madeIns, occasions]) => {
        const nextReferenceData = {
          brands: toLoadedEntry(brands || []),
          categories: toLoadedEntry(categories || []),
          userSegments: toLoadedEntry(userSegments || []),
          colors: toLoadedEntry(colors || []),
          styles: toLoadedEntry(styles || []),
          sizes: toLoadedEntry(sizes || []),
          materials: toLoadedEntry(materials || []),
          madeIns: toLoadedEntry(madeIns || []),
          occasions: toLoadedEntry(occasions || []),
        };

        set({
          referenceData: nextReferenceData,
        });

        return Object.fromEntries(REFERENCE_DATA_KEYS.map((key) => [key, nextReferenceData[key].data || []]));
      })
      .catch((error) => {
        set((currentState) => ({
          referenceData: Object.fromEntries(
            REFERENCE_DATA_KEYS.map((key) => [
              key,
              {
                ...currentState.referenceData[key],
                loading: false,
                error: error?.message || `Failed to load ${key}.`,
              },
            ])
          ),
        }));
        throw error;
      })
      .finally(() => {
        referenceDataRequest = null;
      });

    return referenceDataRequest;
  },
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
          case 'checkoutCart':
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
  requestPickupDetailRefresh: (pickupId, reason = 'itemAdded') =>
    set((state) => {
      const key = String(pickupId || '');
      if (!key) {
        return state;
      }

      return {
        currentCustomerData: {
          ...state.currentCustomerData,
          pickupRefreshRequestsById: {
            ...state.currentCustomerData.pickupRefreshRequestsById,
            [key]: {
              requestedAt: Date.now(),
              reason,
            },
          },
        },
      };
    }),
  clearPickupDetailRefresh: (pickupId) =>
    set((state) => {
      const key = String(pickupId || '');
      if (!key || !state.currentCustomerData.pickupRefreshRequestsById?.[key]) {
        return state;
      }

      const nextRefreshRequests = { ...state.currentCustomerData.pickupRefreshRequestsById };
      delete nextRefreshRequests[key];

      return {
        currentCustomerData: {
          ...state.currentCustomerData,
          pickupRefreshRequestsById: nextRefreshRequests,
        },
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
        currentCustomerEmail: email,
        currentCustomerOwnerKey: ownerKey,
        currentCustomerData,
      };
    });
  },
  primeCustomerPickupDetail: (pickupId, pickup) => {
    const key = String(pickupId || pickup?.id || '');
    if (!key || !pickup) {
      return;
    }

    set((state) => ({
      currentCustomerData: {
        ...state.currentCustomerData,
        pickupDetailsById: {
          ...state.currentCustomerData.pickupDetailsById,
          [key]: toLoadedEntry(pickup),
        },
      },
    }));
  },
  fetchCustomerProfileIfNeeded: async (email, { force = false } = {}) => {
    const normalizedEmail = normalizeEmail(email || get().activeCustomer?.email || '');
    const customerChanged = Boolean(get().currentCustomerEmail && get().currentCustomerEmail !== normalizedEmail);
    const currentEntry = customerChanged ? createCacheEntry(null) : get().currentCustomerData.profile;

    if (!force && isCustomerCacheUsable(currentEntry, get().customerCacheTtlMs)) {
      return currentEntry.data;
    }

    set((state) => ({
      currentCustomerEmail: normalizedEmail,
      currentCustomerData: {
        ...(customerChanged ? createCustomerDataCache() : state.currentCustomerData),
        profile: {
          ...(customerChanged ? createCacheEntry(null) : state.currentCustomerData.profile),
          loading: true,
          error: '',
        },
      },
    }));

    try {
      const profile = await getCustomerProfile(normalizedEmail, { forceRefresh: force });
      set((state) => ({
        currentCustomerEmail: normalizedEmail,
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
  fetchCustomerCheckoutCartIfNeeded: async (email, { force = false } = {}) => {
    const normalizedEmail = normalizeEmail(email || get().activeCustomer?.email || '');
    const customerChanged = Boolean(get().currentCustomerEmail && get().currentCustomerEmail !== normalizedEmail);
    const currentEntry = customerChanged ? createCacheEntry([]) : get().currentCustomerData.checkoutCart;

    if (!force && isCustomerCacheUsable(currentEntry, get().customerCacheTtlMs)) {
      return currentEntry.data || [];
    }

    set((state) => ({
      currentCustomerEmail: normalizedEmail,
      currentCustomerData: {
        ...(customerChanged ? createCustomerDataCache() : state.currentCustomerData),
        checkoutCart: {
          ...(customerChanged ? createCacheEntry([]) : state.currentCustomerData.checkoutCart),
          loading: true,
          error: '',
        },
      },
    }));

    try {
      const checkoutCart = await getCustomerCheckoutCart(normalizedEmail);
      set((state) => ({
        currentCustomerData: {
          ...state.currentCustomerData,
          checkoutCart: toLoadedEntry(checkoutCart || []),
        },
      }));
      return checkoutCart || [];
    } catch (error) {
      set((state) => ({
        currentCustomerData: {
          ...state.currentCustomerData,
          checkoutCart: {
            ...state.currentCustomerData.checkoutCart,
            loading: false,
            error: error?.message || 'Failed to load checkout cart.',
          },
        },
      }));
      throw error;
    }
  },
  setCustomerCheckoutCart: (items = []) =>
    set((state) => ({
      currentCustomerData: {
        ...state.currentCustomerData,
        checkoutCart: toLoadedEntry(Array.isArray(items) ? items : []),
      },
    })),
  addCustomerCheckoutCartItem: (item) =>
    set((state) => {
      const currentItems = Array.isArray(state.currentCustomerData.checkoutCart.data)
        ? state.currentCustomerData.checkoutCart.data
        : [];

      return {
        currentCustomerData: {
          ...state.currentCustomerData,
          checkoutCart: toLoadedEntry([...currentItems, item]),
        },
      };
    }),
  removeCustomerCheckoutCartItem: (itemId) =>
    set((state) => {
      const currentItems = Array.isArray(state.currentCustomerData.checkoutCart.data)
        ? state.currentCustomerData.checkoutCart.data
        : [];

      return {
        currentCustomerData: {
          ...state.currentCustomerData,
          checkoutCart: toLoadedEntry(currentItems.filter((item) => item?.id !== itemId)),
        },
      };
    }),
  clearCustomerCheckoutCart: () =>
    set((state) => ({
      currentCustomerData: {
        ...state.currentCustomerData,
        checkoutCart: toLoadedEntry([]),
      },
    })),
  fetchCustomerActivePackageIfNeeded: async (email, { force = false } = {}) => {
    const normalizedEmail = normalizeEmail(email || get().activeCustomer?.email || '');
    const currentEntry = get().currentCustomerData.activePackage;

    if (!force && isCustomerCacheUsable(currentEntry, get().customerCacheTtlMs)) {
      return currentEntry.data;
    }

    const result = await get().refreshCustomerSubscriptionState(normalizedEmail, { force });
    return result?.activeSubscription || null;
  },
  refreshCustomerSubscriptionState: async (email, { force = false } = {}) => {
    const normalizedEmail = normalizeEmail(email || get().activeCustomer?.email || '');
    if (!normalizedEmail) {
      set((state) => ({
        currentCustomerData: {
          ...state.currentCustomerData,
          subscriptions: toLoadedEntry([]),
          activePackage: toLoadedEntry(null),
        },
      }));
      return {
        subscriptions: [],
        activeSubscription: null,
      };
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
      const subscriptions = await get().fetchCustomerSubscriptionsIfNeeded(normalizedEmail, { force });
      const activeSubscriptionSummary = resolveActiveSubscriptionFromList(subscriptions);

      if (!activeSubscriptionSummary?.id) {
        set((state) => ({
          currentCustomerData: {
            ...state.currentCustomerData,
            activePackage: toLoadedEntry(null),
          },
        }));
        return {
          subscriptions: subscriptions || [],
          activeSubscription: null,
        };
      }

      const activePackage = await get().fetchCustomerSubscriptionDetailIfNeeded(
        normalizedEmail,
        activeSubscriptionSummary.id,
        { force }
      );
      set((state) => ({
        currentCustomerData: {
          ...state.currentCustomerData,
          activePackage: toLoadedEntry(activePackage),
        },
      }));
      return {
        subscriptions: subscriptions || [],
        activeSubscription: activePackage || null,
      };
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
    const hasDetailedPickupData = (pickup) =>
      Boolean(
        pickup &&
          (
            Array.isArray(pickup?.customer_items) ||
            Array.isArray(pickup?.customer) ||
            Array.isArray(pickup?.subscribe) ||
            Array.isArray(pickup?.items)
          ) &&
          (
            (Array.isArray(pickup?.customer_items) && pickup.customer_items.length > 0) ||
            (Array.isArray(pickup?.customer) && pickup.customer.length > 0) ||
            (Array.isArray(pickup?.subscribe) && pickup.subscribe.length > 0) ||
            (Array.isArray(pickup?.items) && pickup.items.length > 0)
          )
      );

    if (!force && isCustomerCacheUsable(currentEntry, get().customerCacheTtlMs) && hasDetailedPickupData(currentEntry?.data)) {
      return currentEntry.data;
    }

    const cachedPickupList = get().currentCustomerData.pickups;
    if (!force && isCustomerCacheUsable(cachedPickupList, get().customerCacheTtlMs)) {
      const derivedPickup = (cachedPickupList.data || []).find((pickup) => String(pickup?.id) === key) || null;
      if (hasDetailedPickupData(derivedPickup)) {
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
          pickups: mergePickupIntoList(state.currentCustomerData.pickups, pickup),
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
    const shouldUsePointsCache = !force && (get().shopPointsSubscriptionsLoaded || get().shopPointsSubscriptionsLoading);
    const shouldUseItemsCache = !force && (get().shopItemsSubscriptionsLoaded || get().shopItemsSubscriptionsLoading);

    if (shouldUsePointsCache && shouldUseItemsCache) {
      return {
        shopPointsSubscriptions: get().shopPointsSubscriptions,
        shopItemsSubscriptions: get().shopItemsSubscriptions,
      };
    }

    set({
      shopPointsSubscriptionsLoading: shouldUsePointsCache ? get().shopPointsSubscriptionsLoading : true,
      shopPointsSubscriptionsError: shouldUsePointsCache ? get().shopPointsSubscriptionsError : '',
      shopItemsSubscriptionsLoading: shouldUseItemsCache ? get().shopItemsSubscriptionsLoading : true,
      shopItemsSubscriptionsError: shouldUseItemsCache ? get().shopItemsSubscriptionsError : '',
    });

    try {
      const [shopPointsSubscriptions, shopItemsSubscriptions] = await Promise.all([
        shouldUsePointsCache ? Promise.resolve(get().shopPointsSubscriptions) : getShopPointsSubscriptions(),
        shouldUseItemsCache ? Promise.resolve(get().shopItemsSubscriptions) : getShopItemSubscriptions(),
      ]);

      set({
        shopPointsSubscriptions,
        shopPointsSubscriptionsLoaded: true,
        shopPointsSubscriptionsLoading: false,
        shopItemsSubscriptions,
        shopItemsSubscriptionsLoaded: true,
        shopItemsSubscriptionsLoading: false,
      });

      return {
        shopPointsSubscriptions,
        shopItemsSubscriptions,
      };
    } catch (error) {
      set({
        shopPointsSubscriptionsLoading: false,
        shopPointsSubscriptionsError: error?.message || 'Failed to fetch shop points subscriptions.',
        shopItemsSubscriptionsLoading: false,
        shopItemsSubscriptionsError: error?.message || 'Failed to fetch shop item subscriptions.',
      });
      throw error;
    }
  },
}));
