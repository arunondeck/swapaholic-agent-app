import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Row } from '../../components/Row';
import { ScreenShell } from '../../components/ScreenShell';
import { mockBoothProducts } from '../../data/mockData';
import { styles } from '../../styles/commonStyles';

export const BoothReviewScreen = ({ pop }) => (
  <ScreenShell title="Seller Product Review" subtitle="Fields: id, name, brand, size, price" onBack={pop}>
    {mockBoothProducts.map((product) => (
      <View key={product.id} style={styles.listItem}>
        <Row label="ID" value={product.id} />
        <Row label="Name" value={product.name} />
        <Row label="Brand" value={product.brand} />
        <Row label="Size" value={product.size} />
        <Row label="Price" value={product.price} />
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.approveBtn}><Text style={styles.btnText}>Approve</Text></TouchableOpacity>
          <TouchableOpacity style={styles.rejectBtn}><Text style={styles.btnText}>Reject</Text></TouchableOpacity>
        </View>
      </View>
    ))}
  </ScreenShell>
);
