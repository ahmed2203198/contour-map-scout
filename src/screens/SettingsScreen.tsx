import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import PaperBackground from '../components/PaperBackground';
import SecondaryButton from '../components/SecondaryButton';
import SettingRow, { SegmentChip } from '../components/SettingRow';
import StationHeader from '../components/StationHeader';
import ToggleSwitch from '../components/ToggleSwitch';
import { CONTENT_W, PAGE_PAD } from '../constants/config';
import { THEME } from '../constants/theme';
import { Sensitivity, Settings, TextSize, Units } from '../hooks/useSettings';

const UNITS: Units[] = ['KM', 'MILES'];
const SENSITIVITIES: Sensitivity[] = ['FINE', 'NORMAL', 'COARSE'];
const SIZES: TextSize[] = ['S', 'M', 'L'];

/** Station Settings. Everything here is local to the device - nothing is sent anywhere. */
export default function SettingsScreen({
  settings,
  onChange,
  onBack,
}: {
  settings: Settings;
  onChange: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  onBack: () => void;
}) {
  return (
    <PaperBackground variant="menu">
      <View style={styles.root}>
        <StationHeader eyebrow="STATION" title="SETTINGS" onBack={onBack} />

        <View style={styles.body}>
          <SettingRow label="UNITS" hint="HOW DISTANCES ARE READ OUT">
            {UNITS.map(u => (
              <SegmentChip
                key={u}
                label={u}
                active={settings.units === u}
                onPress={() => onChange('units', u)}
                width={u === 'MILES' ? 64 : 48}
              />
            ))}
          </SettingRow>

          <SettingRow label="COMPASS" hint="HOW FAST THE BEZEL TURNS">
            {SENSITIVITIES.map(s => (
              <SegmentChip
                key={s}
                label={s}
                active={settings.sensitivity === s}
                onPress={() => onChange('sensitivity', s)}
                width={62}
              />
            ))}
          </SettingRow>

          <SettingRow label="HAPTIC TICKS" hint="ONE TICK EVERY 5 DEGREES">
            <ToggleSwitch
              value={settings.haptics}
              onChange={next => onChange('haptics', next)}
              label="HAPTIC TICKS"
            />
          </SettingRow>

          <SettingRow label="TEXT SIZE" hint="SHEET LABELS STAY FIXED">
            {SIZES.map(s => (
              <SegmentChip
                key={s}
                label={s}
                active={settings.textSize === s}
                onPress={() => onChange('textSize', s)}
                width={44}
              />
            ))}
          </SettingRow>
        </View>

        <View style={styles.footer}>
          <Text style={styles.version}>SHEET 1:25 000 - OFFLINE - NO ADS - NO PURCHASES</Text>
          <SecondaryButton label="BACK TO STATION" onPress={onBack} width={CONTENT_W} height={48} />
        </View>
      </View>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1, paddingHorizontal: PAGE_PAD, paddingTop: 16 },
  footer: {
    paddingHorizontal: PAGE_PAD,
    paddingBottom: 18,
  },
  version: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
    lineHeight: 14,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 12,
  },
});
