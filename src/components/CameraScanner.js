import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { CameraView } from 'expo-camera';
import { styles } from '../styles/commonStyles';
import { DEFAULT_CAMERA_BARCODE_TYPES } from '../services/cameraScannerService';

export const CameraScanner = ({
  onBarcodeScanned,
  onClose,
  scannerReady,
  title = 'Barcode Scanner',
  helperText = 'Point the camera at a QR or barcode.',
  barcodeTypes = DEFAULT_CAMERA_BARCODE_TYPES,
}) => (
  <View style={styles.scannerCard}>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.helperText}>{helperText}</Text>
    <View style={styles.cameraFrame}>
      <CameraView
        style={styles.cameraPreview}
        barcodeScannerSettings={{ barcodeTypes }}
        onBarcodeScanned={scannerReady ? onBarcodeScanned : undefined}
        facing="back"
      />
    </View>
    <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
      <Text style={styles.secondaryButtonText}>Close Scanner</Text>
    </TouchableOpacity>
  </View>
);
