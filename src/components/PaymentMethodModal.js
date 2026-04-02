import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles/commonStyles';

export const PaymentMethodModal = ({
  visible = false,
  paymentOptions = [],
  onSelectMode,
  onCancel,
  title = 'Select Payment Mode',
  helperText = 'Choose a payment mode.',
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
              style={styles.chip}
            >
              <Text style={styles.chipText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity onPress={onCancel} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);
