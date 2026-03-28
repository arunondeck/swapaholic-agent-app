import { create } from 'zustand';
import { getAllSubscriptions, getShopItemSubscriptions, getShopPointsSubscriptions } from '../api/swapOpsApi';

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
  setActiveCustomerSession: (session) => {
    const email = session?.email || session?.profile?.email || '';
    const token = session?.loginResponse?.token || '';
    const details = session?.profile || session?.loginResponse?.customer || null;

    set({
      activeCustomer: {
        email,
        token,
        details,
        loginResponse: session?.loginResponse || null,
        walletResponse: session?.walletResponse || null,
      },
    });
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
