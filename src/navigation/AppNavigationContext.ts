import React, { createContext, useContext } from 'react';
import type { AppNavigationContextValue } from '../types/navigation';

const noop = () => {};

const AppNavigationContext = createContext<AppNavigationContextValue>({
  currentRoute: 'home',
  currentModeHomeRoute: null,
  goToModeHome: noop,
});

export const AppNavigationProvider = AppNavigationContext.Provider;

export const useAppNavigation = () => useContext(AppNavigationContext);
