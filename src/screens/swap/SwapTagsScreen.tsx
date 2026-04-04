import React from 'react';
import { Card } from '../../components/Card';
import { ScreenShell } from '../../components/ScreenShell';

export const SwapTagsScreen = ({ pop }) => (
  <ScreenShell title="Print Swap Tags" subtitle="Only approved swap products" onBack={pop} backgroundColor="#ffe4e1">
    <Card title="SW-7006 • Wool Cardigan" subtitle="55 pts • [Print Tag]" />
    <Card title="SW-7014 • Utility Jacket" subtitle="70 pts • [Print Tag]" />
  </ScreenShell>
);
