import React from 'react';
import { Card } from '../../components/Card';
import { ScreenShell } from '../../components/ScreenShell';
import { mockBoothProducts } from '../../data/mockData';

export const BoothTagsScreen = ({ pop }) => (
  <ScreenShell title="Print Booth Tags" subtitle="Approved products only" onBack={pop}>
    {mockBoothProducts.map((product) => (
      <Card
        key={product.id}
        title={`${product.id} • ${product.name}`}
        subtitle={`${product.brand} • ${product.size} • ${product.price} • [Print Tag]`}
      />
    ))}
  </ScreenShell>
);
