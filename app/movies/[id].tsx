import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { type ReactElement } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { ReviewCard } from '@/components/review-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getMovieById } from '@/data/movies';
import { getReviewsForMovie } from '@/data/reviews';
import { useThemeColor } from '@/hooks/use-theme-color';

const SECTION_ENTER_DURATION = 300;
const ITEM_STAGGER = 40;

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
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const movieId = Array.isArray(id) ? id[0] : id;
  const movie = movieId ? getMovieById(movieId) : undefined;
  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const textMuted = useThemeColor({}, 'textMuted');
  const accent = useThemeColor({}, 'accent');
  const insets = useSafeAreaInsets();
  const overlayTop = insets.top + 12;

  function handleBackToHome(): void {
    router.replace('/');
  }

  if (!movie) {
    return (
      <ThemedView style={styles.missingScreen}>
        <View style={[styles.missingCard, { backgroundColor: surface, borderColor: border }]}>
          <ThemedText type="title">Movie not found</ThemedText>
          <ThemedText style={[styles.missingCopy, { color: textMuted }]}>
            The selected movie doesn&apos;t exist in the local demo data yet.
          </ThemedText>
          <PrimaryButton label="Back to Home" onPress={handleBackToHome} />
        </View>
      </ThemedView>
    );
  }

  const selectedMovie = movie;
  const reviews = getReviewsForMovie(selectedMovie.id);
  const reviewCountLabel = `${selectedMovie.reviewCount} reviews`;
  const ratingLabel = selectedMovie.averageRating.toFixed(1);

  function handleWriteReview(): void {
    router.push({
      pathname: '/reviews/new',
      params: { movieId: selectedMovie.id },
    });
  }

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}>

        {/* ── 1. BACKDROP — cinematic, full-bleed ───────────────── */}
        <Animated.View entering={FadeIn.duration(450)} style={styles.backdropWrap}>
          <Image
            source={{ uri: selectedMovie.backdropUrl }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(11,13,18,0.7)', '#0B0D12']}
            locations={[0.35, 0.75, 1]}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Back button — overlaid top-left, safe-area aware */}
          <TouchableOpacity
            accessibilityLabel="Go back"
            accessibilityRole="button"
            onPress={() => router.back()}
            style={[styles.backBtn, { top: overlayTop }]}>
            <BlurView intensity={30} tint="dark" style={styles.backBtnInner}>
              <ThemedText style={styles.backBtnText}>← Back</ThemedText>
            </BlurView>
          </TouchableOpacity>

          {/* Rating pill — overlaid top-right, safe-area aware */}
          <Animated.View entering={getEnterAnimation(80)} style={[styles.ratingPillWrap, { top: overlayTop }]}>
            <BlurView intensity={30} tint="dark" style={styles.ratingPill}>
              <ThemedText style={styles.ratingStarText}>★</ThemedText>
              <ThemedText style={styles.ratingNumText}>{ratingLabel}</ThemedText>
              <ThemedText style={[styles.ratingCountText, { color: textMuted }]}>
                · {reviewCountLabel}
              </ThemedText>
            </BlurView>
          </Animated.View>

          {/* Poster + title overlaid at bottom of backdrop */}
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

        {/* ── 2. META STRIP — horizontal, scannable ─────────────── */}
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
                <ThemedText style={[styles.metaLabel, { color: textMuted }]}>{item.label}</ThemedText>
                <ThemedText style={styles.metaValue} numberOfLines={1}>{item.value}</ThemedText>
              </View>
            ))}
          </BlurView>
        </Animated.View>

        {/* ── 3. GENRE CHIPS — above synopsis ───────────────────── */}
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

        {/* ── 4. SYNOPSIS ───────────────────────────────────────── */}
        <Animated.View entering={getEnterAnimation(180)} style={styles.section}>
          <ThemedText style={[styles.sectionLabel, { color: accent }]}>Synopsis</ThemedText>
          <ThemedText style={[styles.bodyCopy, { color: textMuted }]}>
            {selectedMovie.synopsis}
          </ThemedText>
        </Animated.View>

        {/* ── 5. CONTEXTUAL CTA — "Seen this film?" ─────────────── */}
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

        {/* ── 6. REVIEWS SECTION ────────────────────────────────── */}
        <Animated.View entering={getEnterAnimation(260)} style={styles.sectionHeader}>
          <View>
            <ThemedText style={styles.sectionLabel}>Community</ThemedText>
            <ThemedText type="subtitle">Recent reviews preview</ThemedText>
          </View>
          <ThemedText style={[styles.reviewMeta, { color: textMuted }]}>{reviewCountLabel}</ThemedText>
        </Animated.View>

        <View style={styles.reviewList}>
          {reviews.map((review, index) => (
            <Animated.View
              key={review.id}
              entering={getEnterAnimation(310 + index * ITEM_STAGGER)}>
              <ReviewCard review={review} />
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
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
  content: {
    paddingBottom: 48,
    gap: 18,
  },

  // Backdrop
  backdropWrap: {
    width: '100%',
    height: 300,
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
    gap: 3,
  },
  metaItemBorder: {
    borderRightWidth: 1,
    borderRightColor: GLASS_BORDER,
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.7,
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
  reviewMeta: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  reviewList: {
    gap: 12,
    paddingHorizontal: 16,
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