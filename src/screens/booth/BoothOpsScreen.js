import React from 'react';
import { Text, View } from 'react-native';
import { isBoothLiveEnabled } from '../../api/boothGraphqlApi';
import { Card } from '../../components/Card';
import { ScreenShell } from '../../components/ScreenShell';
import { useAppSessionStore } from '../../store/appSessionStore';
import { styles } from '../../styles/commonStyles';

export const BoothOpsScreen = ({ push, pop }) => {
  const boothToken = useAppSessionStore((state) => state.boothToken);
  const liveMode = isBoothLiveEnabled();
  const hasBoothToken = Boolean(boothToken);

  return (
    <ScreenShell
      title="Swapaholic Booth"
      subtitle={liveMode ? (hasBoothToken ? 'Live backend connected' : 'Booth token unavailable') : 'Mock booth workspace'}
      onBack={pop}
      backgroundColor="#eef2ff"
    >
      {liveMode ? (
        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>{hasBoothToken ? 'Booth Backend Connected' : 'Booth Backend Token Missing'}</Text>
          <Text style={styles.cardSubtitle}>
            {hasBoothToken
              ? 'Booth APIs are using the stored booth bearer token.'
              : 'Set EXPO_PUBLIC_BOOTH_EMAIL and let the app refresh the booth token on launch.'}
          </Text>
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
