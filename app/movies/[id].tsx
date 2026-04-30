import { useFocusEffect } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { startTransition, useCallback, useState, type ReactElement } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AwardsList } from '@/components/awards-list';
import { MotionPressable } from '@/components/motion-pressable';
import { PrimaryButton } from '@/components/primary-button';
import { ReviewCard } from '@/components/review-card';
import { ShimmerView } from '@/components/shimmer-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import { Movie, Review } from '@/data/types';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getMovieById } from '@/services/movies';
import { getReviewsForMovie, getUserReviewForMovie } from '@/services/reviews';

const SECTION_ENTER_DURATION = 300;
const ITEM_STAGGER = 40;
const BACKDROP_HEIGHT = 460;  // taller backdrop for full immersion
const CARD_START = 440;        // card starts clearly below poster+title zone
const DETAIL_SHIMMER = '#1A1C24';

function MovieDetailLoadingSkeleton({ overlayTop }: { overlayTop: number }) {
  return (
    <View style={styles.screen}>
      <View style={styles.backdropWrap}>
        <ShimmerView color={DETAIL_SHIMMER} style={StyleSheet.absoluteFillObject} duration={1100} />
        <LinearGradient
          colors={['rgba(11,13,18,0.10)', 'rgba(11,13,18,0.55)', '#0B0D12']}
          locations={[0.2, 0.7, 1]}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={styles.backdropContent}>
          <ShimmerView color={DETAIL_SHIMMER} style={styles.poster} duration={950} />
          <View style={styles.titleBlock}>
            <ShimmerView color={DETAIL_SHIMMER} style={{ height: 28, width: '82%', borderRadius: 8 }} duration={900} />
            <ShimmerView color={DETAIL_SHIMMER} style={{ height: 14, width: '68%', borderRadius: 6 }} duration={980} />
            <ShimmerView color={DETAIL_SHIMMER} style={{ height: 14, width: '52%', borderRadius: 6 }} duration={1040} />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} style={styles.scroll}>
        <View style={styles.spacer} />

        <View style={styles.contentCard}>
          <Animated.View entering={FadeInDown.duration(220).delay(90).easing(Easing.out(Easing.cubic))} style={styles.metaStripWrap}>
            <BlurView intensity={20} tint="dark" style={styles.metaStrip}>
              {Array.from({ length: 3 }).map((_, index, arr) => (
                <View key={index} style={[styles.metaItem, index < arr.length - 1 && styles.metaItemBorder]}>
                  <ShimmerView color={DETAIL_SHIMMER} style={{ height: 9, width: 34, borderRadius: 4 }} duration={900 + index * 70} />
                  <ShimmerView color={DETAIL_SHIMMER} style={{ height: 13, width: 58, borderRadius: 5 }} duration={960 + index * 70} />
                </View>
              ))}
            </BlurView>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(220).delay(130).easing(Easing.out(Easing.cubic))} style={styles.genreRow}>
            {Array.from({ length: 4 }).map((_, index) => (
              <BlurView key={index} intensity={18} tint="light" style={styles.genreChip}>
                <ShimmerView color={DETAIL_SHIMMER} style={{ height: 12, width: 52 + index * 8, borderRadius: 999 }} duration={920 + index * 60} />
              </BlurView>
            ))}
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(220).delay(170).easing(Easing.out(Easing.cubic))} style={styles.section}>
            <ShimmerView color={DETAIL_SHIMMER} style={{ height: 10, width: 70, borderRadius: 5 }} duration={920} />
            <ShimmerView color={DETAIL_SHIMMER} style={{ height: 14, width: '100%', borderRadius: 6 }} duration={980} />
            <ShimmerView color={DETAIL_SHIMMER} style={{ height: 14, width: '96%', borderRadius: 6 }} duration={1040} />
            <ShimmerView color={DETAIL_SHIMMER} style={{ height: 14, width: '88%', borderRadius: 6 }} duration={1100} />
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(220).delay(210).easing(Easing.out(Easing.cubic))} style={styles.ctaWrap}>
            <LinearGradient
              colors={['rgba(124,58,237,0.18)', 'rgba(59,130,246,0.10)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaGradient}>
              <BlurView intensity={22} tint="dark" style={styles.ctaCard}>
                <View style={styles.ctaTextBlock}>
                  <ShimmerView color={DETAIL_SHIMMER} style={{ height: 12, width: 96, borderRadius: 6 }} duration={900} />
                  <ShimmerView color={DETAIL_SHIMMER} style={{ height: 13, width: '92%', borderRadius: 6 }} duration={980} />
                  <ShimmerView color={DETAIL_SHIMMER} style={{ height: 13, width: '72%', borderRadius: 6 }} duration={1060} />
                </View>
                <ShimmerView color={DETAIL_SHIMMER} style={{ height: 46, width: '100%', borderRadius: 999 }} duration={960} />
              </BlurView>
            </LinearGradient>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(220).delay(250).easing(Easing.out(Easing.cubic))} style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <ShimmerView color={DETAIL_SHIMMER} style={{ height: 10, width: 78, borderRadius: 5 }} duration={920} />
              <ShimmerView color={DETAIL_SHIMMER} style={{ height: 18, width: 154, borderRadius: 7, marginTop: 8 }} duration={1000} />
            </View>
            <ShimmerView color={DETAIL_SHIMMER} style={{ height: 34, width: 86, borderRadius: 999 }} duration={980} />
          </Animated.View>

          <View style={styles.reviewList}>
            {Array.from({ length: 2 }).map((_, index) => (
              <Animated.View
                key={index}
                entering={FadeInDown.duration(220).delay(300 + index * ITEM_STAGGER).easing(Easing.out(Easing.cubic))}
                style={styles.reviewSkeletonCard}>
                <View style={styles.reviewSkeletonHeader}>
                  <ShimmerView color={DETAIL_SHIMMER} style={{ width: 36, height: 36, borderRadius: 18 }} duration={900 + index * 70} />
                  <View style={{ flex: 1, gap: 7 }}>
                    <ShimmerView color={DETAIL_SHIMMER} style={{ height: 12, width: '36%', borderRadius: 5 }} duration={960 + index * 70} />
                    <ShimmerView color={DETAIL_SHIMMER} style={{ height: 10, width: '24%', borderRadius: 5 }} duration={1020 + index * 70} />
                  </View>
                </View>
                <View style={{ gap: 8 }}>
                  <ShimmerView color={DETAIL_SHIMMER} style={{ height: 12, width: '100%', borderRadius: 6 }} duration={980 + index * 70} />
                  <ShimmerView color={DETAIL_SHIMMER} style={{ height: 12, width: '94%', borderRadius: 6 }} duration={1040 + index * 70} />
                  <ShimmerView color={DETAIL_SHIMMER} style={{ height: 12, width: '76%', borderRadius: 6 }} duration={1100 + index * 70} />
                </View>
              </Animated.View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.backBtn, { top: overlayTop }]}>
        <BlurView intensity={30} tint="dark" style={styles.backBtnInner}>
          <ShimmerView color={DETAIL_SHIMMER} style={{ height: 12, width: 68, borderRadius: 6 }} duration={900} />
        </BlurView>
      </View>

      <View style={[styles.ratingPillWrap, { top: overlayTop }]}>
        <BlurView intensity={30} tint="dark" style={styles.ratingPill}>
          <ShimmerView color={DETAIL_SHIMMER} style={{ width: 54, height: 12, borderRadius: 6 }} duration={960} />
        </BlurView>
      </View>
    </View>
  );
}

function getEnterAnimation(delay = 0) {
  return FadeInDown.duration(SECTION_ENTER_DURATION)
    .delay(delay)
    .easing(Easing.out(Easing.cubic))
    .withInitialValues({ opacity: 0, transform: [{ translateY: 12 }] });
}

/** Format runtime as "Xh Ym" */
function formatRuntime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function MovieDetailScreen(): ReactElement {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const movieId = Array.isArray(id) ? id[0] : id;
  const [movie, setMovie] = useState<Movie | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
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

  // Pakai useFocusEffect supaya state (termasuk userReview) ter-refresh
  // setiap kali user kembali dari layar reviews/new.
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadMovieDetail() {
        if (!movieId) {
          setMovie(null);
          setReviews([]);
          setUserReview(null);
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
            setUserReview(null);
            return;
          }

          // Ambil reviews list + review milik user secara paralel
          const userReviewPromise = user
            ? getUserReviewForMovie(user.id, movieId).catch(() => null)
            : Promise.resolve(null);

          try {
            const [reviewResults, existingUserReview] = await Promise.all([
              getReviewsForMovie(movieId, {
                page: 1,
                pageSize: 2,
                sortBy: 'newest',
              }),
              userReviewPromise,
            ]);

            if (!isActive) return;

            startTransition(() => {
              setReviews(reviewResults.reviews);
              setUserReview(existingUserReview);
            });
          } catch (error) {
            if (!isActive) return;
            setReviews([]);
            setUserReview(null);
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
    }, [movieId, reloadVersion, user])
  );

  function handleBackToHome(): void {
    router.replace('/');
  }

  function handleRetry(): void {
    setReloadVersion((current) => current + 1);
  }

  if (isMovieLoading) {
    return <MovieDetailLoadingSkeleton overlayTop={overlayTop} />;
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
  const hasUserReview = Boolean(userReview);

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

      {/* ── BACKDROP — absolute, always visible behind scroll ───── */}
      <Animated.View entering={FadeIn.duration(500)} style={styles.backdropWrap}>
        <Image
          source={{ uri: selectedMovie.backdropUrl }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
        />
        {/* Dark vignette — heavier at bottom so card edge blends */}
        <LinearGradient
          colors={['rgba(11,13,18,0.10)', 'rgba(11,13,18,0.55)', '#0B0D12']}
          locations={[0.2, 0.70, 1]}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Poster + title anchored at bottom of backdrop */}
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

      {/* ── SCROLL — overlays backdrop; content card rises over it ─ */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}>

        {/* Transparent spacer — lets backdrop show through */}
        <View style={styles.spacer} />

        {/* Content card — rounded top, dark bg, rises over backdrop */}
        <View style={styles.contentCard}>

          {/* ── META STRIP ───────────────────────────────────────── */}
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

          {/* ── GENRE CHIPS ──────────────────────────────────────── */}
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

          {/* ── SYNOPSIS ─────────────────────────────────────────── */}
          <Animated.View entering={getEnterAnimation(180)} style={styles.section}>
            <ThemedText style={[styles.sectionLabel, { color: accent }]}>Synopsis</ThemedText>
            <ThemedText style={[styles.bodyCopy, { color: textMuted }]}>
              {selectedMovie.synopsis}
            </ThemedText>
          </Animated.View>

          {/* ── AWARDS ───────────────────────────────────── */}
          {selectedMovie.awards && selectedMovie.awards.length > 0 ? (
            <Animated.View entering={getEnterAnimation(200)}>
              <AwardsList awards={selectedMovie.awards} />
            </Animated.View>
          ) : null}

          {/* ── CONTEXTUAL CTA ───────────────────────────── */}
          <Animated.View entering={getEnterAnimation(220)} style={styles.ctaWrap}>
            <LinearGradient
              colors={['rgba(124,58,237,0.18)', 'rgba(59,130,246,0.10)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaGradient}>
              <BlurView intensity={22} tint="dark" style={styles.ctaCard}>
                <View style={styles.ctaTextBlock}>
                  <ThemedText style={[styles.ctaKicker, { color: accent }]}>
                    {hasUserReview ? 'Your review is live' : 'Seen this film?'}
                  </ThemedText>
                  <ThemedText style={[styles.ctaBody, { color: textMuted }]}>
                    {hasUserReview
                      ? 'Want to revise? Update your rating or writing anytime.'
                      : 'Share your take with the community — your review helps others decide.'}
                  </ThemedText>
                </View>
                <PrimaryButton
                  label={hasUserReview ? 'Edit your review' : 'Write Review'}
                  onPress={handleWriteReview}
                />
              </BlurView>
            </LinearGradient>
          </Animated.View>

          {/* ── REVIEWS ──────────────────────────────────────────── */}
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

        </View>{/* end contentCard */}
      </ScrollView>

      {/* ── OVERLAYS — rendered AFTER ScrollView so they are always on top ─ */}
      {/* Back button */}
      <TouchableOpacity
        accessibilityLabel="Go back"
        accessibilityRole="button"
        onPress={() => router.back()}
        style={[styles.backBtn, { top: overlayTop }]}>
        <BlurView intensity={30} tint="dark" style={styles.backBtnInner}>
          <ThemedText style={styles.backBtnText}>← Back</ThemedText>
        </BlurView>
      </TouchableOpacity>

      {/* Rating pill */}
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
  // Transparent — spacer lets backdrop show through initially
  spacer: {
    height: CARD_START,
    backgroundColor: 'transparent',
  },
  content: {
    paddingBottom: 0,   // contentCard handles bottom padding
  },
  // Content card rises over backdrop while scrolling
  contentCard: {
    backgroundColor: '#0B0D12',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 18,
    paddingBottom: 56,
    gap: 18,
    // Extend shadow up into backdrop for a smooth blend
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 24,
  },
  // Backdrop — absolute, full-bleed, behind scroll
  backdropWrap: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: BACKDROP_HEIGHT,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  backBtn: {
    position: 'absolute',
    // top is injected dynamically via insets
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
    // top is injected dynamically via insets
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
    paddingBottom: 52, // lift poster above the card-overlap/gradient zone
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

  // Meta strip
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

  // Genre chips
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

  // Sections
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

  // CTA card
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

  // Reviews
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
  reviewSkeletonCard: {
    gap: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    backgroundColor: GLASS_BG,
    padding: 16,
  },
  reviewSkeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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

  // Missing screen
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
