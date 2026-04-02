import { create } from 'zustand';
import {
  checkCustomerSession,
  checkShopUserSession,
  loginAsBoothCustomer,
  loginAsBuyPointsCustomer,
  loginAsShopUser,
  loginAsSwapShopCustomer,
  resolveGuestAuthToken,
} from '../api/swapOpsApi';
import { clearStoredAppSession, loadStoredAppSession, saveStoredAppSession } from './appSessionStorage';
import { useSwapStore } from './swapStore';

const SHOP_EMAIL = (process.env.EXPO_PUBLIC_SWAP_EMAIL || '').trim().toLowerCase();
const BOOTH_EMAIL = (process.env.EXPO_PUBLIC_BOOTH_EMAIL || '').trim().toLowerCase();
const BUY_POINTS_EMAIL = (process.env.EXPO_PUBLIC_SWAP_BUY_POINTS_EMAIL || '').trim().toLowerCase();

const getCustomerIdFromSession = (session, fallbackCustomerId = '') =>
  session?.customer?.id || session?.user?.id || fallbackCustomerId || '';

const resolveMimeCustomerSession = async (storedToken, storedCustomerId, loginFn, label) => {
  if (storedToken) {
    try {
      console.log('[appSession] validating customer session', { label });
      const session = await checkCustomerSession(storedToken);
      if (session?.token) {
        console.log('[appSession] customer session valid', { label });
        return {
          token: session.token,
          customerId: getCustomerIdFromSession(session, storedCustomerId),
        };
      }
    } catch (error) {
      console.log('[appSession] customer session refresh required', {
        label,
        reason: error?.message || 'check failed',
      });
    }
  }

  console.log('[appSession] obtaining fresh customer token', { label });
  const loginResponse = await loginFn();
  const token = loginResponse?.token || '';
  const customerId = loginResponse?.customer?.id || '';

  if (!token) {
    throw new Error(`Failed to get token for ${label}.`);
  }

  return {
    token,
    customerId,
  };
};

const resolveShopOperatorSession = async (storedToken = '', storedCustomerId = '', guestToken = '') => {
  if (storedToken) {
    try {
      console.log('[appSession] validating operator session');
      const session = await checkShopUserSession(storedToken);
      if (session?.token && storedCustomerId) {
        console.log('[appSession] operator session valid');
        return {
          token: session.token,
          customerId: storedCustomerId,
        };
      }
      console.log('[appSession] operator session missing stored user id, refreshing login');
    } catch (error) {
      console.log('[appSession] operator session refresh required', {
        reason: error?.message || 'check failed',
      });
      // Refresh the operator token with users/login when the saved token is invalid.
    }
  }

  console.log('[appSession] obtaining fresh operator token');
  const session = await loginAsShopUser(guestToken);
  return {
    token: session?.token || '',
    customerId: session?.user?.id || session?.response?.success?.data?.user_id || storedCustomerId,
  };
};

export const useAppSessionStore = create((set, get) => ({
  hydrated: false,
  checkingSession: false,
  loading: false,
  operatorToken: '',
  shopToken: '',
  boothToken: '',
  guestToken: '',
  buyPointsEmail: '',
  buyPointsToken: '',
  shopCustomerId: '',
  boothCustomerId: '',
  buyPointsCustomerId: '',
  error: '',
  hydrate: async () => {
    if (get().hydrated) {
      return;
    }

    const stored = await loadStoredAppSession();
    console.log('[appSession] hydrate loaded storage', {
      hasOperatorToken: Boolean(stored?.operatorToken || stored?.shopToken),
      hasShopToken: Boolean(stored?.shopToken),
      hasBoothToken: Boolean(stored?.boothToken),
      hasGuestToken: Boolean(stored?.guestToken),
      hasBuyPointsToken: Boolean(stored?.buyPointsToken),
    });

    set({
      hydrated: true,
      checkingSession: true,
      operatorToken: stored?.operatorToken || '',
      shopToken: stored?.shopToken || '',
      boothToken: stored?.boothToken || '',
      guestToken: stored?.guestToken || '',
      buyPointsEmail: stored?.buyPointsEmail || BUY_POINTS_EMAIL,
      buyPointsToken: stored?.buyPointsToken || '',
      shopCustomerId: stored?.shopCustomerId || '',
      boothCustomerId: stored?.boothCustomerId || '',
      buyPointsCustomerId: stored?.buyPointsCustomerId || '',
      error: '',
    });

    try {
      await get().refreshTokens();
    } catch (error) {
      set({
        loading: false,
        error: error?.message || 'Unable to initialize app tokens.',
      });
    } finally {
      set({ checkingSession: false });
    }
  },
  refreshTokens: async () => {
    set({ loading: true, error: '' });

    try {
      console.log('[appSession] refreshTokens start');
      // Guest tokens do not have a check-session path in this app, so bootstrap
      // must force-refresh them before any dependent API preloads start.
      const guestToken = await resolveGuestAuthToken({ force: true });
      console.log('[appSession] guest session ready', {
        hasGuestToken: Boolean(guestToken),
      });
      const operatorSession = await resolveShopOperatorSession(get().operatorToken, get().shopCustomerId, guestToken);
      const operatorAuth = {
        operatorToken: operatorSession.token,
        boothToken: get().boothToken,
        guestToken,
        buyPointsEmail: BUY_POINTS_EMAIL,
        buyPointsToken: get().buyPointsToken,
        shopCustomerId: operatorSession.customerId,
        boothCustomerId: get().boothCustomerId,
        buyPointsCustomerId: get().buyPointsCustomerId,
        shopToken: get().shopToken,
      };
      await saveStoredAppSession(operatorAuth);
      set({
        operatorToken: operatorAuth.operatorToken,
        guestToken: operatorAuth.guestToken,
        shopCustomerId: operatorAuth.shopCustomerId,
      });
      console.log('[appSession] operator token saved', {
        operatorToken: operatorAuth.operatorToken,
      });

      const [shopSession, boothSession, buyPointsSession] = await Promise.all([
        resolveMimeCustomerSession(get().shopToken, '', loginAsSwapShopCustomer, 'shop'),
        resolveMimeCustomerSession(get().boothToken, get().boothCustomerId, loginAsBoothCustomer, 'booth'),
        BUY_POINTS_EMAIL
          ? resolveMimeCustomerSession(get().buyPointsToken, get().buyPointsCustomerId, loginAsBuyPointsCustomer, 'buy-points')
          : Promise.resolve({ token: '', customerId: '' }),
      ]);

      const auth = {
        ...operatorAuth,
        shopToken: shopSession.token,
        boothToken: boothSession.token,
        buyPointsToken: buyPointsSession.token,
        boothCustomerId: boothSession.customerId,
        buyPointsCustomerId: buyPointsSession.customerId,
      };
      await saveStoredAppSession(auth);
      console.log('[appSession] refreshTokens saved', {
        hasOperatorToken: Boolean(auth.operatorToken),
        hasShopToken: Boolean(auth.shopToken),
        hasBoothToken: Boolean(auth.boothToken),
        hasGuestToken: Boolean(auth.guestToken),
        hasBuyPointsToken: Boolean(auth.buyPointsToken),
      });

      set({
        hydrated: true,
        loading: false,
        operatorToken: auth.operatorToken,
        shopToken: auth.shopToken,
        boothToken: auth.boothToken,
        guestToken: auth.guestToken,
        buyPointsEmail: auth.buyPointsEmail,
        buyPointsToken: auth.buyPointsToken,
        shopCustomerId: auth.shopCustomerId,
        boothCustomerId: auth.boothCustomerId,
        buyPointsCustomerId: auth.buyPointsCustomerId,
        error: '',
      });

      console.log('[appSession] preloading shop subscriptions');
      useSwapStore
        .getState()
        .fetchShopSubscriptions({ force: true })
        .then((result) => {
          console.log('[appSession] shop subscriptions preloaded', {
            pointsCount: result?.shopPointsSubscriptions?.length || 0,
            itemsCount: result?.shopItemsSubscriptions?.length || 0,
          });
        })
        .catch((preloadError) => {
          console.log('[appSession] shop subscriptions preload failed', {
            reason: preloadError?.message || 'unknown error',
          });
        });

      console.log('[appSession] preloading reference data');
      useSwapStore
        .getState()
        .fetchReferenceDataIfNeeded({ force: true })
        .then((result) => {
          console.log('[appSession] reference data preloaded', {
            brandsCount: result?.brands?.length || 0,
            categoriesCount: result?.categories?.length || 0,
            userSegmentsCount: result?.userSegments?.length || 0,
            stylesCount: result?.styles?.length || 0,
            sizesCount: result?.sizes?.length || 0,
            materialsCount: result?.materials?.length || 0,
            madeInsCount: result?.madeIns?.length || 0,
            occasionsCount: result?.occasions?.length || 0,
          });
        })
        .catch((preloadError) => {
          console.log('[appSession] reference data preload failed', {
            reason: preloadError?.message || 'unknown error',
          });
        });

      return auth;
    } catch (error) {
      await clearStoredAppSession();
      set({
        loading: false,
        operatorToken: '',
        shopToken: '',
        boothToken: '',
        guestToken: '',
        buyPointsEmail: '',
        buyPointsToken: '',
        shopCustomerId: '',
        boothCustomerId: '',
        buyPointsCustomerId: '',
        error: error?.message || 'Unable to refresh app tokens.',
      });
      throw error;
    }
  },
  clearTokens: async () => {
    await clearStoredAppSession();
    set({
      operatorToken: '',
      shopToken: '',
      boothToken: '',
      guestToken: '',
      buyPointsEmail: '',
      buyPointsToken: '',
      shopCustomerId: '',
      boothCustomerId: '',
      buyPointsCustomerId: '',
      error: '',
    });
  },
}));
