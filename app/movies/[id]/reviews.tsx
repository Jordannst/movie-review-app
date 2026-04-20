import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  startTransition,
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
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
import { getReviewsForMovie, type GetMovieReviewsOptions } from '@/services/reviews';

const SECTION_ENTER_DURATION = 280;
const BACKDROP_HEIGHT = 300;
const CARD_START = 270;
const REVIEW_PAGE_SIZE = 12;
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

function getViewModeQuery(
  viewMode: ViewMode
): Pick<GetMovieReviewsOptions, 'sortBy' | 'excludeSpoilers'> {
  if (viewMode === 'top-rated') {
    return { sortBy: 'top-rated', excludeSpoilers: false };
  }

  if (viewMode === 'spoiler-free') {
    return { sortBy: 'newest', excludeSpoilers: true };
  }

  return { sortBy: 'newest', excludeSpoilers: false };
}

function getModeLabel(viewMode: ViewMode): string {
  if (viewMode === 'top-rated') {
    return 'Top rated first';
  }

  if (viewMode === 'spoiler-free') {
    return 'Spoiler-free only';
  }

  return 'Newest first';
}

export default function FullMovieReviewsScreen(): ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<Review>>(null);
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const movieId = Array.isArray(id) ? id[0] : id;

  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const textMuted = useThemeColor({}, 'textMuted');
  const accent = useThemeColor({}, 'accent');

  const [movie, setMovie] = useState<Movie | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [nextPage, setNextPage] = useState(2);
  const [isMovieLoading, setIsMovieLoading] = useState(true);
  const [isInitialReviewsLoading, setIsInitialReviewsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [movieError, setMovieError] = useState<string | null>(null);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [revealedSpoilerReviewIds, setRevealedSpoilerReviewIds] = useState<
    Record<string, boolean>
  >({});

  const reviewQuery = useMemo(() => getViewModeQuery(viewMode), [viewMode]);

  useEffect(() => {
    let isActive = true;

    async function loadMovie() {
      if (!movieId) {
        setMovie(null);
        setMovieError(null);
        setIsMovieLoading(false);
        return;
      }

      setIsMovieLoading(true);
      setMovieError(null);

      try {
        const movieResult = await getMovieById(movieId);

        if (!isActive) return;

        startTransition(() => {
          setMovie(movieResult);
        });
      } catch (error) {
        if (!isActive) return;
        setMovieError(
          error instanceof Error ? error.message : 'Failed to load movie details from Supabase.'
        );
      } finally {
        if (isActive) {
          setIsMovieLoading(false);
        }
      }
    }

    void loadMovie();

    return () => {
      isActive = false;
    };
  }, [movieId, reloadVersion]);

  useEffect(() => {
    let isActive = true;

    async function loadInitialReviews() {
      if (!movieId) {
        setReviews([]);
        setTotalCount(0);
        setHasMore(false);
        setNextPage(2);
        setReviewsError(null);
        setRevealedSpoilerReviewIds({});
        setIsInitialReviewsLoading(false);
        return;
      }

      listRef.current?.scrollToOffset({ offset: 0, animated: false });
      setIsInitialReviewsLoading(true);
      setIsFetchingMore(false);
      setReviewsError(null);
      setHasMore(false);
      setNextPage(2);
      setRevealedSpoilerReviewIds({});

      startTransition(() => {
        setReviews([]);
        setTotalCount(0);
      });

      try {
        const result = await getReviewsForMovie(movieId, {
          page: 1,
          pageSize: REVIEW_PAGE_SIZE,
          ...reviewQuery,
        });

        if (!isActive) return;

        startTransition(() => {
          setReviews(result.reviews);
          setTotalCount(result.totalCount);
        });

        setHasMore(result.hasMore);
        setNextPage(2);
      } catch (error) {
        if (!isActive) return;
        setReviewsError(
          error instanceof Error ? error.message : 'Failed to load reviews from Supabase.'
        );
      } finally {
        if (isActive) {
          setIsInitialReviewsLoading(false);
        }
      }
    }

    void loadInitialReviews();

    return () => {
      isActive = false;
    };
  }, [movieId, reloadVersion, reviewQuery]);

  const handleRetry = useCallback((): void => {
    setReloadVersion((current) => current + 1);
  }, []);

  const handleChangeViewMode = useCallback((nextViewMode: ViewMode): void => {
    setViewMode((current) => {
      if (current === nextViewMode) {
        return current;
      }

      listRef.current?.scrollToOffset({ offset: 0, animated: true });
      return nextViewMode;
    });
  }, []);

  const handleRevealSpoiler = useCallback((reviewId: Review['id']): void => {
    setRevealedSpoilerReviewIds((current) => {
      if (current[reviewId]) {
        return current;
      }

      return {
        ...current,
        [reviewId]: true,
      };
    });
  }, []);

  const handleHideSpoiler = useCallback((reviewId: Review['id']): void => {
    setRevealedSpoilerReviewIds((current) => {
      if (!current[reviewId]) {
        return current;
      }

      const next = { ...current };
      delete next[reviewId];
      return next;
    });
  }, []);

  const loadMoreReviews = useCallback(async (): Promise<void> => {
    if (
      !movieId ||
      isInitialReviewsLoading ||
      isFetchingMore ||
      !hasMore ||
      Boolean(reviewsError)
    ) {
      return;
    }

    setIsFetchingMore(true);
    setReviewsError(null);

    try {
      const result = await getReviewsForMovie(movieId, {
        page: nextPage,
        pageSize: REVIEW_PAGE_SIZE,
        ...reviewQuery,
      });

      startTransition(() => {
        setReviews((current) => {
          const existingIds = new Set(current.map((review) => review.id));
          const nextReviews = result.reviews.filter((review) => !existingIds.has(review.id));
          return current.concat(nextReviews);
        });
        setTotalCount(result.totalCount);
      });

      setHasMore(result.hasMore);
      setNextPage((current) => current + 1);
    } catch (error) {
      setReviewsError(
        error instanceof Error ? error.message : 'Failed to load more reviews from Supabase.'
      );
    } finally {
      setIsFetchingMore(false);
    }
  }, [
    hasMore,
    isFetchingMore,
    isInitialReviewsLoading,
    movieId,
    nextPage,
    reviewQuery,
    reviewsError,
  ]);

  const renderReviewItem = useCallback(
    ({ item }: { item: Review }) => (
      <View style={styles.reviewItem}>
        <ReviewCard
          review={item}
          isSpoilerRevealed={Boolean(revealedSpoilerReviewIds[item.id]) || !item.containsSpoilers}
          onRevealSpoiler={handleRevealSpoiler}
          onHideSpoiler={handleHideSpoiler}
        />
      </View>
    ),
    [handleHideSpoiler, handleRevealSpoiler, revealedSpoilerReviewIds]
  );

  const modeLabel = getModeLabel(viewMode);
  const spoilerLabel = viewMode === 'spoiler-free' ? 'Spoilers filtered out' : 'Spoilers blurred';

  if (isMovieLoading) {
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
  const visibleCountLabel = `${totalCount.toLocaleString()} visible`;
  const overlayTop = insets.top + 12;

  const listHeader = (
    <>
      <View style={styles.spacer} />

      <View style={styles.contentCard}>
        <Animated.View entering={getEnterAnimation(80)} style={styles.controlSurfaceWrap}>
          <View style={styles.controlSurface}>
            <View style={styles.controlHead}>
              <View style={styles.controlCopy}>
                <ThemedText style={[styles.sectionLabel, { color: accent }]}>Browse reviews</ThemedText>
                <ThemedText type="subtitle">All community takes</ThemedText>
                <ThemedText style={[styles.controlBody, { color: textMuted }]}>
                  One calmer control surface keeps the movie context visible without competing with
                  the reading flow.
                </ThemedText>
              </View>
              <View style={[styles.controlMetaPill, { borderColor: border }]}>
                <ThemedText style={[styles.controlMetaText, { color: accent }]}>
                  {reviewCountLabel}
                </ThemedText>
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
                    onPress={() => handleChangeViewMode(option.key as ViewMode)}
                    pressScale={0.97}
                    style={[
                      styles.filterChip,
                      isActive
                        ? { borderColor: accent, backgroundColor: 'rgba(245,196,81,0.12)' }
                        : { borderColor: border, backgroundColor: 'rgba(255,255,255,0.03)' },
                    ]}>
                    <ThemedText
                      style={[styles.filterChipText, { color: isActive ? accent : textMuted }]}>
                      {option.label}
                    </ThemedText>
                  </MotionPressable>
                );
              })}
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={getEnterAnimation(140)} style={styles.sectionHeader}>
          <View>
            <ThemedText style={styles.sectionLabel}>Community</ThemedText>
            <ThemedText type="subtitle">Full review stream</ThemedText>
          </View>
          <ThemedText style={[styles.sectionMeta, { color: textMuted }]}>{visibleCountLabel}</ThemedText>
        </Animated.View>

        <View style={styles.reviewListLead} />
      </View>
    </>
  );

  const listEmptyComponent = isInitialReviewsLoading ? (
    <View style={[styles.inlineNotice, styles.edgeInset, { backgroundColor: surface, borderColor: border }]}>
      <ActivityIndicator color={accent} />
      <ThemedText type="defaultSemiBold">Loading reviews for this view</ThemedText>
      <ThemedText style={[styles.inlineNoticeCopy, { color: textMuted }]}>
        Pulling the first page from Supabase.
      </ThemedText>
    </View>
  ) : reviewsError ? (
    <View style={[styles.inlineNotice, styles.edgeInset, { backgroundColor: surface, borderColor: border }]}>
      <ThemedText type="defaultSemiBold">Couldn&apos;t load reviews</ThemedText>
      <ThemedText style={[styles.inlineNoticeCopy, { color: textMuted }]}>{reviewsError}</ThemedText>
      <PrimaryButton label="Retry" onPress={handleRetry} />
    </View>
  ) : (
    <View style={[styles.inlineNotice, styles.edgeInset, { backgroundColor: surface, borderColor: border }]}>
      <ThemedText type="defaultSemiBold">No reviews in this view</ThemedText>
      <ThemedText style={[styles.inlineNoticeCopy, { color: textMuted }]}>
        Try a different filter or come back after more community reviews land in Supabase.
      </ThemedText>
    </View>
  );

  const listFooterComponent = isFetchingMore ? (
    <View style={styles.listFooter}>
      <ActivityIndicator color={accent} />
      <ThemedText style={[styles.listFooterText, { color: textMuted }]}>Loading more reviews</ThemedText>
    </View>
  ) : reviewsError && reviews.length > 0 ? (
    <View style={[styles.inlineNotice, styles.edgeInset, styles.listFooterNotice, { backgroundColor: surface, borderColor: border }]}>
      <ThemedText type="defaultSemiBold">Couldn&apos;t load more reviews</ThemedText>
      <ThemedText style={[styles.inlineNoticeCopy, { color: textMuted }]}>{reviewsError}</ThemedText>
      <PrimaryButton label="Retry" onPress={handleRetry} />
    </View>
  ) : (
    <View style={styles.listFooterSpacer} />
  );

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

      <FlatList
        ref={listRef}
        data={reviews}
        keyExtractor={(item) => item.id}
        renderItem={renderReviewItem}
        ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmptyComponent}
        ListFooterComponent={listFooterComponent}
        onEndReached={() => {
          void loadMoreReviews();
        }}
        onEndReachedThreshold={0.35}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.content}
      />

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
    backgroundColor: 'rgba(22,25,35,0.96)',
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
  reviewListLead: {
    height: 12,
  },
  reviewItem: {
    paddingHorizontal: 16,
  },
  listSeparator: {
    height: 12,
  },
  edgeInset: {
    marginHorizontal: 16,
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
  listFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingTop: 14,
    paddingBottom: 8,
  },
  listFooterText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  listFooterNotice: {
    marginTop: 14,
  },
  listFooterSpacer: {
    height: 8,
  },
});
