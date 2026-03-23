import React, { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { getCustomerProfile, getCustomerSwappedInItems } from '../../api/swapOpsApi';
import { ScreenShell } from '../../components/ScreenShell';
import { useLoader } from '../../context/LoaderContext';
import { styles } from '../../styles/commonStyles';

export const CustomerSwappedInScreen = ({ pop, customerEmail }) => {
  const [customer, setCustomer] = useState(null);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const { withLoader } = useLoader();

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        setError('');
        const [profile, swappedInItems] = await withLoader(
          Promise.all([
            getCustomerProfile(customerEmail),
            getCustomerSwappedInItems(customerEmail),
          ]),
          'Loading swapped items...'
        );

        if (!active) {
          return;
        }

        setCustomer(profile);
        setItems(swappedInItems);
      } catch (loadError) {
        if (active) {
          setError(loadError.message || 'Failed to load swapped-in items');
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [customerEmail, withLoader]);

  if (!customer) {
    return (
      <ScreenShell title="Items Swapped In" subtitle={error || 'Loading swap-in list...'} onBack={pop} backgroundColor="#ffe4e1">
        <Text>{error || 'Loading...'}</Text>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title="Items Swapped In" subtitle={`${customer.name} swap-in list`} onBack={pop} backgroundColor="#ffe4e1">
      {items.map((item) => (
        <View key={item.id} style={styles.itemRow}>
          <Image source={{ uri: item.image }} style={styles.itemImage} />
          <View style={styles.itemDetails}>
            <Text style={styles.cardTitle}>{item.id}</Text>
            <Text style={styles.itemMeta}>Brand: {item.brand}</Text>
            <Text style={styles.itemMeta}>Category: {item.category}</Text>
          </View>
        </View>
      ))}
    </ScreenShell>
  );
};
