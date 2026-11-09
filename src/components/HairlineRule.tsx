import React, { memo } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { THEME } from '../constants/theme';

/**
 * The editorial separator. This sheet uses hairlines where other styles would
 * use a shadow - it is the whole signature of the printed-map look.
 */
function HairlineRuleBase({
  width,
  color = THEME.colors.accent.brown,
  opacity = 0.18,
  height = 1,
  style,
}: {
  width?: number | `${number}%`;
  color?: string;
  opacity?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        { width: width ?? '100%', height, backgroundColor: color, opacity },
        style,
      ]}
    />
  );
}

export const HairlineRule = memo(HairlineRuleBase);
export default HairlineRule;
