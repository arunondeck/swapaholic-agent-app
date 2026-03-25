import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Card } from '../../components/Card';
import { OpsSummary } from '../../components/OpsSummary';
import { ScreenShell } from '../../components/ScreenShell';
import { styles } from '../../styles/commonStyles';

export const OpsSalesReportsScreen = ({ pop }) => {
  const [startDate, setStartDate] = useState('21 Mar 2026');
  const [endDate, setEndDate] = useState('21 Mar 2026');
  const [selectedQuickRange, setSelectedQuickRange] = useState('today');

  const dateOptions = ['14 Mar 2026', '20 Mar 2026', '21 Mar 2026', '01 Mar 2026'];

  const setToday = () => {
    setSelectedQuickRange('today');
    setStartDate('21 Mar 2026');
    setEndDate('21 Mar 2026');
  };

  const setThisMonth = () => {
    setSelectedQuickRange('month');
    setStartDate('01 Mar 2026');
    setEndDate('21 Mar 2026');
  };

  const setLastWeek = () => {
    setSelectedQuickRange('week');
    setStartDate('14 Mar 2026');
    setEndDate('20 Mar 2026');
  };

  const cycleDate = (value, setter) => {
    const currentIndex = dateOptions.indexOf(value);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % dateOptions.length;
    setter(dateOptions[nextIndex]);
  };

  return (
    <ScreenShell title="Sales Reports" subtitle="Sales summary by date range" onBack={pop} backgroundColor="#dcfce7">
      <View style={styles.reportHeaderCard}>
        <Text style={styles.reportHeaderTitle}>Report Range</Text>
        <View style={styles.reportBadge}>
          <Text style={styles.reportBadgeText}>Live Window</Text>
        </View>
      </View>

      <View style={styles.formCard}>
        <View style={styles.datePickerRow}>
          <TouchableOpacity style={styles.datePickerButton} onPress={() => cycleDate(startDate, setStartDate)}>
            <Text style={styles.datePickerLabel}>Start Date</Text>
            <Text style={styles.datePickerValue}>📅 {startDate}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.datePickerButton} onPress={() => cycleDate(endDate, setEndDate)}>
            <Text style={styles.datePickerLabel}>End Date</Text>
            <Text style={styles.datePickerValue}>📅 {endDate}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.quickActionsRow}>
          <TouchableOpacity onPress={setToday} style={[styles.quickActionButton, selectedQuickRange === 'today' && styles.quickActionButtonActive]}>
            <Text style={styles.quickActionText}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={setThisMonth} style={[styles.quickActionButton, selectedQuickRange === 'month' && styles.quickActionButtonActive]}>
            <Text style={styles.quickActionText}>This Month</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={setLastWeek} style={[styles.quickActionButton, selectedQuickRange === 'week' && styles.quickActionButtonActive]}>
            <Text style={styles.quickActionText}>Last Week</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.reportCardsGrid}>
        <Card title="Swap Sales" subtitle="247 orders · $14.6k gross in selected period." />
        <Card title="Marketplace Sales" subtitle="93 orders · $5.2k gross in selected period." />
      </View>

      <OpsSummary title="Sales Summary" dateLabel={`${startDate} to ${endDate}`} />
    </ScreenShell>
  );
};
