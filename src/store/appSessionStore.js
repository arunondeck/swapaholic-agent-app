import { create } from 'zustand';
import { checkCustomerSession, loginAsCustomer } from '../api/swapOpsApi';
import { clearStoredAppSession, loadStoredAppSession, saveStoredAppSession } from './appSessionStorage';

const SHOP_EMAIL = (process.env.EXPO_PUBLIC_SWAP_EMAIL || '').trim().toLowerCase();
const BOOTH_EMAIL = (process.env.EXPO_PUBLIC_BOOTH_EMAIL || '').trim().toLowerCase();

const resolveTokenForEmail = async (storedToken, email) => {
  if (!email) {
    throw new Error('Missing auth email configuration.');
  }

  if (storedToken) {
    try {
      const session = await checkCustomerSession(storedToken);
      if (session?.token) {
        return session.token;
      }
    } catch (error) {
      // Refresh the token with mime login when the saved token is invalid.
    }
  }

  const loginResponse = await loginAsCustomer(email);
  const token = loginResponse?.token || '';

  if (!token) {
    throw new Error(`Failed to get token for ${email}.`);
  }

  return token;
};

export const useAppSessionStore = create((set, get) => ({
  hydrated: false,
  checkingSession: false,
  loading: false,
  shopToken: '',
  boothToken: '',
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
      const [shopToken, boothToken] = await Promise.all([
        resolveTokenForEmail(get().shopToken, SHOP_EMAIL),
        resolveTokenForEmail(get().boothToken, BOOTH_EMAIL),
      ]);

      const auth = { shopToken, boothToken };
      await saveStoredAppSession(auth);

      set({
        hydrated: true,
        loading: false,
        shopToken,
        boothToken,
        error: '',
      });

      return auth;
    } catch (error) {
      await clearStoredAppSession();
      set({
        loading: false,
        shopToken: '',
        boothToken: '',
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
      error: '',
    });
  },
}));
