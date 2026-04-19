import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { startTransition, type ReactElement, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MotionPressable } from '@/components/motion-pressable';
import { PrimaryButton } from '@/components/primary-button';
import { ReviewCard } from '@/components/review-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Movie, Review } from '@/data/types';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getMovieById } from '@/services/movies';
import { getReviewsForMovie } from '@/services/reviews';

const SECTION_ENTER_DURATION = 280;
const ITEM_STAGGER = 40;
const BACKDROP_HEIGHT = 300;
const CARD_START = 232;
const GLASS_BORDER = 'rgba(255,255,255,0.10)';
const GLASS_BG = 'rgba(255,255,255,0.05)';

type ViewMode = 'all' | 'top-rated' | 'spoiler-free';

function getEnterAnimation(delay = 0) {
  return FadeInDown.duration(SECTION_ENTER_DURATION)
    .delay(delay)
    .easing(Easing.out(Easing.cubic))
    .withInitialValues({ opacity: 0, transform: [{ translateY: 10 }] });
}

function formatRuntime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`;
}

function getReviewTimestamp(review: Review): number {
  return new Date(review.createdAt).getTime();
}

export default function FullMovieReviewsScreen(): ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const movieId = Array.isArray(id) ? id[0] : id;

  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const textMuted = useThemeColor({}, 'textMuted');
  const accent = useThemeColor({}, 'accent');

  const [movie, setMovie] = useState<Movie | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [movieError, setMovieError] = useState<string | null>(null);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('all');

  useEffect(() => {
    let isActive = true;

    async function loadScreen() {
      if (!movieId) {
        setMovie(null);
        setReviews([]);
        setMovieError(null);
        setReviewsError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setMovieError(null);
      setReviewsError(null);

      try {
        const movieResult = await getMovieById(movieId);

        if (!isActive) return;

        startTransition(() => {
          setMovie(movieResult);
        });

        if (!movieResult) {
          setReviews([]);
          return;
        }

        try {
          const reviewResults = await getReviewsForMovie(movieId);

          if (!isActive) return;

          startTransition(() => {
            setReviews(reviewResults);
          });
        } catch (error) {
          if (!isActive) return;
          setReviews([]);
          setReviewsError(
            error instanceof Error ? error.message : 'Failed to load reviews from Supabase.'
          );
        }
      } catch (error) {
        if (!isActive) return;
        setMovieError(error instanceof Error ? error.message : 'Failed to load movie details from Supabase.');
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadScreen();

    return () => {
      isActive = false;
    };
  }, [movieId, reloadVersion]);

  function handleRetry(): void {
    setReloadVersion((current) => current + 1);
  }

  const visibleReviews = useMemo(() => {
    const nextReviews = [...reviews];

    if (viewMode === 'top-rated') {
      return nextReviews.sort((left, right) => {
        if (right.rating !== left.rating) {
          return right.rating - left.rating;
        }
        return getReviewTimestamp(right) - getReviewTimestamp(left);
      });
    }

    if (viewMode === 'spoiler-free') {
      return nextReviews
        .filter((review) => !review.containsSpoilers)
        .sort((left, right) => getReviewTimestamp(right) - getReviewTimestamp(left));
    }

    return nextReviews.sort((left, right) => getReviewTimestamp(right) - getReviewTimestamp(left));
  }, [reviews, viewMode]);

  const modeLabel =
    viewMode === 'top-rated'
      ? 'Top rated first'
      : viewMode === 'spoiler-free'
        ? 'Spoiler-free only'
        : 'Newest first';

  const spoilerLabel = viewMode === 'spoiler-free' ? 'Spoilers filtered out' : 'Spoilers blurred';

  if (isLoading) {
    return (
      <ThemedView style={styles.stateScreen}>
        <View style={[styles.stateCard, { backgroundColor: surface, borderColor: border }]}>
          <ThemedText type="title">Loading reviews</ThemedText>
          <ThemedText style={[styles.stateCopy, { color: textMuted }]}>
            Pulling the movie and its review stream from Supabase.
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (movieError) {
    return (
      <ThemedView style={styles.stateScreen}>
        <View style={[styles.stateCard, { backgroundColor: surface, borderColor: border }]}>
          <ThemedText type="title">Couldn&apos;t load reviews</ThemedText>
          <ThemedText style={[styles.stateCopy, { color: textMuted }]}>{movieError}</ThemedText>
          <PrimaryButton label="Retry" onPress={handleRetry} />
        </View>
      </ThemedView>
    );
  }

  if (!movie) {
    return (
      <ThemedView style={styles.stateScreen}>
        <View style={[styles.stateCard, { backgroundColor: surface, borderColor: border }]}>
          <ThemedText type="title">Movie not found</ThemedText>
          <ThemedText style={[styles.stateCopy, { color: textMuted }]}>
            The selected movie could not be found in Supabase.
          </ThemedText>
          <PrimaryButton label="Back" onPress={() => router.back()} />
        </View>
      </ThemedView>
    );
  }

  const reviewCountLabel = `${movie.reviewCount.toLocaleString()} reviews`;
  const runtimeLabel = formatRuntime(movie.runtimeMinutes);
  const visibleCountLabel = `${visibleReviews.length} visible`;
  const overlayTop = insets.top + 12;

  return (
    <ThemedView style={styles.screen}>
      <Animated.View entering={FadeIn.duration(420)} style={styles.backdropWrap}>
        <Image
          source={{ uri: movie.backdropUrl }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
        />
        <LinearGradient
          colors={['rgba(11,13,18,0.18)', 'rgba(11,13,18,0.54)', '#0B0D12']}
          locations={[0, 0.56, 1]}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={styles.backdropContent}>
          <Image source={{ uri: movie.posterUrl }} style={styles.poster} contentFit="cover" />
          <View style={styles.titleBlock}>
            <ThemedText type="title" style={styles.title} numberOfLines={2}>
              {movie.title}
            </ThemedText>
            <ThemedText style={[styles.tagline, { color: textMuted }]} numberOfLines={2}>
              {movie.tagline}
            </ThemedText>
          </View>
        </View>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.content}>
        <View style={styles.spacer} />

        <View style={styles.contentCard}>
          <Animated.View entering={getEnterAnimation(80)} style={styles.controlSurfaceWrap}>
            <BlurView intensity={20} tint="dark" style={styles.controlSurface}>
              <View style={styles.controlHead}>
                <View style={styles.controlCopy}>
                  <ThemedText style={[styles.sectionLabel, { color: accent }]}>Browse reviews</ThemedText>
                  <ThemedText type="subtitle">All community takes</ThemedText>
                  <ThemedText style={[styles.controlBody, { color: textMuted }]}>
                    One calmer control surface keeps the movie context visible without competing with the reading flow.
                  </ThemedText>
                </View>
                <View style={[styles.controlMetaPill, { borderColor: border }]}>
                  <ThemedText style={[styles.controlMetaText, { color: accent }]}>{reviewCountLabel}</ThemedText>
                </View>
              </View>

              <View style={styles.summaryRow}>
                <View style={[styles.summaryPill, { borderColor: border }]}>
                  <ThemedText style={styles.summaryValue}>{movie.averageRating.toFixed(1)}</ThemedText>
                  <ThemedText style={[styles.summaryLabel, { color: textMuted }]}>avg rating</ThemedText>
                </View>
                <View style={[styles.summaryPill, { borderColor: border }]}>
                  <ThemedText style={styles.summaryValue}>{modeLabel}</ThemedText>
                  <ThemedText style={[styles.summaryLabel, { color: textMuted }]}>view mode</ThemedText>
                </View>
                <View style={[styles.summaryPill, { borderColor: border }]}>
                  <ThemedText style={styles.summaryValue}>{spoilerLabel}</ThemedText>
                  <ThemedText style={[styles.summaryLabel, { color: textMuted }]}>spoilers</ThemedText>
                </View>
              </View>

              <View style={styles.metaRow}>
                {[movie.year.toString(), runtimeLabel, movie.genres[0] ?? 'Movie'].map((label) => (
                  <View key={label} style={[styles.metaChip, { borderColor: border }]}>
                    <ThemedText style={[styles.metaChipText, { color: textMuted }]}>{label}</ThemedText>
                  </View>
                ))}
              </View>

              <View style={styles.filterRow}>
                {[
                  { key: 'all', label: 'All reviews' },
                  { key: 'top-rated', label: 'Top rated' },
                  { key: 'spoiler-free', label: 'Spoiler free' },
                ].map((option) => {
                  const isActive = viewMode === option.key;

                  return (
                    <MotionPressable
                      key={option.key}
                      accessibilityLabel={`Show ${option.label.toLowerCase()}`}
                      accessibilityRole="button"
                      haptic
                      onPress={() => setViewMode(option.key as ViewMode)}
                      pressScale={0.97}
                      style={[
                        styles.filterChip,
                        isActive
                          ? { borderColor: accent, backgroundColor: 'rgba(245,196,81,0.12)' }
                          : { borderColor: border, backgroundColor: 'rgba(255,255,255,0.03)' },
                      ]}>
                      <ThemedText style={[styles.filterChipText, { color: isActive ? accent : textMuted }]}>
                        {option.label}
                      </ThemedText>
                    </MotionPressable>
                  );
                })}
              </View>
            </BlurView>
          </Animated.View>

          <Animated.View entering={getEnterAnimation(140)} style={styles.sectionHeader}>
            <View>
              <ThemedText style={styles.sectionLabel}>Community</ThemedText>
              <ThemedText type="subtitle">Full review stream</ThemedText>
            </View>
            <ThemedText style={[styles.sectionMeta, { color: textMuted }]}>{visibleCountLabel}</ThemedText>
          </Animated.View>

          <View style={styles.reviewList}>
            {reviewsError ? (
              <View style={[styles.inlineNotice, { backgroundColor: surface, borderColor: border }]}>
                <ThemedText type="defaultSemiBold">Couldn&apos;t load reviews</ThemedText>
                <ThemedText style={[styles.inlineNoticeCopy, { color: textMuted }]}>
                  {reviewsError}
                </ThemedText>
                <PrimaryButton label="Retry" onPress={handleRetry} />
              </View>
            ) : visibleReviews.length > 0 ? (
              visibleReviews.map((review, index) => (
                <Animated.View
                  key={review.id}
                  entering={getEnterAnimation(200 + index * ITEM_STAGGER)}>
                  <ReviewCard review={review} />
                </Animated.View>
              ))
            ) : (
              <View style={[styles.inlineNotice, { backgroundColor: surface, borderColor: border }]}>
                <ThemedText type="defaultSemiBold">No reviews in this view</ThemedText>
                <ThemedText style={[styles.inlineNoticeCopy, { color: textMuted }]}>
                  Try a different filter or come back after more community reviews land in Supabase.
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        accessibilityLabel="Go back"
        accessibilityRole="button"
        onPress={() => router.back()}
        style={[styles.backBtn, { top: overlayTop }]}>
        <BlurView intensity={28} tint="dark" style={styles.backBtnInner}>
          <ThemedText style={styles.backBtnText}>← Back</ThemedText>
        </BlurView>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0B0D12',
  },
  stateScreen: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  stateCard: {
    gap: 14,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  stateCopy: {
    fontSize: 15,
    lineHeight: 22,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  spacer: {
    height: CARD_START,
    backgroundColor: 'transparent',
  },
  backdropWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: BACKDROP_HEIGHT,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  backdropContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 14,
    paddingHorizontal: 16,
    paddingBottom: 56,
  },
  poster: {
    width: 88,
    height: 132,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: GLASS_BORDER,
    backgroundColor: '#1C2230',
  },
  titleBlock: {
    flex: 1,
    gap: 6,
    paddingBottom: 4,
  },
  title: {
    lineHeight: 34,
  },
  tagline: {
    fontSize: 13,
    lineHeight: 18,
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  backBtnInner: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    backgroundColor: GLASS_BG,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },
  contentCard: {
    backgroundColor: '#0B0D12',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 18,
    paddingBottom: 32,
    gap: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 24,
  },
  controlSurfaceWrap: {
    marginHorizontal: 16,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GLASS_BORDER,
  },
  controlSurface: {
    gap: 14,
    padding: 16,
    backgroundColor: GLASS_BG,
  },
  controlHead: {
    gap: 12,
  },
  controlCopy: {
    gap: 6,
  },
  controlBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  controlMetaPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 7,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  controlMetaText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  summaryRow: {
    gap: 10,
  },
  summaryPill: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  summaryValue: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  summaryLabel: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  metaChipText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterChipText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
  },
  sectionMeta: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  reviewList: {
    gap: 12,
    paddingHorizontal: 16,
  },
  inlineNotice: {
    gap: 10,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  inlineNoticeCopy: {
    fontSize: 14,
    lineHeight: 20,
  },
});
