import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

const LoaderContext = createContext(null);
const loaderGif = require('../images/swapaholic-loading.gif');

const overlayStyles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.24)',
    zIndex: 999,
  },
  card: {
    minWidth: 180,
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 22,
    paddingVertical: 18,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  gif: {
    width: 88,
    height: 88,
  },
  text: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export const LoaderProvider = ({ children }) => {
  const [pendingCount, setPendingCount] = useState(0);
  const [message, setMessage] = useState('');

  const setLoaderMessage = useCallback((nextMessage = '') => {
    setMessage(String(nextMessage || ''));
  }, []);

  const showLoader = useCallback((nextMessage = '') => {
    setMessage(String(nextMessage || ''));
    setPendingCount((count) => count + 1);
  }, []);

  const hideLoader = useCallback(() => {
    setPendingCount((count) => {
      const nextCount = Math.max(0, count - 1);
      if (nextCount === 0) {
        setMessage('');
      }
      return nextCount;
    });
  }, []);

  const withLoader = useCallback(
    async (task, nextMessage = '') => {
      showLoader(nextMessage);
      try {
        return await task;
      } finally {
        hideLoader();
      }
    },
    [hideLoader, showLoader]
  );

  const value = useMemo(
    () => ({
      hideLoader,
      isLoading: pendingCount > 0,
      setLoaderMessage,
      showLoader,
      withLoader,
    }),
    [hideLoader, pendingCount, setLoaderMessage, showLoader, withLoader]
  );

  return (
    <LoaderContext.Provider value={value}>
      {children}
      {pendingCount > 0 ? (
        <View pointerEvents="auto" style={overlayStyles.backdrop}>
          <GlobalLoaderCard message={message} />
        </View>
      ) : null}
    </LoaderContext.Provider>
  );
};

export const GlobalLoaderCard = ({ message = '', border = true }) => (
  <View style={[overlayStyles.card, border === false ? { borderWidth: 0, borderColor: 'transparent' } : null]}>
    <Image source={loaderGif} style={overlayStyles.gif} />
    {message ? <Text style={overlayStyles.text}>{message}</Text> : null}
  </View>
);

export const useLoader = () => {
  const context = useContext(LoaderContext);
  if (!context) {
    throw new Error('useLoader must be used within a LoaderProvider.');
  }
  return context;
};
