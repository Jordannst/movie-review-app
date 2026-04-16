import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { type ReactElement } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';

import { PrimaryButton } from '@/components/primary-button';
import { RatingStars } from '@/components/rating-stars';
import { ReviewCard } from '@/components/review-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getMovieById } from '@/data/movies';
import { getReviewsForMovie } from '@/data/reviews';
import { useThemeColor } from '@/hooks/use-theme-color';

const SECTION_ENTER_DURATION = 280;
const ITEM_STAGGER = 45;

function getEnterAnimation(delay = 0) {
  return FadeInDown.duration(SECTION_ENTER_DURATION)
    .delay(delay)
    .easing(Easing.out(Easing.quad))
    .withInitialValues({
      opacity: 0,
      transform: [{ translateY: 10 }],
    });
}

export default function MovieDetailScreen(): ReactElement {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const movieId = Array.isArray(id) ? id[0] : id;
  const movie = movieId ? getMovieById(movieId) : undefined;
  const background = useThemeColor({}, 'background');
  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const textMuted = useThemeColor({}, 'textMuted');
  const accent = useThemeColor({}, 'accent');

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
        style={{ backgroundColor: background }}>
        <Animated.View entering={getEnterAnimation(0)} style={{ width: '100%', height: 260 }}>
          <Image source={{ uri: selectedMovie.backdropUrl }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
          <LinearGradient
            colors={['transparent', 'rgba(11, 13, 18, 0.8)', '#0B0D12']}
            locations={[0.4, 0.8, 1]}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>

        <Animated.View entering={getEnterAnimation(70)} style={styles.posterRow}>
          <Image source={{ uri: selectedMovie.posterUrl }} style={styles.poster} contentFit="cover" />

          <View style={styles.headerContent}>
            <ThemedText style={[styles.eyebrow, { color: accent }]}>Movie Detail</ThemedText>
            <ThemedText type="title" style={styles.title}>
              {selectedMovie.title}
            </ThemedText>
            <ThemedText style={[styles.tagline, { color: textMuted }]}>{selectedMovie.tagline}</ThemedText>
            <RatingStars rating={selectedMovie.averageRating} />
          </View>
        </Animated.View>

        <Animated.View entering={getEnterAnimation(110)} style={styles.metaRow}>
          <BlurView intensity={20} tint="light" style={[styles.metaChip, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }]}>
            <ThemedText style={styles.metaText}>{selectedMovie.year}</ThemedText>
          </BlurView>
          <BlurView intensity={20} tint="light" style={[styles.metaChip, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }]}>
            <ThemedText style={styles.metaText}>{selectedMovie.runtimeMinutes} min</ThemedText>
          </BlurView>
          <BlurView intensity={20} tint="light" style={[styles.metaChip, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }]}>
            <ThemedText style={styles.metaText}>{selectedMovie.director}</ThemedText>
          </BlurView>
        </Animated.View>

        <Animated.View entering={getEnterAnimation(150)} style={styles.section}>
          <ThemedText type="subtitle">Synopsis</ThemedText>
          <ThemedText style={[styles.bodyCopy, { color: textMuted }]}>{selectedMovie.synopsis}</ThemedText>
        </Animated.View>

        <Animated.View entering={getEnterAnimation(190)} style={styles.section}>
          <ThemedText type="subtitle">Genres</ThemedText>
          <View style={styles.genreRow}>
            {selectedMovie.genres.map((genre) => (
              <BlurView intensity={20} tint="light" key={genre} style={[styles.genreChip, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }]}>
                <ThemedText style={styles.genreText}>{genre}</ThemedText>
              </BlurView>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={getEnterAnimation(230)} style={styles.sectionAction}>
          <PrimaryButton label="Write Review" onPress={handleWriteReview} />
        </Animated.View>

        <Animated.View entering={getEnterAnimation(270)} style={styles.sectionHeader}>
          <View>
            <ThemedText style={styles.sectionLabel}>Community</ThemedText>
            <ThemedText type="subtitle">Recent reviews preview</ThemedText>
          </View>
          <ThemedText style={[styles.reviewMeta, { color: textMuted }]}>{reviewCountLabel}</ThemedText>
        </Animated.View>

        <View style={styles.reviewList}>
          {reviews.map((review, index) => (
            <Animated.View key={review.id} entering={getEnterAnimation(320 + index * ITEM_STAGGER)}>
              <ReviewCard review={review} />
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    gap: 20,
    paddingBottom: 32,
  },
  backdrop: {
    width: '100%',
    height: 260,
  },
  posterRow: {
    flexDirection: 'row',
    gap: 18,
    marginTop: -58,
    paddingHorizontal: 20,
  },
  poster: {
    width: 124,
    height: 184,
    borderRadius: 20,
    backgroundColor: '#1C2230',
  },
  headerContent: {
    flex: 1,
    justifyContent: 'flex-end',
    gap: 8,
    paddingTop: 60,
  },
  eyebrow: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    lineHeight: 36,
  },
  tagline: {
    fontSize: 14,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 20,
  },
  metaChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  metaText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  section: {
    gap: 10,
    paddingHorizontal: 20,
  },
  sectionAction: {
    paddingHorizontal: 20,
  },
  bodyCopy: {
    fontSize: 14,
    lineHeight: 22,
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  genreChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  genreText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  reviewMeta: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  reviewList: {
    gap: 14,
    paddingHorizontal: 20,
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