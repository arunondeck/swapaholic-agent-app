import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Card } from '../components/Card';
import { OpsSummary } from '../components/OpsSummary';
import { ScreenShell } from '../components/ScreenShell';
import { styles } from '../styles/commonStyles';

const modeTabs = [
  { key: 'booth', label: 'Booth' },
  { key: 'swap', label: 'Swap' },
  { key: 'ops', label: 'Ops' },
];

const modeBackgrounds = {
  booth: '#e0f2fe',
  swap: '#ffe4e1',
  ops: '#dcfce7',
};

export const HomeScreen = ({ push, mode, setMode }) => {
  const activeMode = mode;

  return (
    <ScreenShell title="Swapaholic" subtitle="Operations workspace" backgroundColor={modeBackgrounds[activeMode]}>
      <View style={styles.tabsRow}>
        {modeTabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setMode(tab.key)}
            style={[styles.tabButton, activeMode === tab.key && styles.tabButtonActive]}
          >
            <Text style={[styles.tabButtonText, activeMode === tab.key && styles.tabButtonTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeMode === 'swap' ? (
        <>
          <Text style={styles.sectionTitle}>Swap</Text>
          <Card title="Customer Login" subtitle="Enter email and open customer summary" onPress={() => push('customerPortal')} />
          <Card title="Scan Pickups" subtitle="Open pickup scan and linked pickup flows" onPress={() => push('pickupCards')} />
          <Card title="View Subscriptions" subtitle="Browse swap subscription plans" onPress={() => push('swapPlans')} />
          <Card title="Checkout" subtitle="Scan products and redeem customer points" onPress={() => push('checkout')} />
        </>
      ) : null}

      {activeMode === 'booth' ? (
        <>
          <Text style={styles.sectionTitle}>Booth</Text>
          <Card title="View All Booths" subtitle="Browse and manage booth approvals" onPress={() => push('booths')} />
          <Card title="Search Booth" subtitle="Find specific booth by name or seller" onPress={() => push('booths', { focusSearch: true })} />
          <Card title="Completed Sales" subtitle="Review past transactions" onPress={() => push('boothAllCheckouts')} />
          <Card title="Checkout" subtitle="Process new sale" onPress={() => push('boothCheckout')} />
        </>
      ) : null}

      {activeMode === 'ops' ? (
        <>
          <OpsSummary headerVariant="plain" />
          <Card title="Sales Reports" subtitle="Daily and range-based sales reports" onPress={() => push('opsSalesReports')} />
          <Card title="Products List" subtitle="UI placeholder" onPress={() => push('opsProducts')} />
          <Card title="Customer List" subtitle="UI placeholder" onPress={() => push('opsCustomers')} />
          <Card title="Subscriptions List" subtitle="UI placeholder" onPress={() => push('opsSubscriptions')} />
        </>
      ) : null}
    </ScreenShell>
  );
};
