import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { getBoothProducts } from '../../api/swapOpsApi';
import { Row } from '../../components/Row';
import { ScreenShell } from '../../components/ScreenShell';
import { useLoader } from '../../context/LoaderContext';
import { styles } from '../../styles/commonStyles';

export const BoothReviewScreen = ({ pop }) => {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const { withLoader } = useLoader();

  useEffect(() => {
    let active = true;

    const loadProducts = async () => {
      try {
        setError('');
        const boothProducts = await withLoader(getBoothProducts(), 'Loading booth products...');
        if (active) {
          setProducts(boothProducts);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message || 'Failed to load booth products');
        }
      }
    };

    loadProducts();

    return () => {
      active = false;
    };
  }, [withLoader]);

  return (
    <ScreenShell title="Seller Product Review" subtitle={error || 'Fields: id, name, brand, size, price'} onBack={pop} backgroundColor="#e0f2fe">
      {error ? <Text>{error}</Text> : null}
      {products.map((product) => (
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
};
