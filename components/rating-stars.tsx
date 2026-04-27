import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { type ReactElement } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

type RatingStarsProps = {
  rating: number;
  max?: number;
  size?: number;
  showValue?: boolean;
  textColor?: string;
  style?: StyleProp<ViewStyle>;
};

export function RatingStars({
  rating,
  max = 5,
  size = 16,
  showValue = true,
  textColor,
  style,
}: RatingStarsProps): ReactElement {
  const accent = useThemeColor({}, 'accent');
  const muted = useThemeColor({}, 'textMuted');
  const roundedRating = Math.max(0, Math.min(max, Math.round(rating)));
  const starIndexes = Array.from({ length: max }, (_, index) => index);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.starsRow}>
        {starIndexes.map((index) => {
          const isFilled = index < roundedRating;

          return (
            <MaterialIcons
              key={index}
              name={isFilled ? 'star' : 'star-border'}
              size={size}
              color={isFilled ? accent : muted}
            />
          );
        })}
      </View>
      {showValue ? (
        <ThemedText style={[styles.value, { color: textColor ?? muted }]}>{rating.toFixed(1)}</ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  value: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
});