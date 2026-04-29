import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
    .easing(Easing.out(Easing.quad));
}

export default function MovieDetailScreen() {
  const router = useRouter();

  const { id } = useLocalSearchParams();
  const movieId = Array.isArray(id) ? id[0] : id;

  const movie = movieId ? getMovieById(movieId) : null;

  const background = useThemeColor({}, 'background');
  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const textMuted = useThemeColor({}, 'textMuted');

  const accent = '#e8b84b';

  function handleBack() {
    router.back(); // 🔥 FIX lebih benar daripada push '/'
  }

  function handleWriteReview() {
    if (!movie) return;

    router.push({
      pathname: '/reviews/new',
      params: { movieId: movie.id },
    });
  }

  // 🔥 SAFE GUARD
  if (!movie) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText type="title">Movie not found</ThemedText>
        <PrimaryButton label="Go Back" onPress={handleBack} />
      </ThemedView>
    );
  }

  const reviews = getReviewsForMovie(movie.id) || [];

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView style={{ backgroundColor: background }}>
        
        {/* BACKDROP */}
        <Animated.View entering={getEnterAnimation(0)}>
          <Image
            source={{ uri: movie.backdropUrl || 'https://via.placeholder.com/500' }}
            style={styles.backdrop}
          />
        </Animated.View>

        {/* HEADER */}
        <Animated.View entering={getEnterAnimation(70)} style={styles.header}>
          <Image
            source={{ uri: movie.posterUrl || 'https://via.placeholder.com/300' }}
            style={styles.poster}
          />

          <View style={{ flex: 1 }}>
            <ThemedText style={{ color: accent }}>Movie Detail</ThemedText>

            <ThemedText type="title">{movie.title}</ThemedText>

            {movie.tagline && (
              <ThemedText style={{ color: textMuted }}>
                {movie.tagline}
              </ThemedText>
            )}

            <RatingStars rating={movie.averageRating || 0} />
          </View>
        </Animated.View>

        {/* META */}
        <View style={styles.metaRow}>
          <ThemedText>{movie.year}</ThemedText>
          <ThemedText>{movie.runtimeMinutes} min</ThemedText>
          <ThemedText>{movie.director}</ThemedText>
        </View>

        {/* SYNOPSIS */}
        <View style={styles.section}>
          <ThemedText type="subtitle">Synopsis</ThemedText>
          <ThemedText style={{ color: textMuted }}>
            {movie.synopsis}
          </ThemedText>
        </View>

        {/* GENRES */}
        <View style={styles.section}>
          <ThemedText type="subtitle">Genres</ThemedText>
          <View style={styles.genreRow}>
            {movie.genres?.map((g) => (
              <View key={g} style={styles.genreChip}>
                <ThemedText>{g}</ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* BUTTON */}
        <View style={styles.section}>
          <PrimaryButton label="Write Review" onPress={handleWriteReview} />
        </View>

        {/* REVIEWS */}
        <View style={styles.section}>
          <ThemedText type="subtitle">
            Reviews ({reviews.length})
          </ThemedText>

          {reviews.length > 0 ? (
            reviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))
          ) : (
            <ThemedText style={{ color: textMuted }}>
              No reviews yet
            </ThemedText>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    width: '100%',
    height: 250,
  },

  header: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    marginTop: -40,
  },

  poster: {
    width: 100,
    height: 150,
    borderRadius: 10,
  },

  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },

  section: {
    padding: 16,
  },

  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  genreChip: {
    backgroundColor: '#222',
    padding: 6,
    borderRadius: 10,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});