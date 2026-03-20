import React from 'react';
import { Text, View } from 'react-native';
import { Card } from '../../components/Card';
import { ScreenShell } from '../../components/ScreenShell';
import { styles } from '../../styles/commonStyles';

export const OpsModeScreen = ({ push, pop }) => (
  <ScreenShell title="Ops Mode" subtitle="Today's sales and marketplace summary" onBack={pop} backgroundColor="#dcfce7">
    <View style={styles.summaryCard}>
      <Text style={styles.summaryHeading}>Today's Sales</Text>
      <Text style={styles.helperText}>21 Mar 2026</Text>

      <Text style={styles.summarySubheading}>Swap</Text>
      <Text style={styles.summaryText}>New Customers</Text>
      <Text style={styles.summaryText}>0- flexi pkg</Text>
      <Text style={styles.summaryText}>1- buy pts</Text>
      <Text style={styles.summaryText}>Existing Customers</Text>
      <Text style={styles.summaryText}>0- flexi pkg</Text>
      <Text style={styles.summaryText}>0- extend pts validity</Text>
      <Text style={styles.summaryText}>0- bal pkg</Text>
      <Text style={styles.summaryText}>0- buy pts</Text>
      <Text style={styles.summaryText}>2- swap out</Text>
      <Text style={styles.summaryText}>Cash Sales - $0</Text>
      <Text style={styles.summaryText}>Paynow / Card payment - $10</Text>
      <Text style={styles.summaryText}>Total Sales - $10</Text>

      <Text style={styles.summarySubheading}>Marketplace</Text>
      <Text style={styles.summaryText}>Total Items Sold -21</Text>
      <Text style={styles.summaryText}>Sellers items - 7</Text>
      <Text style={styles.summaryText}>Swapaholic items - 0</Text>
      <Text style={styles.summaryText}>Total transactions for the day - 3</Text>
      <Text style={styles.summaryText}>Cash Sales - $0</Text>
      <Text style={styles.summaryText}>Paynow / Card payment - $251</Text>
      <Text style={styles.summaryText}>Total Sales - $251</Text>

      <Text style={styles.summarySubheading}>Grand Total: $261</Text>
    </View>

    <Card title="Sales Reports" subtitle="Daily and range-based sales reports" onPress={() => push('opsSalesReports')} />
    <Card title="Products List" subtitle="UI placeholder" onPress={() => push('opsProducts')} />
    <Card title="Customer List" subtitle="UI placeholder" onPress={() => push('opsCustomers')} />
    <Card title="Subscriptions List" subtitle="UI placeholder" onPress={() => push('opsSubscriptions')} />
  </ScreenShell>
);
