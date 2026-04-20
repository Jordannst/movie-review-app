import { useEffect } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type ShimmerViewProps = {
  style?: StyleProp<ViewStyle>;
  /** Base color for the shimmer bar. Defaults to a dark surface tone. */
  color?: string;
  /** Duration of one pulse cycle in ms. Default 900. */
  duration?: number;
};

/**
 * A pulsing shimmer placeholder. Drop-in replacement for static skeleton bars.
 *
 * Usage:
 *   <ShimmerView style={{ height: 14, width: '60%', borderRadius: 6 }} color="#1E2028" />
 */
export function ShimmerView({ style, color = '#1E2028', duration = 900 }: ShimmerViewProps) {
  const opacity = useSharedValue(0.45);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration }),
        withTiming(0.45, { duration })
      ),
      -1,
      false
    );
  }, [duration, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.base,
        { backgroundColor: color },
        style,
        animStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 6,
  },
});
