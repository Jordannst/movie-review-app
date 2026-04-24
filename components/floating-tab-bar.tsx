import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { type ReactElement, useEffect } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/** Maps route name → SF Symbol icon name */
const ROUTE_ICONS: Record<string, 'house.fill' | 'person.fill'> = {
  index: 'house.fill',
  profile: 'person.fill',
};

// Tab dimensions
const TAB_COLLAPSED_WIDTH = 52;
const TAB_EXPANDED_WIDTH = 118;

// Spring config: bouncy but quick (matches CSS cubic-bezier(0.34, 1.56, 0.64, 1))
const SPRING_CONFIG = {
  damping: 16,
  stiffness: 140,
  mass: 0.7,
} as const;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps): ReactElement {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const accent = Colors[colorScheme ?? 'dark'].accent;

  return (
    <View
      style={[styles.wrapper, { bottom: Math.max(insets.bottom, 10) + 2 }]}
      pointerEvents="box-none">
      <BlurView
        intensity={Platform.OS === 'android' ? 0 : 70}
        tint="dark"
        style={styles.pill}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const iconName = ROUTE_ICONS[route.name] ?? 'house.fill';
          const label = String(options.title ?? route.name);

          function onPress() {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              navigation.navigate(route.name, route.params);
            }
          }

          function onLongPress() {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          }

          return (
            <TabBarItem
              key={route.key}
              accent={accent}
              iconName={iconName}
              isFocused={isFocused}
              label={label}
              onPress={onPress}
              onLongPress={onLongPress}
              accessibilityLabel={options.tabBarAccessibilityLabel}
            />
          );
        })}
      </BlurView>
    </View>
  );
}

// ──────────────────────── Per-tab item ────────────────────────
type TabBarItemProps = {
  iconName: 'house.fill' | 'person.fill';
  label: string;
  isFocused: boolean;
  accent: string;
  onPress: () => void;
  onLongPress: () => void;
  accessibilityLabel?: string;
};

function TabBarItem({
  iconName,
  label,
  isFocused,
  accent,
  onPress,
  onLongPress,
  accessibilityLabel,
}: TabBarItemProps): ReactElement {
  // 0 = collapsed (icon only) — 1 = expanded (icon + label + gradient bg)
  const progress = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(isFocused ? 1 : 0, SPRING_CONFIG);
  }, [isFocused, progress]);

  const containerStyle = useAnimatedStyle(() => ({
    width: interpolate(
      progress.value,
      [0, 1],
      [TAB_COLLAPSED_WIDTH, TAB_EXPANDED_WIDTH]
    ),
  }));

  const gradientStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    marginLeft: interpolate(progress.value, [0, 1], [0, 8]),
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [-6, 0]) },
    ],
  }));

  // Cross-fade between inactive & active icon copies for smooth color transition
  const inactiveIconStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
  }));
  const activeIconStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.tabBtn, containerStyle]}>
      {/* Active gradient background — fades in via opacity */}
      <Animated.View
        style={[StyleSheet.absoluteFillObject, styles.gradientWrap, gradientStyle]}
        pointerEvents="none">
        <LinearGradient
          colors={[`${accent}33`, `${accent}1A`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Stacked icons cross-fade for smooth color change */}
      <View style={styles.iconWrap}>
        <Animated.View style={[StyleSheet.absoluteFillObject, inactiveIconStyle]}>
          <IconSymbol name={iconName} size={22} color="rgba(255,255,255,0.4)" />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFillObject, activeIconStyle]}>
          <IconSymbol name={iconName} size={22} color={accent} />
        </Animated.View>
      </View>

      {/* Label slides in from left + fades in only when active */}
      <Animated.View style={labelStyle} pointerEvents="none">
        <ThemedText
          style={[styles.tabLabel, { color: accent }]}
          numberOfLines={1}>
          {label}
        </ThemedText>
      </Animated.View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: Platform.OS === 'android' ? 'rgba(14,18,28,0.92)' : undefined,
    padding: 6,
    gap: 4,
    elevation: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 28,
  },
  tabBtn: {
    height: 44,
    paddingHorizontal: 15,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  gradientWrap: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  iconWrap: {
    width: 22,
    height: 22,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
    lineHeight: 16,
  },
});
