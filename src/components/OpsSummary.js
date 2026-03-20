import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { styles } from '../styles/commonStyles';

const swapMetrics = [
  { value: '0', label: 'New Customers', tone: 'swap' },
  { value: '0', label: 'Flexi Pkg', tone: 'swap' },
  { value: '1', label: 'Buy Pts', tone: 'swap' },
  { value: '0', label: 'Existing Flexi', tone: 'swap' },
  { value: '0', label: 'Extend Validity', tone: 'swap' },
  { value: '0', label: 'Bal Pkg', tone: 'swap' },
  { value: '0', label: 'Existing Buy Pts', tone: 'swap' },
  { value: '2', label: 'Swap Out', tone: 'swap' },
  { value: '$0', label: 'Cash Sales', tone: 'swap' },
  { value: '$10', label: 'PayNow / Card', tone: 'swap' },
  { value: '$10', label: 'Total Sales', tone: 'swap' },
];

const marketplaceMetrics = [
  { value: '21', label: 'Total Items Sold', tone: 'marketplace' },
  { value: '7', label: 'Sellers Items', tone: 'marketplace' },
  { value: '0', label: 'Swapaholic Items', tone: 'marketplace' },
  { value: '3', label: 'Transactions', tone: 'marketplace' },
  { value: '$0', label: 'Cash Sales', tone: 'marketplace' },
  { value: '$251', label: 'PayNow / Card', tone: 'marketplace' },
  { value: '$251', label: 'Total Sales', tone: 'marketplace' },
  { value: '$261', label: 'Grand Total', tone: 'marketplace' },
];

const chunkMetrics = (metrics, chunkSize = 4) => {
  const chunks = [];
  for (let index = 0; index < metrics.length; index += chunkSize) {
    chunks.push(metrics.slice(index, index + chunkSize));
  }
  return chunks;
};

const MetricGrid = ({ title, metrics, tone }) => (
  <View style={styles.opsSection}>
    <View style={styles.opsSectionBar}>
      <Text style={styles.opsSectionBarText}>{title}</Text>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.opsGridScroll}>
      <View style={styles.opsGridContent}>
        {chunkMetrics(metrics).map((row, rowIndex) => (
          <View key={`${title}-${rowIndex}`} style={styles.opsMetricRow}>
            {row.map((metric) => (
              <View
                key={`${title}-${metric.label}`}
                style={[styles.opsMetricCard, tone === 'swap' ? styles.opsMetricCardSwap : styles.opsMetricCardMarketplace]}
              >
                <Text style={styles.opsMetricValue}>{metric.value}</Text>
                <Text style={styles.opsMetricLabel}>{metric.label}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  </View>
);

export const OpsSummary = ({ title = "Today's Sales", dateLabel = '21 Mar 2026' }) => (
  <View style={styles.summaryCard}>
    <Text style={styles.summaryHeading}>{title}</Text>
    <Text style={styles.helperText}>{dateLabel}</Text>
    <MetricGrid title="Swap" metrics={swapMetrics} tone="swap" />
    <MetricGrid title="Marketplace" metrics={marketplaceMetrics} tone="marketplace" />
  </View>
);
