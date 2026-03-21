import React, { useMemo, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ScreenShell } from '../../components/ScreenShell';
import { styles } from '../../styles/commonStyles';

const CHECKOUTS = [
  { id: '#4081', date: 'Mar 20, 2026, 05:44 PM', items: 1, total: '$32.00' },
  { id: '#4080', date: 'Mar 20, 2026, 03:37 PM', items: 1, total: '$20.00' },
  { id: '#4079', date: 'Mar 20, 2026, 02:26 PM', items: 2, total: '$120.00' },
  { id: '#4078', date: 'Mar 20, 2026, 11:26 AM', items: 1, total: '$10.00' },
  { id: '#4077', date: 'Mar 20, 2026, 10:19 AM', items: 1, total: '$39.00' },
];

export const BoothAllCheckoutsScreen = ({ pop }) => {
  const [startDate, setStartDate] = useState('02/01/2026');
  const [endDate, setEndDate] = useState('03/21/2026');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);

  const summary = useMemo(() => {
    const totalCheckouts = CHECKOUTS.length;
    const totalAmount = CHECKOUTS.reduce((acc, item) => acc + Number(item.total.replace(/[$,]/g, '')), 0);
    const totalItems = CHECKOUTS.reduce((acc, item) => acc + item.items, 0);

    return { totalCheckouts, totalAmount, totalItems };
  }, []);

  const totalPages = Math.max(1, Math.ceil(CHECKOUTS.length / perPage));
  const safePage = Math.min(page, totalPages);
  const pagedCheckouts = CHECKOUTS.slice((safePage - 1) * perPage, safePage * perPage);

  return (
    <ScreenShell title="All Checkouts" subtitle="Checkout summary and list" onBack={pop} backgroundColor="#f8fafc">
      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Filters</Text>
        <TextInput value={startDate} onChangeText={setStartDate} style={styles.input} placeholder="Start date" placeholderTextColor="#94a3b8" />
        <TextInput value={endDate} onChangeText={setEndDate} style={styles.input} placeholder="End date" placeholderTextColor="#94a3b8" />
        <View style={styles.row}>
          <TouchableOpacity style={[styles.primaryButton, { flex: 1 }]}>
            <Text style={styles.primaryButtonText}>Apply Filters</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryButton, { flex: 1 }]}
            onPress={() => {
              setStartDate('02/01/2026');
              setEndDate('03/21/2026');
            }}
          >
            <Text style={styles.secondaryButtonText}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summarySubheading}>Checkout Summary</Text>
        <Text style={styles.summaryText}>{startDate} 12:00:00 AM - {endDate} 11:59:59 PM</Text>
        <View style={[styles.statsGrid, { marginTop: 10 }]}> 
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Checkouts</Text>
            <Text style={styles.statValue}>{summary.totalCheckouts}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Amount</Text>
            <Text style={styles.statValue}>${summary.totalAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Items Sold</Text>
            <Text style={styles.statValue}>{summary.totalItems}</Text>
          </View>
        </View>
      </View>

      <View style={styles.formCard}>
        <View style={styles.row}>
          <TouchableOpacity onPress={() => setPage((prev) => Math.max(1, prev - 1))} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Prev</Text>
          </TouchableOpacity>
          <Text style={[styles.rowValue, { alignSelf: 'center' }]}>Page {safePage} of {totalPages}</Text>
          <TouchableOpacity onPress={() => setPage((prev) => Math.min(totalPages, prev + 1))} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.chipRow}>
          {[25, 50, 100].map((size) => (
            <TouchableOpacity key={size} onPress={() => setPerPage(size)} style={[styles.chip, perPage === size && styles.chipActive]}>
              <Text style={styles.chipText}>{size} / page</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {pagedCheckouts.map((checkout) => (
        <View key={checkout.id} style={styles.listItem}>
          <Text style={styles.itemMeta}>{checkout.date}</Text>
          <View style={styles.row}>
            <Text style={[styles.cardTitle, { color: '#2563eb' }]}>{checkout.id}</Text>
            <Text style={styles.rowValue}>{checkout.items} items</Text>
            <Text style={[styles.cardTitle, { color: '#ef4444' }]}>{checkout.total}</Text>
          </View>
        </View>
      ))}
    </ScreenShell>
  );
};
