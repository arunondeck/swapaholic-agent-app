import React, { useMemo, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ScreenShell } from '../../components/ScreenShell';
import { styles } from '../../styles/commonStyles';

const BOOTH_DETAILS = {
  b001: {
    name: 'DesiGirl Outfits',
    products: 0,
    productsList: [],
  },
  b002: {
    name: 'Local Luxe',
    products: 28,
    productsList: [
      { id: 'p1', name: 'The Missing Piece - Dresses', code: 'MB-292-1165-17446-3490', price: '$110.00', size: 'm', stock: '1/1', status: 'approved' },
      { id: 'p2', name: 'The Missing Piece - Dresses', code: 'MB-292-1165-17447-3490', price: '$110.00', size: 'm', stock: '1/1', status: 'approved' },
      { id: 'p3', name: 'Summer Floral Set', code: 'MB-292-1165-17448-3490', price: '$98.00', size: 's', stock: '1/1', status: 'pending' },
    ],
  },
};

const productTabs = ['pending', 'approved', 'sold', 'returned'];

export const BoothDetailsScreen = ({ pop, boothId }) => {
  const booth = BOOTH_DETAILS[boothId] || BOOTH_DETAILS.b001;
  const [status, setStatus] = useState('approved');
  const [search, setSearch] = useState('');

  const products = useMemo(
    () =>
      booth.productsList.filter((item) => {
        if (item.status !== status) {
          return false;
        }

        const query = search.trim().toLowerCase();
        return !query || item.name.toLowerCase().includes(query) || item.code.toLowerCase().includes(query);
      }),
    [booth.productsList, search, status]
  );

  return (
    <ScreenShell title={booth.name} subtitle={`${booth.products} products`} onBack={pop} backgroundColor="#f1f5f9">
      <View style={styles.tabsRow}>
        {productTabs.map((item) => {
          const active = item === status;
          return (
            <TouchableOpacity key={item} onPress={() => setStatus(item)} style={[styles.tabButton, active && styles.tabButtonActive]}>
              <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>{item[0].toUpperCase() + item.slice(1)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search by code or name"
        placeholderTextColor="#94a3b8"
        style={styles.input}
      />

      {products.length > 0 ? (
        products.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <View style={styles.itemImage} />
            <View style={styles.itemDetails}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={[styles.rowValue, { color: '#059669' }]}>{item.price}</Text>
              <Text style={styles.itemMeta}>Code: {item.code}</Text>
              <View style={styles.row}>
                <Text style={styles.itemMeta}>Size: {item.size}</Text>
                <Text style={styles.itemMeta}>Stock: {item.stock}</Text>
              </View>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>Print</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.secondaryButton, { borderColor: '#f59e0b' }]}>
                  <Text style={[styles.secondaryButtonText, { color: '#d97706' }]}>Return</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.formCard}>
          <Text style={[styles.cardTitle, { textAlign: 'center' }]}>No products found</Text>
          <Text style={[styles.helperText, { textAlign: 'center' }]}>No products match the selected tab and search criteria.</Text>
        </View>
      )}
    </ScreenShell>
  );
};
