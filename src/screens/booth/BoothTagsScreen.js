import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { getBoothProducts } from '../../api/swapOpsApi';
import { Card } from '../../components/Card';
import { ScreenShell } from '../../components/ScreenShell';
import { useLoader } from '../../context/LoaderContext';

export const BoothTagsScreen = ({ pop }) => {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const { withLoader } = useLoader();

  useEffect(() => {
    let active = true;

    const loadProducts = async () => {
      try {
        setError('');
        const boothProducts = await withLoader(getBoothProducts(), 'Loading booth tags...');
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
    <ScreenShell title="Print Booth Tags" subtitle={error || 'Approved products only'} onBack={pop} backgroundColor="#e0f2fe">
      {error ? <Text>{error}</Text> : null}
      {products.map((product) => (
        <Card
          key={product.id}
          title={`${product.id} | ${product.name}`}
          subtitle={`${product.brand} | ${product.size} | ${product.price} | [Print Tag]`}
        />
      ))}
    </ScreenShell>
  );
};
