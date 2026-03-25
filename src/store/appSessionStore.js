import { create } from 'zustand';
import { checkCustomerSession, loginAppUser, registerGuestSession } from '../api/swapOpsApi';
import { clearStoredAppSession, loadStoredAppSession, saveStoredAppSession } from './appSessionStorage';

export const useAppSessionStore = create((set, get) => ({
  hydrated: false,
  checkingSession: false,
  loading: false,
  token: '',
  user: null,
  error: '',
  hydrate: async () => {
    if (get().hydrated) {
      return;
    }

    const stored = await loadStoredAppSession();
    const token = stored?.token || '';
    const user = stored?.user || null;

    set({
      hydrated: true,
      checkingSession: true,
      token,
      user,
      error: '',
    });

    try {
      if (!token) {
        await get().ensureGuestSession();
      } else {
        const session = await get().validateSession(token);
        if (!session) {
          await get().ensureGuestSession();
        }
      }
    } finally {
      set({ checkingSession: false });
    }
  },
  ensureGuestSession: async () => {
    const session = await registerGuestSession();
    const auth = {
      token: session?.token || '',
      user: null,
      sessionType: 'guest',
    };

    await saveStoredAppSession(auth);
    set({
      token: auth.token,
      user: null,
      error: '',
    });

    return auth;
  },
  validateSession: async (tokenOverride) => {
    const token = tokenOverride || get().token;
    if (!token) {
      return null;
    }

    try {
      const session = await checkCustomerSession(token);
      const auth = {
        token: session?.token || token,
        user: session?.user || session?.customer || get().user || null,
        sessionType: session?.user || session?.customer ? 'authenticated' : 'guest',
      };

      await saveStoredAppSession(auth);
      set({
        token: auth.token,
        user: auth.user,
        error: '',
      });

      return auth;
    } catch (error) {
      await clearStoredAppSession();
      set({
        token: '',
        user: null,
        error: '',
      });
      return null;
    }
  },
  login: async (email, password) => {
    set({ loading: true, error: '' });

    try {
      const bearerToken = get().token;
      const result = await loginAppUser(email, password, bearerToken);
      const auth = {
        token: result?.token || '',
        user: result?.user || result?.customer || null,
        sessionType: 'authenticated',
      };

      await saveStoredAppSession(auth);
      set({
        hydrated: true,
        loading: false,
        token: auth.token,
        user: auth.user,
        error: '',
      });

      return auth;
    } catch (error) {
      set({
        loading: false,
        error: error?.message || 'Unable to sign in to the app backend.',
      });
      throw error;
    }
  },
  logout: async () => {
    await clearStoredAppSession();
    const guestAuth = await get().ensureGuestSession();
    set({
      token: guestAuth.token,
      user: null,
      error: '',
    });
  },
}));
