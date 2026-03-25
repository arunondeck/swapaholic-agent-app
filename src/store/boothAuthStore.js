import { create } from 'zustand';
import { boothLogin } from '../api/boothGraphqlApi';
import { clearStoredBoothAuth, loadStoredBoothAuth, saveStoredBoothAuth } from './boothAuthStorage';

export const useBoothAuthStore = create((set, get) => ({
  hydrated: false,
  loading: false,
  token: process.env.EXPO_PUBLIC_BOOTH_GRAPHQL_TOKEN || '',
  user: null,
  error: '',
  hydrate: async () => {
    if (get().hydrated) {
      return;
    }

    const stored = await loadStoredBoothAuth();
    set({
      hydrated: true,
      token: stored?.token || process.env.EXPO_PUBLIC_BOOTH_GRAPHQL_TOKEN || '',
      user: stored?.user || null,
    });
  },
  login: async (email, password) => {
    set({ loading: true, error: '' });

    try {
      const result = await boothLogin(email, password);
      const auth = {
        token: result?.token || '',
        user: result?.user || null,
      };

      await saveStoredBoothAuth(auth);
      set({
        loading: false,
        token: auth.token,
        user: auth.user,
        error: '',
      });

      return auth;
    } catch (error) {
      set({
        loading: false,
        error: error?.message || 'Unable to sign in to the booth backend.',
      });
      throw error;
    }
  },
  logout: async () => {
    await clearStoredBoothAuth();
    set({
      token: process.env.EXPO_PUBLIC_BOOTH_GRAPHQL_TOKEN || '',
      user: null,
      error: '',
    });
  },
}));
