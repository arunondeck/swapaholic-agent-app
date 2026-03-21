import React from 'react';
import { View } from 'react-native';
import { Card } from '../../components/Card';
import { ScreenShell } from '../../components/ScreenShell';
import { styles } from '../../styles/commonStyles';

export const BoothOpsScreen = ({ push, pop }) => (
  <ScreenShell title="Swapaholic Booth" subtitle="Actions" onBack={pop} backgroundColor="#eef2ff">
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
