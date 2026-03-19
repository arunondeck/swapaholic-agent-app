import React from 'react';
import { Card } from '../../components/Card';
import { ScreenShell } from '../../components/ScreenShell';

export const BoothApplicationsScreen = ({ pop }) => (
  <ScreenShell title="Booth Applications" subtitle="Current cycle: Jan 1 - Mar 31, 2026" onBack={pop}>
    <Card title="Booth #B-120 | Retro Rack" subtitle="Submitted: Mar 12, 2026 • Status: Pending" />
    <Card title="Booth #B-118 | Street Edit" subtitle="Submitted: Mar 10, 2026 • Status: Approved" />
    <Card title="Booth #B-115 | Soft Closet" subtitle="Submitted: Mar 3, 2026 • Status: Rejected" />
  </ScreenShell>
);
