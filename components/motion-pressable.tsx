import * as Haptics from 'expo-haptics';
import { type ReactElement, type ReactNode, useCallback } from 'react';
import {
  Platform,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type MotionPressableProps = Omit<PressableProps, 'style'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  haptic?: boolean;
  pressScale?: number;
  pressedOpacity?: number;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PRESS_IN_DURATION = 90;
const PRESS_OUT_DURATION = 140;
const DEFAULT_PRESS_SCALE = 0.985;
const DEFAULT_PRESSED_OPACITY = 0.96;

export function MotionPressable({
  children,
  disabled,
  haptic = false,
  onPressIn,
  onPressOut,
  pressScale = DEFAULT_PRESS_SCALE,
  pressedOpacity = DEFAULT_PRESSED_OPACITY,
  style,
  ...pressableProps
}: MotionPressableProps): ReactElement {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const resetAnimation = useCallback(() => {
    scale.value = withTiming(1, {
      duration: PRESS_OUT_DURATION,
      easing: Easing.out(Easing.quad),
    });
    opacity.value = withTiming(1, {
      duration: PRESS_OUT_DURATION,
      easing: Easing.out(Easing.quad),
    });
  }, [opacity, scale]);

  const handlePressIn = useCallback<NonNullable<PressableProps['onPressIn']>>(
    (event) => {
      if (!disabled) {
        scale.value = withTiming(pressScale, {
          duration: PRESS_IN_DURATION,
          easing: Easing.out(Easing.quad),
        });
        opacity.value = withTiming(pressedOpacity, {
          duration: PRESS_IN_DURATION,
          easing: Easing.out(Easing.quad),
        });

        if (haptic && Platform.OS !== 'web') {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }

      onPressIn?.(event);
    },
    [disabled, haptic, onPressIn, opacity, pressScale, pressedOpacity, scale]
  );

  const handlePressOut = useCallback<NonNullable<PressableProps['onPressOut']>>(
    (event) => {
      resetAnimation();
      onPressOut?.(event);
    },
    [onPressOut, resetAnimation]
  );

  return (
    <AnimatedPressable
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, animatedStyle]}
      {...pressableProps}>
      {children}
    </AnimatedPressable>
  );
}
