import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { getInspectionProducts } from '../../api/swapOpsApi';
import { Row } from '../../components/Row';
import { ScreenShell } from '../../components/ScreenShell';
import { useLoader } from '../../utils/LoaderContextShared';
import { styles } from '../../styles/commonStyles';

export const InspectionScreen = ({ pop }) => {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const { withLoader } = useLoader();

  useEffect(() => {
    let active = true;

    const loadProducts = async () => {
      try {
        setError('');
        const inspectionProducts = await withLoader(getInspectionProducts(), 'Loading inspection queue...');
        if (active) {
          setProducts(inspectionProducts);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message || 'Failed to load inspection products');
        }
      }
    };

    loadProducts();

    return () => {
      active = false;
    };
  }, [withLoader]);

  return (
    <ScreenShell title="Manual Inspection" subtitle={error || 'Assign points to scanned products'} onBack={pop} backgroundColor="#ffe4e1">
      {error ? <Text>{error}</Text> : null}
      {products.map((product) => (
        <View key={product.id} style={styles.listItem}>
          <Row label="ID" value={product.unique_item_id_c} />
          <Row label="Product" value={product.name} />
          <Row label="Status" value={product.status_c} />
          <Row label="Points" value={`${product.evaluated_points_c} pts`} />
        </View>
      ))}
    </ScreenShell>
  );
};
