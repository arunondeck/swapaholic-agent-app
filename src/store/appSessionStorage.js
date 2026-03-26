import AsyncStorage from '@react-native-async-storage/async-storage';

export const APP_SESSION_STORAGE_KEY = 'swapaholic.app.auth';
let appSessionCache = null;

export const loadStoredAppSession = async () => {
  try {
    if (appSessionCache) {
      return appSessionCache;
    }

    const raw = await AsyncStorage.getItem(APP_SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    appSessionCache = JSON.parse(raw);
    return appSessionCache;
  } catch (error) {
    console.warn('Failed to load app session from storage', error);
    return null;
  }
};

export const saveStoredAppSession = async (session) => {
  try {
    if (!session?.shopToken && !session?.boothToken) {
      appSessionCache = null;
      await AsyncStorage.removeItem(APP_SESSION_STORAGE_KEY);
      return;
    }

    appSessionCache = session;
    await AsyncStorage.setItem(APP_SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch (error) {
    console.warn('Failed to persist app session', error);
  }
};

export const clearStoredAppSession = async () => {
  try {
    appSessionCache = null;
    await AsyncStorage.removeItem(APP_SESSION_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear app session', error);
  }
};

export const getCachedStoredAppSession = () => appSessionCache;

export const getStoredShopToken = async () => {
  const session = appSessionCache || (await loadStoredAppSession());
  return session?.shopToken || '';
};

export const getStoredBoothToken = async () => {
  const session = appSessionCache || (await loadStoredAppSession());
  return session?.boothToken || '';
};
