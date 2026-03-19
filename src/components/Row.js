import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '../styles/commonStyles';

export const Row = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value}</Text>
  </View>
);
