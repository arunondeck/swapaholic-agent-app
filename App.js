import React, { useMemo, useState } from 'react';

import { HomeScreen } from './src/screens/HomeScreen';
import { BoothApplicationsScreen } from './src/screens/booth/BoothApplicationsScreen';
import { BoothOpsScreen } from './src/screens/booth/BoothOpsScreen';
import { BoothReviewScreen } from './src/screens/booth/BoothReviewScreen';
import { BoothTagsScreen } from './src/screens/booth/BoothTagsScreen';
import { OpsCustomersScreen } from './src/screens/ops/OpsCustomersScreen';
import { OpsModeScreen } from './src/screens/ops/OpsModeScreen';
import { OpsProductsScreen } from './src/screens/ops/OpsProductsScreen';
import { OpsSubscriptionsScreen } from './src/screens/ops/OpsSubscriptionsScreen';
import { ApprovalScreen } from './src/screens/swap/ApprovalScreen';
import { CheckoutScreen } from './src/screens/swap/CheckoutScreen';
import { CustomerPortalScreen } from './src/screens/swap/CustomerPortalScreen';
import { InspectionScreen } from './src/screens/swap/InspectionScreen';
import { PickupCardsScreen } from './src/screens/swap/PickupCardsScreen';
import { SwapModeScreen } from './src/screens/swap/SwapModeScreen';
import { SwapPlansScreen } from './src/screens/swap/SwapPlansScreen';
import { SwapTagsScreen } from './src/screens/swap/SwapTagsScreen';

export default function App() {
  const [stack, setStack] = useState([{ route: 'home' }]);

  const current = stack[stack.length - 1];
  const push = (route) => setStack((prev) => [...prev, { route }]);
  const pop = () => setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));

  const screens = useMemo(
    () => ({
      home: <HomeScreen push={push} />,
      booth: <BoothOpsScreen push={push} pop={pop} />,
      boothApplications: <BoothApplicationsScreen pop={pop} />,
      boothReview: <BoothReviewScreen pop={pop} />,
      boothTags: <BoothTagsScreen pop={pop} />,
      swap: <SwapModeScreen push={push} pop={pop} />,
      swapPlans: <SwapPlansScreen pop={pop} />,
      pickupCards: <PickupCardsScreen pop={pop} />,
      inspection: <InspectionScreen pop={pop} />,
      approval: <ApprovalScreen pop={pop} />,
      swapTags: <SwapTagsScreen pop={pop} />,
      checkout: <CheckoutScreen pop={pop} />,
      customerPortal: <CustomerPortalScreen pop={pop} />,
      ops: <OpsModeScreen push={push} pop={pop} />,
      opsProducts: <OpsProductsScreen pop={pop} />,
      opsCustomers: <OpsCustomersScreen pop={pop} />,
      opsSubscriptions: <OpsSubscriptionsScreen pop={pop} />,
    }),
    [current]
  );

  return screens[current.route];
}
