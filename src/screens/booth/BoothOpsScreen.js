import React from 'react';
import { Card } from '../../components/Card';
import { ScreenShell } from '../../components/ScreenShell';

export const BoothOpsScreen = ({ push, pop }) => (
  <ScreenShell title="Booth Ops" subtitle="3-month booth cycles" onBack={pop} backgroundColor="#e0f2fe">
    <Card title="Booth Applications" subtitle="View by period, approve/reject booth sellers" onPress={() => push('boothApplications')} />
    <Card title="Product Review" subtitle="Approve or reject seller products" onPress={() => push('boothReview')} />
    <Card title="Print Product Tags" subtitle="Generate printable tags for approved products" onPress={() => push('boothTags')} />
  </ScreenShell>
);
