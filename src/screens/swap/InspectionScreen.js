import React from 'react';
import { View } from 'react-native';
import { Row } from '../../components/Row';
import { ScreenShell } from '../../components/ScreenShell';
import { mockSwapProducts } from '../../data/mockData';
import { styles } from '../../styles/commonStyles';

export const InspectionScreen = ({ pop }) => (
  <ScreenShell title="Manual Inspection" subtitle="Assign points to scanned products" onBack={pop} backgroundColor="#ffe4e1">
    {mockSwapProducts.map((product) => (
      <View key={product.id} style={styles.listItem}>
        <Row label="SKU" value={product.unique_item_id_c} />
        <Row label="Product" value={product.name} />
        <Row label="Status" value={product.status_c} />
        <Row label="Points" value={`${product.evaluated_points_c} pts`} />
      </View>
    ))}
  </ScreenShell>
);
