import React from 'react';
import type { ReactNode } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles/commonStyles';

interface CardProps {
  title: ReactNode;
  subtitle?: ReactNode;
  onPress?: () => void;
  active?: boolean;
}

export const Card = ({ title, subtitle, onPress, active = false }: CardProps) => (
  <TouchableOpacity style={[styles.card, active && styles.cardActive]} onPress={onPress}>
    <Text style={styles.cardTitle}>{title}</Text>
    {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
  </TouchableOpacity>
);
