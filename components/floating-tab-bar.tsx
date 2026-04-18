import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { type ReactElement } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/** Maps route name → SF Symbol icon name */
const ROUTE_ICONS: Record<string, 'house.fill' | 'person.fill'> = {
  index: 'house.fill',
  profile: 'person.fill',
};

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps): ReactElement {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const accent = Colors[colorScheme ?? 'dark'].accent;

  return (
    <View style={[styles.wrapper, { bottom: Math.max(insets.bottom, 12) + 4 }]}
      pointerEvents="box-none">
      <BlurView
        intensity={Platform.OS === 'android' ? 0 : 60}
        tint="dark"
        style={styles.pill}>

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const iconName = ROUTE_ICONS[route.name] ?? 'house.fill';

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
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabBtn}>
              {/* Active pill highlight */}
              {isFocused && (
                <View style={[styles.activePill, { backgroundColor: `${accent}1A` }]} />
              )}

              <IconSymbol
                name={iconName}
                size={22}
                color={isFocused ? accent : 'rgba(255,255,255,0.30)'}
              />

              {/* Active dot indicator */}
              {isFocused && (
                <View style={[styles.activeDot, { backgroundColor: accent }]} />
              )}
            </Pressable>
          );
        })}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    // Ensure taps pass through transparent wrapper area
  },
  pill: {
    flexDirection: 'row',
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: Platform.OS === 'android' ? 'rgba(14,18,28,0.92)' : undefined,
    // Elevation shadow for Android
    elevation: 16,
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
  },
  tabBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 12,
    position: 'relative',
    minWidth: 72,
  },
  activePill: {
    position: 'absolute',
    inset: 6,
    borderRadius: 999,
  },
  activeDot: {
    position: 'absolute',
    bottom: 5,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
