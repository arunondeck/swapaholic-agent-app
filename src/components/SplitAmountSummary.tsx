import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '../styles/commonStyles';

const defaultPalette = {
  mainCardBackgroundColor: 'rgba(72, 141, 61, 0.14)',
  labelColor: '#255322',
  valueColor: '#1d3b19',
  cardBorderColor: 'rgba(72, 141, 61, 0.28)',
};

export const SplitAmountSummary = ({
  mainTitle,
  amount,
  sub1Title,
  sub1Amount,
  sub2Title,
  sub2Amount,
  palette = defaultPalette,
}) => {
  const {
    mainCardBackgroundColor,
    labelColor,
    valueColor,
    cardBorderColor,
  } = palette;

  return (
    <View style={styles.splitAmountSummary}>
      <View style={[styles.splitAmountMainCard, { backgroundColor: mainCardBackgroundColor }]}>
        <Text style={[styles.splitAmountMainLabel, { color: labelColor }]}>{mainTitle}</Text>
        <Text style={[styles.splitAmountMainValue, { color: valueColor }]}>{amount}</Text>
      </View>

      <View style={styles.splitAmountRow}>
        <View style={[styles.splitAmountCard, styles.splitAmountCardLeft, { borderColor: cardBorderColor }]}>
          <Text style={[styles.splitAmountLabel, { color: labelColor }]}>{sub1Title}</Text>
          <Text style={[styles.splitAmountValue, { color: valueColor }]}>{sub1Amount}</Text>
        </View>
        <View style={[styles.splitAmountCard, styles.splitAmountCardRight, { borderColor: cardBorderColor }]}>
          <Text style={[styles.splitAmountLabel, { color: labelColor }]}>{sub2Title}</Text>
          <Text style={[styles.splitAmountValue, { color: valueColor }]}>{sub2Amount}</Text>
        </View>
      </View>
    </View>
  );
};
