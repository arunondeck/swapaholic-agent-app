import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles/commonStyles';

export const CheckoutPaymentSelector = ({
  paymentOptions = [],
  selectedMode = '',
  onSelectMode,
  onConfirm,
  onCancel,
  submitting = false,
  confirmLabel = 'Place Order',
}) => (
  <View style={[styles.formCard, { gap: 14 }]}>
    <Text style={styles.cardTitle}>Select Payment Mode</Text>
    <Text style={styles.helperText}>Choose a payment mode first. You can cancel this dialog to add or remove items.</Text>
    <View style={styles.chipRow}>
      {paymentOptions.map((option) => (
        <TouchableOpacity
          key={option.id}
          onPress={() => onSelectMode?.(option.id)}
          style={[styles.chip, selectedMode === option.id && styles.chipActive]}
          disabled={submitting}
        >
          <Text style={styles.chipText}>{option.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
    <View style={styles.row}>
      <TouchableOpacity onPress={onCancel} style={[styles.secondaryButton, { flex: 1 }]} disabled={submitting}>
        <Text style={styles.secondaryButtonText}>Cancel</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onConfirm}
        style={[styles.primaryButton, { flex: 1 }, (!selectedMode || submitting) && styles.primaryButtonDisabled]}
        disabled={!selectedMode || submitting}
      >
        <Text style={styles.primaryButtonText}>{submitting ? 'Placing...' : confirmLabel}</Text>
      </TouchableOpacity>
    </View>
  </View>
);
