import React, { useState } from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';
import { OpsSummary } from '../../components/OpsSummary';
import { ScreenShell } from '../../components/ScreenShell';
import { styles } from '../../styles/commonStyles';

export const OpsSalesReportsScreen = ({ pop }) => {
  const [startDate, setStartDate] = useState('21 Mar 2026');
  const [endDate, setEndDate] = useState('21 Mar 2026');

  const setToday = () => {
    setStartDate('21 Mar 2026');
    setEndDate('21 Mar 2026');
  };

  const setThisMonth = () => {
    setStartDate('01 Mar 2026');
    setEndDate('21 Mar 2026');
  };

  const setLastWeek = () => {
    setStartDate('14 Mar 2026');
    setEndDate('20 Mar 2026');
  };

  return (
    <ScreenShell title="Sales Reports" subtitle="Sales summary by date range" onBack={pop} backgroundColor="#dcfce7">
      <View style={styles.formCard}>
        <TextInput value={startDate} onChangeText={setStartDate} style={styles.input} placeholder="Start date" placeholderTextColor="#8b8b8b" />
        <TextInput value={endDate} onChangeText={setEndDate} style={styles.input} placeholder="End date" placeholderTextColor="#8b8b8b" />
        <View style={styles.quickActionsRow}>
          <TouchableOpacity onPress={setToday} style={styles.quickActionButton}>
            <Text style={styles.quickActionText}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={setThisMonth} style={styles.quickActionButton}>
            <Text style={styles.quickActionText}>This Month</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={setLastWeek} style={styles.quickActionButton}>
            <Text style={styles.quickActionText}>Last Week</Text>
          </TouchableOpacity>
        </View>
      </View>

      <OpsSummary title="Sales Summary" dateLabel={`${startDate} to ${endDate}`} />
    </ScreenShell>
  );
};
