import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { CameraView } from 'expo-camera';
import type { BarcodeScanningResult } from 'expo-camera';
import { styles } from '../styles/commonStyles';
import { DEFAULT_CAMERA_BARCODE_TYPES } from '../services/cameraScannerService';

interface CameraScannerProps {
  onBarcodeScanned?: (event: BarcodeScanningResult) => void;
  onClose?: () => void;
  scannerReady?: boolean;
  title?: string;
  helperText?: string;
  barcodeTypes?: readonly string[];
}

export const CameraScanner = ({
  onBarcodeScanned,
  onClose,
  scannerReady,
  title = 'Barcode Scanner',
  helperText = 'Point the camera at a QR or barcode.',
  barcodeTypes = DEFAULT_CAMERA_BARCODE_TYPES,
}: CameraScannerProps) => (
  <View style={styles.scannerCard}>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.helperText}>{helperText}</Text>
    <View style={styles.cameraFrame}>
      <CameraView
        style={styles.cameraPreview}
        barcodeScannerSettings={{ barcodeTypes: barcodeTypes as any }}
        onBarcodeScanned={scannerReady ? onBarcodeScanned : undefined}
        facing="back"
      />
    </View>
    <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
      <Text style={styles.secondaryButtonText}>Close Scanner</Text>
    </TouchableOpacity>
  </View>
);
