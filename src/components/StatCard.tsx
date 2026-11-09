import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { THEME } from '../constants/theme';
import type { IconComponent } from './PrimaryButton';

export type StatItem = {
  key: string;
  Icon: IconComponent;
  value: string;
  label: string;
  valueColor: string;
};

/** "0", "0%", "0 M", "" - nothing worth a card. */
export function isEmptyValue(value: string) {
  const v = (value || '').trim();
  if (v === '') {
    return true;
  }
  return /^0(\.0)?\s*(%|M|KM|MI)?$/i.test(v);
}

/**
 * The one stat pill used on both the Menu and the Debrief, so the two screens
 * can never drift apart. The slot carries flex:1; the card itself is
 * width:'100%' with an intrinsic height - flex:1 on both would collapse the
 * card to a strip and clip the value out of sight.
 */
function StatCardBase({ Icon, value, label, valueColor }: Omit<StatItem, 'key'>) {
  if (isEmptyValue(value)) {
    return null;
  }
  return (
    <View style={styles.slot}>
      <View style={[styles.card, { borderColor: valueColor + '55' }]}>
        <View style={[styles.iconWrap, { backgroundColor: valueColor + '1A' }]}>
          <Icon size={22} color={valueColor} strokeWidth={2.2} />
        </View>
        <Text style={[styles.value, { color: valueColor }]} numberOfLines={1}>
          {value}
        </Text>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </View>
  );
}

/**
 * A row of pills. A single surviving pill looks orphaned, so the row only
 * renders once at least two items carry a real value.
 */
function StatRowBase({ items }: { items: StatItem[] }) {
  const visible = items.filter(i => !isEmptyValue(i.value));
  if (visible.length < 2) {
    return null;
  }
  return (
    <View style={styles.row}>
      {visible.map(item => (
        <StatCard
          key={item.key}
          Icon={item.Icon}
          value={item.value}
          label={item.label}
          valueColor={item.valueColor}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
  },
  slot: { flex: 1 },
  card: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    backgroundColor: THEME.colors.surface.card,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  value: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.4,
    lineHeight: 24,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.6,
    lineHeight: 14,
    color: THEME.colors.text.secondary,
    marginTop: 2,
  },
});

export const StatCard = memo(StatCardBase);
export const StatRow = memo(StatRowBase);
export default StatCard;
