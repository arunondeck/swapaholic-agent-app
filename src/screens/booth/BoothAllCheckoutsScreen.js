import React, { useEffect, useMemo, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getAllBoothCheckouts } from '../../api/swapOpsApi';
import { ScreenShell } from '../../components/ScreenShell';
import { useLoader } from '../../context/LoaderContext';
import { styles } from '../../styles/commonStyles';

const PAGE_SIZE_OPTIONS = [25, 50, 100];

const formatDateInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDefaultDateRange = () => {
  const today = new Date();
  const startOfPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  return { start: formatDateInput(startOfPrevMonth), end: formatDateInput(today) };
};

const toStartOfDayIso = (value) => (value ? new Date(`${value}T00:00:00`).toISOString() : null);
const toEndOfDayIso = (value) => (value ? new Date(`${value}T23:59:59`).toISOString() : null);

export const BoothAllCheckoutsScreen = ({ pop, push }) => {
  const defaults = useMemo(() => getDefaultDateRange(), []);
  const [pendingStartDate, setPendingStartDate] = useState(defaults.start);
  const [pendingEndDate, setPendingEndDate] = useState(defaults.end);
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate] = useState(defaults.end);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [checkouts, setCheckouts] = useState([]);
  const [summary, setSummary] = useState({ totalCheckouts: 0, totalCartValue: 0, totalItemsSold: 0 });
  const [totalCount, setTotalCount] = useState(0);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState('');
  const { withLoader } = useLoader();

  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    let active = true;

    const loadCheckouts = async () => {
      setError('');

      try {
        const response = await withLoader(
          getAllBoothCheckouts({
            startDate: toStartOfDayIso(startDate),
            endDate: toEndOfDayIso(endDate),
            page: safePage,
            perPage,
          })
        );

        if (!active) {
          return;
        }

        setCheckouts(response.checkouts);
        setSummary(response.aggregates);
        setTotalCount(response.totalCount);
        setHasLoaded(true);
      } catch (loadError) {
        if (active) {
          setError(loadError.message || 'Unable to load checkouts');
          setCheckouts([]);
          setHasLoaded(true);
        }
      }
    };

    loadCheckouts();

    return () => {
      active = false;
    };
  }, [endDate, perPage, safePage, startDate, withLoader]);

  return (
    <ScreenShell title="All Checkouts" subtitle={error || 'Checkout summary and list'} onBack={pop} backgroundColor="#f8fafc">
      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Filters</Text>
        <TextInput value={pendingStartDate} onChangeText={setPendingStartDate} style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor="#94a3b8" />
        <TextInput value={pendingEndDate} onChangeText={setPendingEndDate} style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor="#94a3b8" />
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.primaryButton, { flex: 1 }]}
            onPress={() => {
              setStartDate(pendingStartDate);
              setEndDate(pendingEndDate);
              setPage(1);
            }}
          >
            <Text style={styles.primaryButtonText}>Apply Filters</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryButton, { flex: 1 }]}
            onPress={() => {
              setPendingStartDate('');
              setPendingEndDate('');
              setStartDate('');
              setEndDate('');
              setPage(1);
            }}
          >
            <Text style={styles.secondaryButtonText}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.checkoutSummaryCard}>
        <View style={styles.checkoutSummaryHeader}>
          <Text style={styles.checkoutSummaryHeaderText}>Checkout Summary</Text>
        </View>
        <View style={styles.checkoutSummaryBody}>
          <Text style={styles.summaryText}>{startDate || 'Earliest'} - {endDate || 'Latest'}</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Checkouts</Text>
              <Text style={styles.statValue}>{summary.totalCheckouts}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Amount</Text>
              <Text style={styles.statValue}>${Number(summary.totalCartValue || 0).toFixed(2)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Items Sold</Text>
              <Text style={styles.statValue}>{summary.totalItemsSold}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.formCard}>
        <View style={styles.row}>
          <TouchableOpacity onPress={() => setPage((prev) => Math.max(1, prev - 1))} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Prev</Text>
          </TouchableOpacity>
          <Text style={[styles.rowValue, { alignSelf: 'center' }]}>
            Page {safePage} of {totalPages}
          </Text>
          <TouchableOpacity onPress={() => setPage((prev) => Math.min(totalPages, prev + 1))} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.chipRow}>
          {PAGE_SIZE_OPTIONS.map((size) => (
            <TouchableOpacity
              key={size}
              onPress={() => {
                setPerPage(size);
                setPage(1);
              }}
              style={[styles.chip, perPage === size && styles.chipActive]}
            >
              <Text style={styles.chipText}>{size} / page</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {hasLoaded && checkouts.length === 0 ? (
        <View style={styles.formCard}>
          <Text style={[styles.cardTitle, { textAlign: 'center' }]}>No checkouts found</Text>
          <Text style={[styles.helperText, { textAlign: 'center' }]}>No booth sales match the selected date range.</Text>
        </View>
      ) : null}

      {checkouts.length > 0 ? (
        <View style={styles.checkoutList}>
          {checkouts.map((checkout, index) => {
            const itemCount = (checkout.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
            const isLast = index === checkouts.length - 1;
            return (
              <TouchableOpacity
                key={checkout.id}
                style={[styles.checkoutListItem, isLast && styles.checkoutListItemLast]}
                onPress={() => push('boothCheckoutDetail', { checkoutId: checkout.id })}
              >
                <Text style={styles.itemMeta}>{new Date(checkout.checkout_date).toLocaleString()}</Text>
                <View style={styles.row}>
                  <Text style={[styles.cardTitle, { color: '#2563eb' }]}>#{checkout.id}</Text>
                  <Text style={styles.rowValue}>{itemCount} items</Text>
                  <Text style={[styles.cardTitle, { color: '#ef4444' }]}>${Number(checkout.Cart_value || 0).toFixed(2)}</Text>
                </View>
                <Text style={styles.helperText}>{checkout.Booth_payment_method?.method || 'Unknown payment method'}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}
    </ScreenShell>
  );
};
