import { useCallback, useRef } from 'react';
import { Animated } from 'react-native';
import { THEME } from '../constants/theme';

/**
 * Shared press feedback. The Pressable stays the PARENT and drives this value;
 * the Animated.View it scales lives INSIDE the Pressable, never around it
 * (an animated wrapper around a Pressable swallows onPress on Android release).
 */
export function usePressScale(to = 0.97) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: to,
      tension: THEME.anim.press.tension,
      friction: THEME.anim.press.friction,
      useNativeDriver: true,
    }).start();
  }, [scale, to]);

  const onPressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      tension: THEME.anim.press.tension,
      friction: THEME.anim.press.friction,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  return { scale, onPressIn, onPressOut };
}

export default usePressScale;
