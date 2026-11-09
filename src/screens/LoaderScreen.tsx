import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import ASSETS from '../assets';
import PaperBackground from '../components/PaperBackground';
import { LOADER_DURATION_MS, SCREEN_FADE_MS } from '../constants/config';
import { THEME } from '../constants/theme';

const BAR_W = 212;

/**
 * Eight seconds of brand on an ink-washed sheet. The palette is deliberately
 * the inverse of the Menu - dark paper, light type, no chips, no CTA - so the
 * two screens can never be confused for one another.
 */
export default function LoaderScreen({ onDone }: { onDone: () => void }) {
  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(14)).current;
  const logoIn = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.86)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const screen = useRef(new Animated.Value(1)).current;

  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoIn, { toValue: 1, duration: 520, useNativeDriver: true }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: THEME.anim.entry.tension,
        friction: THEME.anim.entry.friction,
        useNativeDriver: true,
      }),
    ]).start();

    const titleTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.timing(lift, { toValue: 0, duration: 420, useNativeDriver: true }),
      ]).start();
    }, 240);

    // width is a layout property - the native driver is never used on it.
    Animated.timing(progress, {
      toValue: 1,
      duration: LOADER_DURATION_MS,
      useNativeDriver: false,
    }).start();

    const outTimer = setTimeout(() => {
      Animated.timing(screen, {
        toValue: 0,
        duration: SCREEN_FADE_MS,
        useNativeDriver: true,
      }).start(() => doneRef.current());
    }, Math.max(0, LOADER_DURATION_MS - SCREEN_FADE_MS));

    return () => {
      clearTimeout(titleTimer);
      clearTimeout(outTimer);
    };
  }, [fade, lift, logoIn, logoScale, progress, screen]);

  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, BAR_W],
  });

  return (
    <PaperBackground variant="loader">
      <Animated.View style={[styles.root, { opacity: screen }]} pointerEvents="box-none">
        <View style={styles.brandCard}>
          <Animated.View
            style={{ opacity: logoIn, transform: [{ scale: logoScale }] }}
            pointerEvents="box-none"
          >
            <Image source={ASSETS.logo} style={styles.logo} resizeMode="contain" />
          </Animated.View>
        </View>

        <Animated.View
          style={[styles.titleBlock, { opacity: fade, transform: [{ translateY: lift }] }]}
          pointerEvents="box-none"
        >
          <Text style={styles.title}>CONTOUR MAP</Text>
          <Text style={styles.title}>SCOUT</Text>
          <View style={styles.titleRule} />
          <Text style={styles.subtitle}>READ THE LAND - SHEET 1:25 000</Text>
        </Animated.View>

        <View style={styles.progressBlock}>
          <View style={styles.track}>
            <Animated.View style={[styles.fillWrap, { width: barWidth }]}>
              <LinearGradient
                colors={THEME.gradients.progress}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.fill}
              />
            </Animated.View>
          </View>
          <Text style={styles.loading}>LOADING TERRAIN...</Text>
        </View>
      </Animated.View>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  brandCard: {
    width: 168,
    height: 168,
    borderRadius: THEME.radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(245,239,224,0.22)',
    backgroundColor: 'rgba(245,239,224,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 132, height: 132 },
  titleBlock: { alignItems: 'center', marginTop: 28 },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 3.5,
    lineHeight: 38,
    color: THEME.colors.text.onDark,
    textAlign: 'center',
  },
  titleRule: {
    width: 72,
    height: 2,
    backgroundColor: THEME.colors.accent.teal,
    marginTop: 14,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2.4,
    lineHeight: 16,
    color: 'rgba(225,211,181,0.8)',
    textAlign: 'center',
  },
  progressBlock: { alignItems: 'center', marginTop: 52 },
  track: {
    width: BAR_W,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(225,211,181,0.22)',
    overflow: 'hidden',
  },
  fillWrap: { height: 3, borderRadius: 2, overflow: 'hidden' },
  fill: { flex: 1 },
  loading: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    lineHeight: 14,
    color: 'rgba(225,211,181,0.6)',
    marginTop: 14,
  },
});
