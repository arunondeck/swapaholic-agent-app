import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles/commonStyles';

export const Card = ({ title, subtitle, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <Text style={styles.cardTitle}>{title}</Text>
    {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
  </TouchableOpacity>
);
