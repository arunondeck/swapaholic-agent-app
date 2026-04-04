export interface RouteParamMap {
  home: Record<string, never>;
  booth: Record<string, never>;
  booths: { focusSearch?: boolean };
  boothDetails: { boothId?: string };
  boothAllCheckouts: Record<string, never>;
  boothCheckout: Record<string, never>;
  boothCheckoutDetail: { checkoutId?: string };
  boothApplications: Record<string, never>;
  boothReview: Record<string, never>;
  boothTags: Record<string, never>;
  swap: Record<string, never>;
  swapPlans: Record<string, never>;
  pickupCards: Record<string, never>;
  inspection: Record<string, never>;
  approval: { email?: string };
  swapTags: Record<string, never>;
  checkout: { email?: string; mode?: 'customer' | 'nonCustomer' };
  customerPortal: Record<string, never>;
  customerOverview: { email?: string };
  customerSubscriptions: { email?: string };
  customerSubscriptionDetail: { email?: string; subscriptionId?: string; backToOverview?: boolean };
  customerPickups: { email?: string };
  customerPickupDetail: { email?: string; pickupId?: string };
  customerItemEntry: { email?: string; sourceType?: string; sourceId?: string };
  customerOrders: { email?: string };
  customerOrderDetail: { email?: string; orderId?: string };
  customerSwappedIn: { email?: string };
  buySubscription: { email?: string };
  ops: Record<string, never>;
  opsSalesReports: Record<string, never>;
  opsProducts: Record<string, never>;
  opsCustomers: Record<string, never>;
  opsSubscriptions: Record<string, never>;
}

export type RouteName = keyof RouteParamMap;

export interface RouteEntry<R extends RouteName = RouteName> {
  route: R;
  params: RouteParamMap[R];
}

export type AppPush = <R extends RouteName>(route: R, params?: RouteParamMap[R]) => void;
export type AppPop = () => void;

export interface AppNavigationContextValue {
  currentRoute: RouteName;
  currentModeHomeRoute: RouteName | null;
  goToModeHome: () => void;
}

export interface PushPopProps {
  push: AppPush;
  pop: AppPop;
}
