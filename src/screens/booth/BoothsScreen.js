import React, { useEffect, useMemo, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { isBoothLiveEnabled } from '../../api/boothGraphqlApi';
import { getSellerBooths } from '../../api/swapOpsApi';
import { ScreenShell } from '../../components/ScreenShell';
import { useBoothAuthStore } from '../../store/boothAuthStore';
import { styles } from '../../styles/commonStyles';

const PAGE_SIZE_OPTIONS = [10, 25, 50];
const statusTabs = ['pending', 'approved', 'inactive'];
const cycleTabsByStatus = {
  pending: ['next', 'all'],
  approved: ['current', 'next', 'upcoming', 'done', 'all'],
  inactive: ['all'],
};

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
    : 'NA';

export const BoothsScreen = ({ pop, push, focusSearch }) => {
  const token = useBoothAuthStore((state) => state.token);
  const [status, setStatus] = useState('pending');
  const [cycle, setCycle] = useState('next');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [booths, setBooths] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const cycleTabs = useMemo(() => cycleTabsByStatus[status] || ['all'], [status]);
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
  const safePage = Math.min(page, totalPages);
  const requiresLogin = isBoothLiveEnabled() && !token;

  useEffect(() => {
    if (!cycleTabs.includes(cycle)) {
      setCycle(cycleTabs[0]);
    }
  }, [cycle, cycleTabs]);

  useEffect(() => {
    if (requiresLogin) {
      return undefined;
    }

    let active = true;

    const loadBooths = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await getSellerBooths({ status, cycle, search, page: safePage, perPage });
        if (!active) {
          return;
        }

        setBooths(response.booths);
        setTotalCount(response.totalCount);
      } catch (loadError) {
        if (active) {
          setError(loadError.message || 'Unable to load booths');
          setBooths([]);
          setTotalCount(0);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadBooths();

    return () => {
      active = false;
    };
  }, [cycle, perPage, requiresLogin, safePage, search, status]);

  return (
    <ScreenShell title="Booths" subtitle={error || 'Browse and manage booth approvals'} onBack={pop} backgroundColor="#f1f5f9">
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
        placeholder="Search booth, business, or seller"
        placeholderTextColor="#94a3b8"
        style={styles.input}
      />

      {requiresLogin ? (
        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Sign in required</Text>
          <Text style={styles.cardSubtitle}>The live booth backend requires authentication before booth data can be loaded.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => push('boothLogin')}>
            <Text style={styles.primaryButtonText}>Open Booth Login</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.formCard}>
          <Text style={styles.cardSubtitle}>Loading booths...</Text>
        </View>
      ) : null}

      {!requiresLogin && !loading && booths.length > 0
        ? booths.map((booth) => (
            <TouchableOpacity key={booth.id} style={styles.listItem} onPress={() => push('boothDetails', { boothId: booth.id })}>
              <Text style={styles.cardTitle}>{booth.name}</Text>
              <Text style={styles.cardSubtitle}>
                {formatDate(booth.booth_start_date)} - {formatDate(booth.booth_end_date)}
              </Text>
              <Text style={styles.helperText}>{booth.seller}</Text>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Status: {booth.status}</Text>
                <Text style={styles.rowValue}>{booth.items} items</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Slot: {booth.booth_slot || 'NA'}</Text>
                <Text style={styles.rowValue}>{booth.cycle}</Text>
              </View>
            </TouchableOpacity>
          ))
        : null}

      {!requiresLogin && !loading && booths.length === 0 ? (
        <View style={styles.formCard}>
          <Text style={[styles.cardTitle, { textAlign: 'center' }]}>No booths found</Text>
          <Text style={[styles.helperText, { textAlign: 'center' }]}>Adjust your filters or search to widen the results.</Text>
        </View>
      ) : null}

      <View style={styles.formCard}>
        <Text style={styles.cardSubtitle}>
          Showing {totalCount === 0 ? 0 : (safePage - 1) * perPage + 1} - {Math.min(safePage * perPage, totalCount)} of {totalCount} booths
        </Text>
        <View style={styles.row}>
          <TouchableOpacity onPress={() => setPage((prev) => Math.max(1, prev - 1))} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Prev</Text>
          </TouchableOpacity>
          <Text style={[styles.rowValue, { alignSelf: 'center' }]}>
            Page {safePage} / {totalPages}
          </Text>
          <TouchableOpacity onPress={() => setPage((prev) => Math.min(totalPages, prev + 1))} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.chipRow}>
          {PAGE_SIZE_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option}
              onPress={() => {
                setPerPage(option);
                setPage(1);
              }}
              style={[styles.chip, perPage === option && styles.chipActive]}
            >
              <Text style={styles.chipText}>{option} / page</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScreenShell>
  );
};
