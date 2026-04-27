import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { startTransition, type ReactElement, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, SlideInDown, SlideOutDown } from 'react-native-reanimated';
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
import { PlayButton } from '@/components/ui/play-button';
// Import data lokal sebagai cadangan
import { movies as localMovies } from '@/data/movies';

const SECTION_ENTER_DURATION = 300;
const ITEM_STAGGER = 40;
const BACKDROP_HEIGHT = 460;
const CARD_START = 440;

function getEnterAnimation(delay = 0) {
  return FadeInDown.duration(SECTION_ENTER_DURATION)
    .delay(delay)
    .easing(Easing.out(Easing.cubic))
    .withInitialValues({ opacity: 0, transform: [{ translateY: 12 }] });
}

function formatRuntime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function MovieDetailScreen(): ReactElement {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const movieId = Array.isArray(id) ? id[0] : id;
  const [movie, setMovie] = useState<Movie | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isMovieLoading, setIsMovieLoading] = useState(true);
  const [movieError, setMovieError] = useState<string | null>(null);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);
  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const textMuted = useThemeColor({}, 'textMuted');
  const accent = useThemeColor({}, 'accent');
  const insets = useSafeAreaInsets();
  const overlayTop = insets.top + 12;

  useEffect(() => {
    let isActive = true;

    async function loadMovieDetail() {
      if (!movieId) {
        setMovie(null);
        setReviews([]);
        setMovieError(null);
        setReviewsError(null);
        setIsMovieLoading(false);
        return;
      }

      setIsMovieLoading(true);
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
          const reviewResults = await getReviewsForMovie(movieId, {
            page: 1,
            pageSize: 2,
            sortBy: 'newest',
          });

          if (!isActive) return;

          startTransition(() => {
            setReviews(reviewResults.reviews);
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
          setIsMovieLoading(false);
        }
      }
    }

    void loadMovieDetail();

    return () => {
      isActive = false;
    };
  }, [movieId, reloadVersion]);

  function handleBackToHome(): void {
    router.replace('/');
  }

  function handleRetry(): void {
    setReloadVersion((current) => current + 1);
  }

  if (isMovieLoading) {
    return (
      <ThemedView style={styles.missingScreen}>
        <View style={[styles.missingCard, { backgroundColor: surface, borderColor: border }]}>
          <ThemedText type="title">Loading movie</ThemedText>
          <ThemedText style={[styles.missingCopy, { color: textMuted }]}>
            Pulling movie details and reviews from Supabase.
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (movieError) {
    return (
      <ThemedView style={styles.missingScreen}>
        <View style={[styles.missingCard, { backgroundColor: surface, borderColor: border }]}>
          <ThemedText type="title">Couldn&apos;t load movie</ThemedText>
          <ThemedText style={[styles.missingCopy, { color: textMuted }]}>
            {movieError}
          </ThemedText>
          <PrimaryButton label="Retry" onPress={handleRetry} />
        </View>
      </ThemedView>
    );
  }

  if (!movie) {
    return (
      <ThemedView style={styles.missingScreen}>
        <View style={[styles.missingCard, { backgroundColor: surface, borderColor: border }]}>
          <ThemedText type="title">Movie not found</ThemedText>
          <ThemedText style={[styles.missingCopy, { color: textMuted }]}>
            The selected movie doesn&apos;t exist in Supabase.
          </ThemedText>
          <PrimaryButton label="Back to Home" onPress={handleBackToHome} />
        </View>
      </ThemedView>
    );
  }

  const selectedMovie = movie;
  const reviewCountLabel = `${selectedMovie.reviewCount} reviews`;
  const ratingLabel = selectedMovie.averageRating.toFixed(1);
  const reviewPreview = reviews.slice(0, 2);

  function handleWriteReview(): void {
    router.push({
      pathname: '/reviews/new',
      params: { movieId: selectedMovie.id },
    });
  }

  function handleOpenAllReviews(): void {
    router.push(`/movies/${selectedMovie.id}/reviews`);
  }

  return (
    <Animated.View
      style={styles.screen}
      entering={SlideInDown.duration(380).easing(Easing.out(Easing.cubic))}
      exiting={SlideOutDown.duration(320).easing(Easing.in(Easing.cubic))}>

      <Animated.View entering={FadeIn.duration(500)} style={styles.backdropWrap}>
        <Image
          source={{ uri: selectedMovie.backdropUrl }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
        />
        <LinearGradient
          colors={['rgba(11,13,18,0.10)', 'rgba(11,13,18,0.55)', '#0B0D12']}
          locations={[0.2, 0.70, 1]}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={styles.backdropContent}>
          <Image
            source={{ uri: selectedMovie.posterUrl }}
            style={styles.poster}
            contentFit="cover"
          />
          <View style={styles.titleBlock}>
            <ThemedText type="title" style={styles.title} numberOfLines={2}>
              {selectedMovie.title}
            </ThemedText>
            <ThemedText style={[styles.tagline, { color: textMuted }]} numberOfLines={2}>
              {selectedMovie.tagline}
            </ThemedText>
          </View>
        </View>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}>

        {/* --- Tombol Play di Sini (Mengambil data lokal jika Supabase kosong) --- */}
        <View style={styles.spacer}>
          <View style={styles.playButtonWrapper} pointerEvents="box-none">
             <PlayButton 
               trailerUrl={
                 selectedMovie.trailerUrl || 
                 localMovies.find(m => m.id === selectedMovie.id)?.trailerUrl
               } 
               size={64} 
             />
          </View>
        </View>

        <View style={styles.contentCard}>

          <Animated.View entering={getEnterAnimation(100)} style={styles.metaStripWrap}>
            <BlurView intensity={20} tint="dark" style={styles.metaStrip}>
              {[
                { label: 'Year', value: selectedMovie.year.toString() },
                { label: 'Runtime', value: formatRuntime(selectedMovie.runtimeMinutes) },
                { label: 'Director', value: selectedMovie.director.split(' ').pop() ?? selectedMovie.director },
              ].map((item, i, arr) => (
                <View
                  key={item.label}
                  style={[styles.metaItem, i < arr.length - 1 && styles.metaItemBorder]}>
                  <ThemedText style={[styles.metaLabel, { color: textMuted }]} numberOfLines={1}>{item.label}</ThemedText>
                  <ThemedText style={styles.metaValue} numberOfLines={1}>{item.value}</ThemedText>
                </View>
              ))}
            </BlurView>
          </Animated.View>

          <Animated.View entering={getEnterAnimation(140)} style={styles.genreRow}>
            {selectedMovie.genres.map((genre) => (
              <BlurView
                key={genre}
                intensity={18}
                tint="light"
                style={styles.genreChip}>
                <ThemedText style={styles.genreText}>{genre}</ThemedText>
              </BlurView>
            ))}
          </Animated.View>

          <Animated.View entering={getEnterAnimation(180)} style={styles.section}>
            <ThemedText style={[styles.sectionLabel, { color: accent }]}>Synopsis</ThemedText>
            <ThemedText style={[styles.bodyCopy, { color: textMuted }]}>
              {selectedMovie.synopsis}
            </ThemedText>
          </Animated.View>

          <Animated.View entering={getEnterAnimation(220)} style={styles.ctaWrap}>
            <LinearGradient
              colors={['rgba(124,58,237,0.18)', 'rgba(59,130,246,0.10)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaGradient}>
              <BlurView intensity={22} tint="dark" style={styles.ctaCard}>
                <View style={styles.ctaTextBlock}>
                  <ThemedText style={[styles.ctaKicker, { color: accent }]}>Seen this film?</ThemedText>
                  <ThemedText style={[styles.ctaBody, { color: textMuted }]}>
                    Share your take with the community — your review helps others decide.
                  </ThemedText>
                </View>
                <PrimaryButton label="Write Review" onPress={handleWriteReview} />
              </BlurView>
            </LinearGradient>
          </Animated.View>

          <Animated.View entering={getEnterAnimation(260)} style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <ThemedText style={styles.sectionLabel}>Community</ThemedText>
              <ThemedText type="subtitle">Recent reviews preview</ThemedText>
            </View>
            <View style={styles.sectionHeaderActions}>
              <ThemedText style={[styles.reviewMeta, { color: textMuted }]} numberOfLines={1}>{reviewCountLabel}</ThemedText>
              <MotionPressable
                accessibilityLabel="Open all reviews"
                accessibilityRole="button"
                haptic
                onPress={handleOpenAllReviews}
                pressScale={0.97}
                style={[styles.inlineAction, { borderColor: border, backgroundColor: surface }]}>
                <ThemedText style={[styles.inlineActionText, { color: accent }]}>See all</ThemedText>
              </MotionPressable>
            </View>
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
            ) : reviewPreview.length > 0 ? (
              reviewPreview.map((review, index) => (
                <Animated.View
                  key={review.id}
                  entering={getEnterAnimation(310 + index * ITEM_STAGGER)}>
                  <ReviewCard review={review} />
                </Animated.View>
              ))
            ) : (
              <View style={[styles.inlineNotice, { backgroundColor: surface, borderColor: border }]}>
                <ThemedText type="defaultSemiBold">No reviews yet</ThemedText>
                <ThemedText style={[styles.inlineNoticeCopy, { color: textMuted }]}>
                  Supabase doesn&apos;t have any reviews for this movie yet.
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
        <BlurView intensity={30} tint="dark" style={styles.backBtnInner}>
          <ThemedText style={styles.backBtnText}>← Back</ThemedText>
        </BlurView>
      </TouchableOpacity>

      <Animated.View entering={getEnterAnimation(80)} style={[styles.ratingPillWrap, { top: overlayTop }]}>
        <BlurView intensity={30} tint="dark" style={styles.ratingPill}>
          <ThemedText style={styles.ratingStarText}>★</ThemedText>
          <ThemedText style={styles.ratingNumText}>{ratingLabel}</ThemedText>
          <ThemedText style={[styles.ratingCountText, { color: textMuted }]}>
            · {reviewCountLabel}
          </ThemedText>
        </BlurView>
      </Animated.View>

    </Animated.View>
  );
}

const GLASS_BORDER = 'rgba(255,255,255,0.10)';
const GLASS_BG = 'rgba(255,255,255,0.05)';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0B0D12',
  },
  scroll: {
    flex: 1,
  },
  spacer: {
    height: CARD_START,
    backgroundColor: 'transparent',
  },
  content: {
    paddingBottom: 0,
  },
  contentCard: {
    backgroundColor: '#0B0D12',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 18,
    paddingBottom: 56,
    gap: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 24,
  },
  backdropWrap: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: BACKDROP_HEIGHT,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  playButtonWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
    paddingBottom: 80,
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
  ratingPillWrap: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    backgroundColor: GLASS_BG,
  },
  ratingStarText: {
    fontSize: 13,
    color: '#facc15',
    lineHeight: 16,
  },
  ratingNumText: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 16,
  },
  ratingCountText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  backdropContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
    padding: 16,
    paddingTop: 0,
    paddingBottom: 52,
  },
  poster: {
    width: 100,
    height: 152,
    borderRadius: 16,
    backgroundColor: '#1C2230',
    borderWidth: 2,
    borderColor: GLASS_BORDER,
    flexShrink: 0,
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
  metaStripWrap: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GLASS_BORDER,
  },
  metaStrip: {
    flexDirection: 'row',
    backgroundColor: GLASS_BG,
  },
  metaItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 4,
    gap: 3,
  },
  metaItemBorder: {
    borderRightWidth: 1,
    borderRightColor: GLASS_BORDER,
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    lineHeight: 12,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
  },
  genreChip: {
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: GLASS_BG,
  },
  genreText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  section: {
    gap: 8,
    paddingHorizontal: 16,
  },
  sectionLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  bodyCopy: {
    fontSize: 14,
    lineHeight: 22,
  },
  ctaWrap: {
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.30)',
  },
  ctaGradient: {
    borderRadius: 20,
  },
  ctaCard: {
    gap: 14,
    padding: 18,
    backgroundColor: GLASS_BG,
  },
  ctaTextBlock: {
    gap: 5,
  },
  ctaKicker: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
  ctaBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
  },
  sectionHeaderLeft: {
    flex: 1,
    minWidth: 0,
  },
  reviewMeta: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  sectionHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  inlineAction: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inlineActionText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
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
  missingScreen: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  missingCard: {
    gap: 16,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  missingCopy: {
    fontSize: 15,
    lineHeight: 22,
  },
});