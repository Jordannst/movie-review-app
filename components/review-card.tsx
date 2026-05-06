import { useEffect, useState, type ReactElement } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { MotionPressable } from '@/components/motion-pressable';
import { RatingStars } from '@/components/rating-stars';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/auth-context';
import { Review } from '@/data/types';
import { useThemeColor } from '@/hooks/use-theme-color';

type ReviewCardProps = {
  review: Review;
  style?: StyleProp<ViewStyle>;
  isSpoilerRevealed?: boolean;
  onRevealSpoiler?: (reviewId: Review['id']) => void;
  onHideSpoiler?: (reviewId: Review['id']) => void;
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

/**
 * Return "Edited <date>" label when the review has been edited
 * after initial creation. Compared by date (YYYY-MM-DD) granularity.
 */
function formatEditedLabel(review: Review): string | null {
  if (!review.updatedAt) return null;
  if (review.updatedAt === review.createdAt) return null;
  return `Edited ${formatReviewDate(review.updatedAt)}`;
}

export function ReviewCard({
  review,
  style,
  isSpoilerRevealed: controlledIsSpoilerRevealed,
  onRevealSpoiler,
  onHideSpoiler,
}: ReviewCardProps): ReactElement {
  const { user } = useAuth();
  const surface = useThemeColor({}, 'surface');
  const surfaceMuted = useThemeColor({}, 'surfaceMuted');
  const border = useThemeColor({}, 'border');
  const textMuted = useThemeColor({}, 'textMuted');
  const accent = useThemeColor({}, 'accent');
  const [localIsSpoilerRevealed, setLocalIsSpoilerRevealed] = useState(
    () => !review.containsSpoilers
  );
  const isSpoilerRevealed = controlledIsSpoilerRevealed ?? localIsSpoilerRevealed;
  const usesControlledSpoilerState = controlledIsSpoilerRevealed !== undefined;

  useEffect(() => {
    if (!usesControlledSpoilerState) {
      setLocalIsSpoilerRevealed(!review.containsSpoilers);
    }
  }, [review.containsSpoilers, review.id, usesControlledSpoilerState]);

  const isSpoilerHidden = Boolean(review.containsSpoilers && !isSpoilerRevealed);
  const isOwnReview = Boolean(user?.id && review.userId && user.id === review.userId);

  function handleRevealSpoiler(): void {
    if (onRevealSpoiler) {
      onRevealSpoiler(review.id);
      return;
    }
    setLocalIsSpoilerRevealed(true);
  }

  function handleHideSpoiler(): void {
    if (onHideSpoiler) {
      onHideSpoiler(review.id);
      return;
    }
    setLocalIsSpoilerRevealed(false);
  }

  const editedLabel = formatEditedLabel(review);

  return (
    <View style={[styles.card, { backgroundColor: surface, borderColor: border }, style]}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <View style={styles.authorRow}>
            <ThemedText type="defaultSemiBold" numberOfLines={1} style={styles.authorName}>
              {review.authorName}
            </ThemedText>
            {isOwnReview ? (
              <View style={[styles.youBadge, { backgroundColor: surfaceMuted, borderColor: accent }]}>
                <ThemedText style={[styles.youBadgeText, { color: accent }]}>You</ThemedText>
              </View>
            ) : null}
          </View>
          <View style={styles.dateRow}>
            <ThemedText style={[styles.date, { color: textMuted }]}>{formatReviewDate(review.createdAt)}</ThemedText>
            {editedLabel ? (
              <>
                <ThemedText style={[styles.dateDot, { color: textMuted }]}>•</ThemedText>
                <ThemedText style={[styles.editedLabel, { color: accent }]}>{editedLabel}</ThemedText>
              </>
            ) : null}
          </View>
        </View>

        {review.containsSpoilers ? (
          <View style={[styles.badge, { backgroundColor: surfaceMuted, borderColor: border }]}>
            <ThemedText style={[styles.badgeText, { color: accent }]}>Spoilers</ThemedText>
          </View>
        ) : null}
      </View>

      <RatingStars rating={review.rating} />

      <View style={styles.body}>
        {isSpoilerHidden ? (
          <>
            <View
              style={[
                styles.spoilerToolbar,
                { backgroundColor: surfaceMuted, borderColor: border },
              ]}>
              <View style={styles.spoilerToolbarCopy}>
                <ThemedText style={styles.spoilerToolbarTitle}>Spoiler review hidden</ThemedText>
                <ThemedText style={[styles.spoilerToolbarText, { color: textMuted }]}>
                  Tap reveal to read the full title and review text.
                </ThemedText>
              </View>
            </View>

            {/* Placeholder bars — actual text is NOT rendered */}
            <View style={[styles.spoilerPlaceholder, { borderColor: border, backgroundColor: surfaceMuted }]}>
              <View style={[styles.placeholderBar, styles.placeholderBarTitle, { backgroundColor: border }]} />
              <View style={[styles.placeholderBar, { backgroundColor: border }]} />
              <View style={[styles.placeholderBar, styles.placeholderBarShort, { backgroundColor: border }]} />
            </View>

            <MotionPressable
              accessibilityLabel="Reveal spoiler review"
              accessibilityRole="button"
              haptic
              onPress={handleRevealSpoiler}
              style={[
                styles.revealButton,
                { backgroundColor: surfaceMuted, borderColor: border },
              ]}>
              <ThemedText style={[styles.revealButtonText, { color: accent }]}>
                Reveal spoiler
              </ThemedText>
            </MotionPressable>
          </>
        ) : (
          <>
            <ThemedText type="defaultSemiBold">{review.title}</ThemedText>
            <ThemedText style={[styles.copy, { color: textMuted }]}>{review.body}</ThemedText>
            {review.containsSpoilers ? (
              <MotionPressable
                accessibilityLabel="Hide spoiler review"
                accessibilityRole="button"
                haptic
                onPress={handleHideSpoiler}
                style={[
                  styles.revealButton,
                  { backgroundColor: surfaceMuted, borderColor: border },
                ]}>
                <ThemedText style={[styles.revealButtonText, { color: textMuted }]}>
                  Hide spoiler
                </ThemedText>
              </MotionPressable>
            ) : null}
          </>
        )}
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
    minWidth: 0,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  authorName: {
    flexShrink: 1,
  },
  youBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  youBadgeText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  date: {
    fontSize: 13,
    lineHeight: 18,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  dateDot: {
    fontSize: 13,
    lineHeight: 18,
    marginHorizontal: 6,
  },
  editedLabel: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    fontStyle: 'italic',
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
  spoilerToolbar: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  spoilerToolbarCopy: {
    gap: 3,
  },
  spoilerToolbarTitle: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
  },
  spoilerToolbarText: {
    fontSize: 12,
    lineHeight: 17,
  },
  spoilerPlaceholder: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    minHeight: 96,
    justifyContent: 'center',
  },
  placeholderBar: {
    height: 10,
    borderRadius: 6,
    opacity: 0.5,
  },
  placeholderBarTitle: {
    height: 13,
    width: '55%',
    marginBottom: 2,
  },
  placeholderBarShort: {
    width: '40%',
  },
  revealButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  revealButtonText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  copy: {
    fontSize: 14,
    lineHeight: 21,
  },
});
