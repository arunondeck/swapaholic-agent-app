import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { ScreenShell } from '../components/ScreenShell';
import { styles } from '../styles/commonStyles';

const SWAPAHOLIC_LOGO = require('../images/swapaholic-logo.webp');
const SWAP_ICON = require('../images/swap-icon.png');
const BOOTH_ICON = require('../images/booth-icon.png');
const OPS_ICON = require('../images/ops-icon.png');

const MODES = [
  {
    key: 'swap',
    title: 'Swap',
    subtitle: '',
    icon: SWAP_ICON,
  },
  {
    key: 'booth',
    title: 'Marketplace Booth',
    subtitle: '',
    icon: BOOTH_ICON,
  },
  {
    key: 'ops',
    title: 'Ops Mode',
    subtitle: '',
    icon: OPS_ICON,
  },
];

export const HomeScreen = ({ push }) => (
  <ScreenShell
    backgroundColor="#f2f7e6"
    headerStyle={styles.homeHeader}
    headerContent={<Image source={SWAPAHOLIC_LOGO} style={styles.homeLogo} resizeMode="contain" />}
    contentContainerStyle={styles.homeContent}
    statusBarStyle="light-content"
  >
    <View style={styles.homeModeStack}>
      {MODES.map((mode) => (
        <TouchableOpacity key={mode.key} style={styles.homeModeCard} onPress={() => push(mode.key)}>
          <View style={styles.homeModeIconSlot}>
            <Image source={mode.icon} style={styles.homeModeIconImage} resizeMode="contain" />
          </View>
          <Text style={styles.homeModeTitle}>{mode.title}</Text>
          <Text style={styles.homeModeSubtitle}>{mode.subtitle}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </ScreenShell>
);
