import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles/commonStyles';

export const PaymentMethodModal = ({
  visible = false,
  paymentOptions = [],
  selectedMode = '',
  onSelectMode,
  onConfirm,
  onCancel,
  title = 'Select Payment Mode',
  helperText = 'Choose a payment mode.',
  confirmLabel = 'Confirm Payment',
  submitting = false,
}) => (
  <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
    <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)', justifyContent: 'center', padding: 20 }}>
      <View style={[styles.formCard, { gap: 14 }]}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.helperText}>{helperText}</Text>
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
            <Text style={styles.primaryButtonText}>{submitting ? 'Processing...' : confirmLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);
