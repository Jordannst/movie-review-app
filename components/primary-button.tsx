import { type ReactElement } from 'react';
import { StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { MotionPressable } from '@/components/motion-pressable';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

type PrimaryButtonProps = PressableProps & {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({
  label,
  variant = 'primary',
  disabled,
  fullWidth = true,
  style,
  ...pressableProps
}: PrimaryButtonProps): ReactElement {
  const accent = useThemeColor({}, 'accent');
  const surfaceMuted = useThemeColor({}, 'surfaceMuted');
  const text = useThemeColor({}, 'text');
  const textMuted = useThemeColor({}, 'textMuted');
  const danger = useThemeColor({}, 'danger');
  const border = useThemeColor({}, 'border');

  let backgroundColor = accent;

  if (variant === 'secondary') {
    backgroundColor = surfaceMuted;
  } else if (variant === 'danger') {
    backgroundColor = danger;
  }

  const textColor = variant === 'primary' ? '#0B0D12' : text;
  const borderColor = variant === 'secondary' ? border : 'transparent';

  return (
    <MotionPressable
      accessibilityRole="button"
      disabled={disabled}
      haptic
      pressScale={0.985}
      pressedOpacity={0.94}
      style={[
        styles.button,
        fullWidth && styles.fullWidth,
        {
          backgroundColor: disabled ? surfaceMuted : backgroundColor,
          borderColor,
        },
        style,
      ]}
      {...pressableProps}>
      <ThemedText style={[styles.label, { color: disabled ? textMuted : textColor }]}>{label}</ThemedText>
    </MotionPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  fullWidth: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
});