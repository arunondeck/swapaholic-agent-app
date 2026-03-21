import React, { useMemo, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ScreenShell } from '../../components/ScreenShell';
import { styles } from '../../styles/commonStyles';

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const BOOTHS = [
  {
    id: 'b001',
    name: 'DesiGirl Outfits',
    seller: 'Attiya S',
    status: 'pending',
    cycle: 'next',
    startDate: 'May 02, 2026',
    endDate: 'Aug 01, 2026',
    items: 0,
  },
  {
    id: 'b002',
    name: 'Local Luxe',
    seller: 'Libing Ooi',
    status: 'approved',
    cycle: 'current',
    startDate: 'Mar 02, 2026',
    endDate: 'Jun 01, 2026',
    items: 28,
  },
  {
    id: 'b003',
    name: 'Peacheshome & Accessories',
    seller: 'Komal Gill',
    status: 'approved',
    cycle: 'current',
    startDate: 'Oct 19, 2025',
    endDate: 'Apr 19, 2026',
    items: 108,
  },
  {
    id: 'b004',
    name: 'Slay',
    seller: 'Kavita Chandradhas',
    status: 'inactive',
    cycle: 'done',
    startDate: 'Sep 21, 2025',
    endDate: 'Mar 21, 2026',
    items: 39,
  },
];

const statusTabs = ['pending', 'approved', 'inactive'];
const cycleTabs = ['current', 'next', 'upcoming', 'done', 'all'];

export const BoothsScreen = ({ pop, push, focusSearch }) => {
  const [status, setStatus] = useState('pending');
  const [cycle, setCycle] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);

  const filtered = useMemo(
    () =>
      BOOTHS.filter((booth) => {
        if (booth.status !== status) {
          return false;
        }

        if (cycle !== 'all' && booth.cycle !== cycle) {
          return false;
        }

        const query = search.trim().toLowerCase();
        if (!query) {
          return true;
        }

        return booth.name.toLowerCase().includes(query) || booth.seller.toLowerCase().includes(query);
      }),
    [cycle, search, status]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const pagedData = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  return (
    <ScreenShell title="Booths" subtitle="Pending / approved / single booth" onBack={pop} backgroundColor="#f1f5f9">
      <View style={styles.tabsRow}>
        {statusTabs.map((item) => {
          const active = item === status;
          return (
            <TouchableOpacity
              key={item}
              onPress={() => {
                setStatus(item);
                setPage(1);
              }}
              style={[styles.tabButton, active && styles.tabButtonActive]}
            >
              <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>{item[0].toUpperCase() + item.slice(1)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.chipRow}>
        {cycleTabs.map((item) => {
          const active = item === cycle;
          return (
            <TouchableOpacity
              key={item}
              onPress={() => {
                setCycle(item);
                setPage(1);
              }}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={styles.chipText}>{item[0].toUpperCase() + item.slice(1)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TextInput
        value={search}
        onChangeText={(value) => {
          setSearch(value);
          setPage(1);
        }}
        autoFocus={Boolean(focusSearch)}
        placeholder="Search seller store name"
        placeholderTextColor="#94a3b8"
        style={styles.input}
      />

      {pagedData.length > 0 ? (
        pagedData.map((booth) => (
          <TouchableOpacity key={booth.id} style={styles.listItem} onPress={() => push('boothDetails', { boothId: booth.id })}>
            <Text style={styles.cardTitle}>{booth.name}</Text>
            <Text style={styles.cardSubtitle}>
              {booth.startDate} - {booth.endDate}
            </Text>
            <Text style={styles.helperText}>{booth.seller}</Text>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Status: {booth.status}</Text>
              <Text style={styles.rowValue}>{booth.items} items</Text>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.formCard}>
          <Text style={[styles.cardTitle, { textAlign: 'center' }]}>No booths found</Text>
          <Text style={[styles.helperText, { textAlign: 'center' }]}>Adjust your status, cycle, or search filters.</Text>
        </View>
      )}

      <View style={styles.formCard}>
        <Text style={styles.cardSubtitle}>
          Showing {filtered.length === 0 ? 0 : (safePage - 1) * perPage + 1} - {Math.min(safePage * perPage, filtered.length)} of {filtered.length} booths
        </Text>
        <View style={styles.row}>
          <TouchableOpacity onPress={() => setPage((prev) => Math.max(1, prev - 1))} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Prev</Text>
          </TouchableOpacity>
          <Text style={[styles.rowValue, { alignSelf: 'center' }]}>Page {safePage} / {totalPages}</Text>
          <TouchableOpacity onPress={() => setPage((prev) => Math.min(totalPages, prev + 1))} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.chipRow}>
          {PAGE_SIZE_OPTIONS.map((option) => (
            <TouchableOpacity key={option} onPress={() => setPerPage(option)} style={[styles.chip, perPage === option && styles.chipActive]}>
              <Text style={styles.chipText}>{option} / page</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScreenShell>
  );
};
