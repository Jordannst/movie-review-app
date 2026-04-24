import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePathname, useRouter, Slot } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient as SvgGrad, Path, Stop } from 'react-native-svg';

import { PosterWall } from '@/components/poster-wall';

const { width: SCREEN_W } = Dimensions.get('window');
const HOLES = Array.from({ length: 7 });

function FilmStrip({ side }: { side: 'left' | 'right' }) {
  return (
    <View style={[styles.strip, side === 'right' ? styles.stripR : styles.stripL]}>
      {HOLES.map((_, i) => <View key={i} style={styles.hole} />)}
    </View>
  );
}

function WaveTop() {
  const waveX = useSharedValue(0);

  useEffect(() => {
    waveX.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [waveX]);

  const waveStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: waveX.value * 30 - 15 },
      { scaleX: 1.15 },
    ],
  }));

  return (
    <Animated.View style={styles.waveWrap} entering={FadeIn.duration(300).delay(650)}>
      <Animated.View style={[StyleSheet.absoluteFill, waveStyle]}>
        <Svg style={StyleSheet.absoluteFill} width={SCREEN_W} height={56} viewBox="0 0 1440 120" preserveAspectRatio="none">
          <Defs>
            <SvgGrad id="wg" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#F5C451" />
              <Stop offset="1" stopColor="#FF8C42" />
            </SvgGrad>
          </Defs>
          <Path fill="url(#wg)" opacity={0.15} d="M0,40 C240,100 480,0 720,60 C960,120 1200,20 1440,70 L1440,120 L0,120 Z" />
        </Svg>
        <Svg style={StyleSheet.absoluteFill} width={SCREEN_W} height={56} viewBox="0 0 1440 120" preserveAspectRatio="none">
          <Path fill="#0C0E18" d="M0,50 C240,110 480,10 720,65 C960,120 1200,25 1440,75 L1440,120 L0,120 Z" />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

function PulsingGlow() {
  const opacity = useSharedValue(0.06);

  useEffect(() => {
    opacity.value = withTiming(0.12, { duration: 1500 }, () => {
      opacity.value = withTiming(0.06, { duration: 1500 });
    });
    const interval = setInterval(() => {
      opacity.value = withTiming(0.12, { duration: 1500 }, () => {
        opacity.value = withTiming(0.06, { duration: 1500 });
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[styles.glowOuter, animStyle]}
      entering={FadeIn.duration(400).delay(200)}
    />
  );
}

export default function AuthLayout() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();
  const isRegister = pathname === '/(auth)/register';
  const isFirstRender = useRef(true);
  const slideX = useSharedValue(0);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    slideX.value = isRegister ? SCREEN_W : -SCREEN_W;
    slideX.value = withTiming(0, {
      duration: 350,
      easing: Easing.out(Easing.cubic),
    });
  }, [isRegister, slideX]);

  const formSlideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
  }));

  return (
    <View style={styles.root}>
      {/* ── SHARED HERO ───────────────────────────── */}
      <LinearGradient
        colors={['#1E1040', '#0C0E18']}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={styles.hero}
      >
        <PosterWall />
        <FilmStrip side="left" />
        <FilmStrip side="right" />
        <LinearGradient
          colors={['rgba(255,255,255,0.04)', 'transparent', 'rgba(0,0,0,0.22)']}
          style={StyleSheet.absoluteFillObject}
        />
        <LinearGradient
          colors={['transparent', 'rgba(12,14,24,0.4)', '#0C0E18']}
          style={styles.heroFade}
        />

        {isRegister && (
          <Pressable
            style={({ pressed }) => [styles.backBtn, { top: insets.top + 8 }, pressed && styles.backBtnPressed]}
            onPress={() => router.replace('/(auth)/login')}
            hitSlop={12}
          >
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
        )}

        <PulsingGlow />

        <Animated.View
          entering={FadeIn.duration(400).delay(300).easing(Easing.out(Easing.cubic))}
          style={styles.logoWrap}
        >
          <LinearGradient
            colors={['#F5C451', '#FF8C42']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoCircle}
          >
            <Text style={styles.logoEmoji}>🎬</Text>
          </LinearGradient>
        </Animated.View>

        <Animated.Text
          style={styles.heroTitle}
          entering={FadeInDown.duration(350).delay(500).easing(Easing.out(Easing.cubic))}
        >
          {isRegister ? 'Join the community' : 'Welcome back!'}
        </Animated.Text>
        <Animated.Text
          style={styles.heroSub}
          entering={FadeInDown.duration(350).delay(600).easing(Easing.out(Easing.cubic))}
        >
          MOVIE REVIEW
        </Animated.Text>
      </LinearGradient>

      {/* ── FORM AREA ─────────────────────────────── */}
      <WaveTop />
      <View style={styles.formContainer}>
        <Animated.View style={[styles.formSlider, formSlideStyle]}>
          <Slot />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0C0E18' },

  hero: {
    height: 280,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 48,
    overflow: 'hidden',
  },
  heroFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 84 },
  stripL: { left: 0 },
  stripR: { right: 0 },
  strip: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 14,
    backgroundColor: 'rgba(0,0,0,0.38)',
    alignItems: 'center',
    paddingVertical: 10,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  hole: { width: 10, height: 6, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.72)' },
  glowOuter: {
    position: 'absolute',
    top: 20,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#F5C451',
  },

  backBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  backBtnPressed: { backgroundColor: 'rgba(255,255,255,0.15)' },

  logoWrap: { zIndex: 2 },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#F5C451',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
  },
  logoEmoji: { fontSize: 24 },
  heroTitle: { fontSize: 22, fontWeight: '900', color: '#fff', zIndex: 2 },
  heroSub: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#F5C451',
    opacity: 0.7,
    marginTop: 4,
    zIndex: 2,
  },

  waveWrap: { width: '100%', height: 56, marginTop: -56, zIndex: 3 },

  formContainer: { flex: 1, backgroundColor: '#0C0E18', overflow: 'hidden' },
  formSlider: { flex: 1 },
});
