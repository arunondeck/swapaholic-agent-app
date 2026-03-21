import React, { useEffect, useMemo, useState } from 'react';
import { BackHandler } from 'react-native';

import { HomeScreen } from './src/screens/HomeScreen';
import { BoothAllCheckoutsScreen } from './src/screens/booth/BoothAllCheckoutsScreen';
import { BoothApplicationsScreen } from './src/screens/booth/BoothApplicationsScreen';
import { BoothCheckoutScreen } from './src/screens/booth/BoothCheckoutScreen';
import { BoothDetailsScreen } from './src/screens/booth/BoothDetailsScreen';
import { BoothsScreen } from './src/screens/booth/BoothsScreen';
import { BoothOpsScreen } from './src/screens/booth/BoothOpsScreen';
import { BoothReviewScreen } from './src/screens/booth/BoothReviewScreen';
import { BoothTagsScreen } from './src/screens/booth/BoothTagsScreen';
import { OpsCustomersScreen } from './src/screens/ops/OpsCustomersScreen';
import { OpsModeScreen } from './src/screens/ops/OpsModeScreen';
import { OpsProductsScreen } from './src/screens/ops/OpsProductsScreen';
import { OpsSalesReportsScreen } from './src/screens/ops/OpsSalesReportsScreen';
import { OpsSubscriptionsScreen } from './src/screens/ops/OpsSubscriptionsScreen';
import { ApprovalScreen } from './src/screens/swap/ApprovalScreen';
import { BuySubscriptionScreen } from './src/screens/swap/BuySubscriptionScreen';
import { CheckoutScreen } from './src/screens/swap/CheckoutScreen';
import { CustomerItemEntryScreen } from './src/screens/swap/CustomerItemEntryScreen';
import { CustomerOrdersScreen } from './src/screens/swap/CustomerOrdersScreen';
import { CustomerOverviewScreen } from './src/screens/swap/CustomerOverviewScreen';
import { CustomerPickupDetailScreen } from './src/screens/swap/CustomerPickupDetailScreen';
import { CustomerPickupsScreen } from './src/screens/swap/CustomerPickupsScreen';
import { CustomerPortalScreen } from './src/screens/swap/CustomerPortalScreen';
import { CustomerSubscriptionDetailScreen } from './src/screens/swap/CustomerSubscriptionDetailScreen';
import { CustomerSubscriptionsScreen } from './src/screens/swap/CustomerSubscriptionsScreen';
import { CustomerSwappedInScreen } from './src/screens/swap/CustomerSwappedInScreen';
import { InspectionScreen } from './src/screens/swap/InspectionScreen';
import { PickupCardsScreen } from './src/screens/swap/PickupCardsScreen';
import { SwapModeScreen } from './src/screens/swap/SwapModeScreen';
import { SwapPlansScreen } from './src/screens/swap/SwapPlansScreen';
import { SwapTagsScreen } from './src/screens/swap/SwapTagsScreen';

export default function App() {
  const [stack, setStack] = useState([{ route: 'home', params: { mode: 'swap' } }]);

  const current = stack[stack.length - 1];
  const push = (route, params = {}) => setStack((prev) => [...prev, { route, params }]);
  const pop = () => setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  const updateCurrentParams = (params) =>
    setStack((prev) =>
      prev.map((entry, index) => (index === prev.length - 1 ? { ...entry, params: { ...entry.params, ...params } } : entry))
    );

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stack.length > 1) {
        pop();
        return true;
      }

      return false;
    });

    return () => subscription.remove();
  }, [stack.length]);

  const screens = useMemo(
    () => ({
      home: (params) => <HomeScreen push={push} mode={params?.mode || 'swap'} setMode={(mode) => updateCurrentParams({ mode })} />,
      booth: () => <BoothOpsScreen push={push} pop={pop} />,
      booths: (params) => <BoothsScreen push={push} pop={pop} focusSearch={params?.focusSearch} />,
      boothDetails: (params) => <BoothDetailsScreen pop={pop} boothId={params?.boothId} />,
      boothAllCheckouts: () => <BoothAllCheckoutsScreen pop={pop} />,
      boothCheckout: () => <BoothCheckoutScreen pop={pop} />,
      boothApplications: () => <BoothApplicationsScreen pop={pop} />,
      boothReview: () => <BoothReviewScreen pop={pop} />,
      boothTags: () => <BoothTagsScreen pop={pop} />,
      swap: () => <SwapModeScreen push={push} pop={pop} />,
      swapPlans: () => <SwapPlansScreen pop={pop} />,
      pickupCards: () => <PickupCardsScreen pop={pop} />,
      inspection: () => <InspectionScreen pop={pop} />,
      approval: () => <ApprovalScreen pop={pop} />,
      swapTags: () => <SwapTagsScreen pop={pop} />,
      checkout: (params) => <CheckoutScreen pop={pop} customerEmail={params?.email} />,
      customerPortal: () => <CustomerPortalScreen push={push} pop={pop} />,
      customerOverview: (params) => <CustomerOverviewScreen push={push} pop={pop} customerEmail={params?.email} />,
      customerSubscriptions: (params) => <CustomerSubscriptionsScreen push={push} pop={pop} customerEmail={params?.email} />,
      customerSubscriptionDetail: (params) => (
        <CustomerSubscriptionDetailScreen
          push={push}
          pop={pop}
          customerEmail={params?.email}
          subscriptionId={params?.subscriptionId}
        />
      ),
      customerPickups: (params) => <CustomerPickupsScreen push={push} pop={pop} customerEmail={params?.email} />,
      customerPickupDetail: (params) => (
        <CustomerPickupDetailScreen push={push} pop={pop} customerEmail={params?.email} pickupId={params?.pickupId} />
      ),
      customerItemEntry: (params) => (
        <CustomerItemEntryScreen
          pop={pop}
          customerEmail={params?.email}
          sourceType={params?.sourceType}
          sourceId={params?.sourceId}
        />
      ),
      customerOrders: (params) => <CustomerOrdersScreen pop={pop} customerEmail={params?.email} />,
      customerSwappedIn: (params) => <CustomerSwappedInScreen pop={pop} customerEmail={params?.email} />,
      buySubscription: (params) => <BuySubscriptionScreen pop={pop} customerEmail={params?.email} />,
      ops: () => <OpsModeScreen push={push} pop={pop} />,
      opsSalesReports: () => <OpsSalesReportsScreen pop={pop} />,
      opsProducts: () => <OpsProductsScreen pop={pop} />,
      opsCustomers: () => <OpsCustomersScreen pop={pop} />,
      opsSubscriptions: () => <OpsSubscriptionsScreen pop={pop} />,
    }),
    [stack.length]
  );

  return screens[current.route]?.(current.params);
}
