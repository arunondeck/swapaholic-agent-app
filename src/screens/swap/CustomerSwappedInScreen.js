import React from 'react';
import { Image, Text, View } from 'react-native';
import { ScreenShell } from '../../components/ScreenShell';
import { getCustomerProfile } from '../../data/mockData';
import { styles } from '../../styles/commonStyles';

export const CustomerSwappedInScreen = ({ pop, customerEmail }) => {
  const customer = getCustomerProfile(customerEmail);

  return (
    <ScreenShell title="Items Swapped In" subtitle={`${customer.name} swap-in list`} onBack={pop} backgroundColor="#ffe4e1">
      {customer.swappedInItems.map((item) => (
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
