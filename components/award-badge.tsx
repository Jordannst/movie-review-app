import Ionicons from '@expo/vector-icons/Ionicons';
import { type ReactElement } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';

const YELLOW = '#F5C451';
const GLASS_BG = 'rgba(245,196,81,0.14)';
const GLASS_BORDER = 'rgba(245,196,81,0.45)';

type AwardBadgeProps = {
  /** Optional override label; defaults to "Awarded". */
  label?: string;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
};

/** Tiny pill that signals at least one winning award. */
export function AwardBadge({ label = 'Awarded', size = 'sm', style }: AwardBadgeProps): ReactElement {
  const iconSize = size === 'sm' ? 11 : 13;
  const sizeStyle = size === 'sm' ? styles.pillSm : styles.pillMd;

  return (
    <View style={[styles.pill, sizeStyle, style]}>
      <Ionicons name="trophy" size={iconSize} color={YELLOW} />
      <ThemedText style={styles.text}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    backgroundColor: GLASS_BG,
    alignSelf: 'flex-start',
  },
  pillSm: { paddingHorizontal: 8, paddingVertical: 3 },
  pillMd: { paddingHorizontal: 10, paddingVertical: 5 },
  text: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: YELLOW,
  },
});
