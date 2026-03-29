import { create } from 'zustand';
import { checkCustomerSession, checkShopUserSession, loginAsCustomer, loginAsShopUser, registerGuestSession } from '../api/swapOpsApi';
import { clearStoredAppSession, loadStoredAppSession, saveStoredAppSession } from './appSessionStorage';

const SHOP_EMAIL = (process.env.EXPO_PUBLIC_SWAP_EMAIL || '').trim().toLowerCase();
const BOOTH_EMAIL = (process.env.EXPO_PUBLIC_BOOTH_EMAIL || '').trim().toLowerCase();
const BUY_POINTS_EMAIL = (process.env.EXPO_PUBLIC_SWAP_BUY_POINTS_EMAIL || '').trim().toLowerCase();

const getCustomerIdFromSession = (session, fallbackCustomerId = '') =>
  session?.customer?.id || session?.user?.id || fallbackCustomerId || '';

const resolveSessionForEmail = async (storedToken, storedCustomerId, email) => {
  if (!email) {
    throw new Error('Missing auth email configuration.');
  }

  if (storedToken) {
    try {
      console.log('[appSession] validating customer session', { email });
      const session = await checkCustomerSession(storedToken);
      if (session?.token) {
        console.log('[appSession] customer session valid', { email });
        return {
          token: session.token,
          customerId: getCustomerIdFromSession(session, storedCustomerId),
        };
      }
    } catch (error) {
      console.log('[appSession] customer session refresh required', {
        email,
        reason: error?.message || 'check failed',
      });
      // Refresh the token with mime login when the saved token is invalid.
    }
  }

  console.log('[appSession] obtaining fresh customer token', { email });
  const loginResponse = await loginAsCustomer(email);
  const token = loginResponse?.token || '';
  const customerId = loginResponse?.customer?.id || '';

  if (!token) {
    throw new Error(`Failed to get token for ${email}.`);
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
      if (session?.token) {
        console.log('[appSession] operator session valid');
        return {
          token: session.token,
          customerId: storedCustomerId,
        };
      }
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
    customerId: storedCustomerId,
  };
};

export const useAppSessionStore = create((set, get) => ({
  hydrated: false,
  checkingSession: false,
  loading: false,
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
      hasShopToken: Boolean(stored?.shopToken),
      hasBoothToken: Boolean(stored?.boothToken),
      hasGuestToken: Boolean(stored?.guestToken),
      hasBuyPointsToken: Boolean(stored?.buyPointsToken),
    });

    set({
      hydrated: true,
      checkingSession: true,
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
      const guestSession = await registerGuestSession();
      console.log('[appSession] guest session ready', {
        hasGuestToken: Boolean(guestSession?.guestToken || guestSession?.token),
      });
      const guestToken = guestSession?.guestToken || guestSession?.token || '';
      const shopSession = await resolveShopOperatorSession(get().shopToken, get().shopCustomerId, guestToken);
      const shopAuth = {
        shopToken: shopSession.token,
        boothToken: get().boothToken,
        guestToken,
        buyPointsEmail: BUY_POINTS_EMAIL,
        buyPointsToken: get().buyPointsToken,
        shopCustomerId: shopSession.customerId,
        boothCustomerId: get().boothCustomerId,
        buyPointsCustomerId: get().buyPointsCustomerId,
      };
      await saveStoredAppSession(shopAuth);
      set({
        shopToken: shopAuth.shopToken,
        guestToken: shopAuth.guestToken,
        shopCustomerId: shopAuth.shopCustomerId,
      });
      console.log('[appSession] shop token saved', {
        shopToken: shopAuth.shopToken,
      });

      const [boothSession, buyPointsSession] = await Promise.all([
        resolveSessionForEmail(get().boothToken, get().boothCustomerId, BOOTH_EMAIL),
        BUY_POINTS_EMAIL
          ? resolveSessionForEmail(get().buyPointsToken, get().buyPointsCustomerId, BUY_POINTS_EMAIL)
          : Promise.resolve({ token: '', customerId: '' }),
      ]);

      const auth = {
        ...shopAuth,
        boothToken: boothSession.token,
        buyPointsToken: buyPointsSession.token,
        boothCustomerId: boothSession.customerId,
        buyPointsCustomerId: buyPointsSession.customerId,
      };
      await saveStoredAppSession(auth);
      console.log('[appSession] refreshTokens saved', {
        hasShopToken: Boolean(auth.shopToken),
        hasBoothToken: Boolean(auth.boothToken),
        hasGuestToken: Boolean(auth.guestToken),
        hasBuyPointsToken: Boolean(auth.buyPointsToken),
      });

      set({
        hydrated: true,
        loading: false,
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

      return auth;
    } catch (error) {
      await clearStoredAppSession();
      set({
        loading: false,
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
