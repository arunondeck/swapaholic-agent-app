import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Card } from '../../components/Card';
import { ScreenShell } from '../../components/ScreenShell';
import { styles } from '../../styles/commonStyles';

export const ApprovalScreen = ({ pop }) => (
  <ScreenShell title="Customer Points Approval" subtitle="Approve/reject assigned points" onBack={pop}>
    <Card title="Pickup PK-9009" subtitle="Product count: 6 • Pending customer approval" />
    <View style={styles.actionRow}>
      <TouchableOpacity style={styles.approveBtn}><Text style={styles.btnText}>Approve Points</Text></TouchableOpacity>
      <TouchableOpacity style={styles.rejectBtn}><Text style={styles.btnText}>Reject Points</Text></TouchableOpacity>
    </View>
  </ScreenShell>
);
