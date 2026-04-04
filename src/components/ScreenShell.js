import React from 'react';
import { SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useAppNavigation } from '../navigation/AppNavigationContext';
import { styles } from '../styles/commonStyles';

export const ScreenShell = ({
  title,
  subtitle,
  onBack,
  children,
  backgroundColor,
  headerContent,
  headerStyle,
  contentContainerStyle,
  statusBarStyle = 'dark-content',
}) => {
  const topInset = StatusBar.currentHeight || 0;
  const { currentRoute, currentModeHomeRoute, goToModeHome } = useAppNavigation();
  const showHomeButton = false;//Boolean(currentModeHomeRoute && currentRoute !== 'home' && currentRoute !== currentModeHomeRoute);

  return (
    <SafeAreaView style={[styles.safe, backgroundColor ? { backgroundColor } : null, { paddingTop: topInset }]}>
      <StatusBar barStyle={statusBarStyle} />
      <View style={[styles.header, headerStyle]}>
        <View style={styles.headerActions}>
          {onBack ? (
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.backPlaceholder} />
          )}
          {showHomeButton ? (
            <TouchableOpacity onPress={goToModeHome} style={styles.backButton}>
              <Text style={styles.backText}>Home</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {headerContent || (
          <View>
            <Text style={styles.headerTitle}>{title}</Text>
            {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
          </View>
        )}
      </View>
      <ScrollView contentContainerStyle={[styles.content, contentContainerStyle]}>{children}</ScrollView>
    </SafeAreaView>
  );
};
