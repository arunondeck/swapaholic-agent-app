import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { isBoothLiveEnabled } from '../../api/boothGraphqlApi';
import { Card } from '../../components/Card';
import { ScreenShell } from '../../components/ScreenShell';
import { useAppSessionStore } from '../../store/appSessionStore';
import { styles } from '../../styles/commonStyles';

export const BoothOpsScreen = ({ push, pop }) => {
  const token = useAppSessionStore((state) => state.token);
  const user = useAppSessionStore((state) => state.user);
  const logout = useAppSessionStore((state) => state.logout);
  const liveMode = isBoothLiveEnabled();
  const isAuthenticated = Boolean(token);

  return (
    <ScreenShell
      title="Swapaholic Booth"
      subtitle={liveMode ? (isAuthenticated ? 'Live backend connected' : 'Live backend requires sign-in') : 'Mock booth workspace'}
      onBack={pop}
      backgroundColor="#eef2ff"
    >
      {liveMode ? (
        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>{isAuthenticated ? 'Booth Backend Connected' : 'Booth Backend Sign-In Required'}</Text>
          <Text style={styles.cardSubtitle}>
            {isAuthenticated ? user?.email || user?.username || 'Authenticated booth user' : 'Sign in before using live booth data, checkout, scanning, and print.'}
          </Text>
          <View style={styles.row}>
            <TouchableOpacity style={[styles.primaryButton, { flex: 1 }]} onPress={() => push('boothLogin')}>
              <Text style={styles.primaryButtonText}>{isAuthenticated ? 'Switch Account' : 'Sign In'}</Text>
            </TouchableOpacity>
            {isAuthenticated ? (
              <TouchableOpacity style={[styles.secondaryButton, { flex: 1 }]} onPress={logout}>
                <Text style={styles.secondaryButtonText}>Log Out</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      ) : null}

      <Card title="View All Booths" subtitle="Browse and manage booth approvals" onPress={() => push('booths')} />
      <Card title="Search Booth" subtitle="Find specific booth by name or seller" onPress={() => push('booths', { focusSearch: true })} />
      <Card title="Completed Sales" subtitle="Review past transactions" onPress={() => push('boothAllCheckouts')} />
      <Card title="Checkout" subtitle="Process new sale" onPress={() => push('boothCheckout')} />
      <View style={{ opacity: 0.55 }}>
        <Card title="Generate Report" subtitle="Coming soon" />
      </View>

      <View style={styles.formCard}>
        <Card title="Booth Applications" subtitle="Legacy booth applications workflow" onPress={() => push('boothApplications')} />
        <Card title="Product Review" subtitle="Legacy product review workflow" onPress={() => push('boothReview')} />
        <Card title="Print Product Tags" subtitle="Legacy tag printing workflow" onPress={() => push('boothTags')} />
      </View>
    </ScreenShell>
  );
};
