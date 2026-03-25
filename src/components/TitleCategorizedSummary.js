import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '../styles/commonStyles';

const HEADER_BACKGROUNDS = {
  swap: 'rgba(72, 141, 61, 0.24)',
  marketplace: 'rgba(255, 102, 101, 0.24)',
};

export const TitleCategorizedSummary = ({
  title,
  data,
  variant = 'swap',
  headerBackgroundColor = HEADER_BACKGROUNDS[variant] || HEADER_BACKGROUNDS.swap,
}) => (
  <View style={[styles.titleCategorizedSummary, variant === 'marketplace' && styles.titleCategorizedSummaryMarketplace]}>
    <View style={[styles.titleCategorizedSummaryHeader, { backgroundColor: headerBackgroundColor }]}>
      <Text style={[styles.titleCategorizedSummaryTitle, variant === 'marketplace' && styles.titleCategorizedSummaryTitleMarketplace]}>{title}</Text>
    </View>
    <View style={styles.titleCategorizedSummaryGrid}>
      {Object.entries(data).map(([label, value]) => (
        <View key={label} style={[styles.titleCategorizedSummaryCard, variant === 'marketplace' && styles.titleCategorizedSummaryCardMarketplace]}>
          <Text style={[styles.titleCategorizedSummaryLabel, variant === 'marketplace' && styles.titleCategorizedSummaryLabelMarketplace]}>{label}</Text>
          <Text style={[styles.titleCategorizedSummaryValue, variant === 'marketplace' && styles.titleCategorizedSummaryValueMarketplace]}>{value}</Text>
        </View>
      ))}
    </View>
  </View>
);
