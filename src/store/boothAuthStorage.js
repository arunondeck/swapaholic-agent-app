import AsyncStorage from '@react-native-async-storage/async-storage';

export const BOOTH_AUTH_STORAGE_KEY = 'swapaholic.booth.auth';

export const loadStoredBoothAuth = async () => {
  try {
    const raw = await AsyncStorage.getItem(BOOTH_AUTH_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to load booth auth from storage', error);
    return null;
  }
};

export const saveStoredBoothAuth = async (auth) => {
  try {
    if (!auth?.token) {
      await AsyncStorage.removeItem(BOOTH_AUTH_STORAGE_KEY);
      return;
    }

    await AsyncStorage.setItem(BOOTH_AUTH_STORAGE_KEY, JSON.stringify(auth));
  } catch (error) {
    console.warn('Failed to persist booth auth', error);
  }
};

export const clearStoredBoothAuth = async () => {
  try {
    await AsyncStorage.removeItem(BOOTH_AUTH_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear booth auth', error);
  }
};

export const getStoredBoothToken = async () => {
  const auth = await loadStoredBoothAuth();
  return auth?.token || process.env.EXPO_PUBLIC_BOOTH_GRAPHQL_TOKEN || '';
};
