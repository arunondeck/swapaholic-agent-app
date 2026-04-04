import React, { createContext, useContext } from 'react';

const noop = () => {};

const AppNavigationContext = createContext({
  currentRoute: 'home',
  currentModeHomeRoute: null,
  goToModeHome: noop,
});

export const AppNavigationProvider = AppNavigationContext.Provider;

export const useAppNavigation = () => useContext(AppNavigationContext);
