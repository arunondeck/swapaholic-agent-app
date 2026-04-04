import React from 'react';
import { Text, View } from 'react-native';
import { SplitAmountSummary } from './SplitAmountSummary';
import { TitleCategorizedSummary } from './TitleCategorizedSummary';
import { styles } from '../styles/commonStyles';

const swapSplitAmountPalette = {
  mainCardBackgroundColor: 'rgba(72, 141, 61, 0.14)',
  labelColor: '#255322',
  valueColor: '#1d3b19',
  cardBorderColor: 'rgba(72, 141, 61, 0.28)',
};

const marketplaceSplitAmountPalette = {
  mainCardBackgroundColor: 'rgba(255, 102, 101, 0.14)',
  labelColor: '#8f2323',
  valueColor: '#7a1d1d',
  cardBorderColor: 'rgba(255, 102, 101, 0.28)',
};

const swapSalesMetrics = {
  totalSales: '$10',
  payNowCard: '$10',
  cash: '$0',
};

const swapNewCustomerMetrics = {
  'Flexi Pkg': '0',
  'Buy Pts': '1',
};

const swapExistingCustomerMetrics = {
  'Swap Out': '2',
  'Flex Pkg': '0',
  'Bal Pkg': '0',
  'Buy Pts': '0',
  'Extend Pts Validity': '0',
};

const marketplaceSalesMetrics = {
  totalSales: '$251',
  cash: '$0',
  payNowCard: '$251',
};

const marketplaceTransactionMetrics = {
  Transactions: '3',
};

const marketplaceItemMetrics = {
  totalItemsSold: '21',
  sellerItems: '7',
  swapaholicItems: '0',
};

const MarketplaceSummary = () => (
  <View style={styles.opsSection}>
    <View style={[styles.opsSectionBar, styles.opsSectionBarMarketplace]}>
      <Text style={styles.opsSectionBarText}>Marketplace</Text>
    </View>
    <View style={styles.opsSectionContentMarketplace}>
      <SplitAmountSummary
        mainTitle="Total Sales"
        amount={marketplaceSalesMetrics.totalSales}
        sub1Title="Cash"
        sub1Amount={marketplaceSalesMetrics.cash}
        sub2Title="PayNow / Card"
        sub2Amount={marketplaceSalesMetrics.payNowCard}
        palette={marketplaceSplitAmountPalette}
      />
      <View style={styles.marketplaceTransactionRow}>
        <Text style={styles.marketplaceTransactionLabel}>Total Transactions: </Text>
        <Text style={styles.marketplaceTransactionValue}>{marketplaceTransactionMetrics.Transactions}</Text>
      </View>
      <SplitAmountSummary
        mainTitle="Total Items Sold"
        amount={marketplaceItemMetrics.totalItemsSold}
        sub1Title="Seller Items"
        sub1Amount={marketplaceItemMetrics.sellerItems}
        sub2Title="Swapaholic Items"
        sub2Amount={marketplaceItemMetrics.swapaholicItems}
        palette={marketplaceSplitAmountPalette}
      />
    </View>
  </View>
);

const SwapSummary = () => (
  <View style={styles.opsSection}>
    <View style={[styles.opsSectionBar, styles.opsSectionBarSwap]}>
      <Text style={styles.opsSectionBarText}>Swap</Text>
    </View>
    <View style={styles.opsSectionContent}>
      <SplitAmountSummary
        mainTitle="Total Sales"
        amount={swapSalesMetrics.totalSales}
        sub1Title="PayNow / Card"
        sub1Amount={swapSalesMetrics.payNowCard}
        sub2Title="Cash"
        sub2Amount={swapSalesMetrics.cash}
        palette={swapSplitAmountPalette}
      />

      <TitleCategorizedSummary title="New Customers" data={swapNewCustomerMetrics} variant="swap" />
      <TitleCategorizedSummary title="Existing Customer" data={swapExistingCustomerMetrics} variant="swap" />
    </View>
  </View>
);

export const OpsSummary = ({ title = "Today's Sales", dateLabel = '21 Mar 2026', showHeader = true, headerVariant = 'dark' }) => (
  <View style={styles.summaryCard}>
    {showHeader ? (
      <View style={[styles.summaryHeaderBar, headerVariant === 'plain' && styles.summaryHeaderBarPlain]}>
        <Text style={[styles.summaryHeading, headerVariant === 'plain' && styles.summaryHeadingPlain]}>{title}</Text>
        <Text style={[styles.summaryHeaderDate, headerVariant === 'plain' && styles.summaryHeaderDatePlain]}>{dateLabel}</Text>
      </View>
    ) : null}
    <View style={styles.summaryContent}>
      <SwapSummary />
      <MarketplaceSummary />
    </View>
  </View>
);
