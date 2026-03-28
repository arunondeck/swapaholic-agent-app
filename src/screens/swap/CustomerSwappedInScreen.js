import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { getCustomerProfile, getCustomerSwappedInItems } from '../../api/swapOpsApi';
import { ProductCard } from '../../components/ProductCard';
import { ScreenShell } from '../../components/ScreenShell';
import { useLoader } from '../../context/LoaderContext';

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
        <ProductCard key={item.id} product={item} subtitle={`Item ID: ${item.unique_item_id_c || item.id} | Category: ${item.category?.name || 'NA'}`} />
      ))}
    </ScreenShell>
  );
};
