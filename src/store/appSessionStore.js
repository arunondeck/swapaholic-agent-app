import { create } from 'zustand';
import { checkCustomerSession, loginAsCustomer, loginAsShopUser } from '../api/swapOpsApi';
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
      const session = await checkCustomerSession(storedToken);
      if (session?.token) {
        return {
          token: session.token,
          customerId: getCustomerIdFromSession(session, storedCustomerId),
        };
      }
    } catch (error) {
      // Refresh the token with mime login when the saved token is invalid.
    }
  }

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

const resolveShopOperatorSession = async (storedToken = '', storedCustomerId = '') => {
  if (storedToken) {
    return {
      token: storedToken,
      customerId: storedCustomerId,
    };
  }

  const session = await loginAsShopUser();
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

    set({
      hydrated: true,
      checkingSession: true,
      shopToken: stored?.shopToken || '',
      boothToken: stored?.boothToken || '',
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
      const [shopSession, boothSession] = await Promise.all([
        resolveShopOperatorSession(get().shopToken, get().shopCustomerId),
        resolveSessionForEmail(get().boothToken, get().boothCustomerId, BOOTH_EMAIL),
      ]);

      const buyPointsSession = BUY_POINTS_EMAIL
        ? await resolveSessionForEmail(get().buyPointsToken, get().buyPointsCustomerId, BUY_POINTS_EMAIL)
        : { token: '', customerId: '' };

      const auth = {
        shopToken: shopSession.token,
        boothToken: boothSession.token,
        buyPointsEmail: BUY_POINTS_EMAIL,
        buyPointsToken: buyPointsSession.token,
        shopCustomerId: shopSession.customerId,
        boothCustomerId: boothSession.customerId,
        buyPointsCustomerId: buyPointsSession.customerId,
      };
      await saveStoredAppSession(auth);

      set({
        hydrated: true,
        loading: false,
        shopToken: auth.shopToken,
        boothToken: auth.boothToken,
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
      buyPointsEmail: '',
      buyPointsToken: '',
      shopCustomerId: '',
      boothCustomerId: '',
      buyPointsCustomerId: '',
      error: '',
    });
  },
}));
