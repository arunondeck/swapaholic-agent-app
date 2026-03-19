import React from 'react';
import { SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles/commonStyles';

export const ScreenShell = ({ title, subtitle, onBack, children }) => (
  <SafeAreaView style={styles.safe}>
    <StatusBar barStyle="dark-content" />
    <View style={styles.header}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.backPlaceholder} />
      )}
      <View>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
    <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
  </SafeAreaView>
);
