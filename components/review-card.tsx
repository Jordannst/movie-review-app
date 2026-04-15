import { type ReactElement } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { RatingStars } from '@/components/rating-stars';
import { ThemedText } from '@/components/themed-text';
import { Review } from '@/data/types';
import { useThemeColor } from '@/hooks/use-theme-color';

type ReviewCardProps = {
  review: Review;
  style?: StyleProp<ViewStyle>;
};

function formatReviewDate(createdAt: string): string {
  const [year, month, day] = createdAt.split('-').map(Number);
  const localDate = new Date(year, (month ?? 1) - 1, day ?? 1);

  return localDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function ReviewCard({ review, style }: ReviewCardProps): ReactElement {
  const surface = useThemeColor({}, 'surface');
  const surfaceMuted = useThemeColor({}, 'surfaceMuted');
  const border = useThemeColor({}, 'border');
  const textMuted = useThemeColor({}, 'textMuted');
  const accent = useThemeColor({}, 'accent');

  return (
    <View style={[styles.card, { backgroundColor: surface, borderColor: border }, style]}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <ThemedText type="defaultSemiBold">{review.authorName}</ThemedText>
          <ThemedText style={[styles.date, { color: textMuted }]}>{formatReviewDate(review.createdAt)}</ThemedText>
        </View>

        {review.containsSpoilers ? (
          <View style={[styles.badge, { backgroundColor: surfaceMuted, borderColor: border }]}>
            <ThemedText style={[styles.badgeText, { color: accent }]}>Spoilers</ThemedText>
          </View>
        ) : null}
      </View>

      <RatingStars rating={review.rating} />

      <View style={styles.body}>
        <ThemedText type="defaultSemiBold">{review.title}</ThemedText>
        <ThemedText style={[styles.copy, { color: textMuted }]}>{review.body}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  date: {
    fontSize: 13,
    lineHeight: 18,
  },
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  body: {
    gap: 8,
  },
  copy: {
    fontSize: 14,
    lineHeight: 21,
  },
});
