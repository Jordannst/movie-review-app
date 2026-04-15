import { Image } from 'expo-image';
import { type ReactElement } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { MotionPressable } from '@/components/motion-pressable';
import { RatingStars } from '@/components/rating-stars';
import { ThemedText } from '@/components/themed-text';
import { Movie } from '@/data/types';
import { useThemeColor } from '@/hooks/use-theme-color';

type MovieCardProps = {
  movie: Movie;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

function formatRuntime(runtimeMinutes: number): string {
  const hours = Math.floor(runtimeMinutes / 60);
  const minutes = runtimeMinutes % 60;

  return `${hours}h ${minutes}m`;
}

export function MovieCard({ movie, onPress, style }: MovieCardProps): ReactElement {
  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const textMuted = useThemeColor({}, 'textMuted');
  const genresLabel = movie.genres.join(' / ');

  return (
    <MotionPressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      haptic={Boolean(onPress)}
      onPress={onPress}
      pressScale={0.99}
      pressedOpacity={0.96}
      style={[
        styles.card,
        {
          backgroundColor: surface,
          borderColor: border,
        },
        style,
      ]}>
      <Image source={{ uri: movie.posterUrl }} style={styles.poster} contentFit="cover" />

      <View style={styles.content}>
        <View style={styles.topSection}>
          <ThemedText type="defaultSemiBold" numberOfLines={2}>
            {movie.title}
          </ThemedText>
          <ThemedText style={[styles.tagline, { color: textMuted }]} numberOfLines={2}>
            {movie.tagline}
          </ThemedText>
        </View>

        <View style={styles.metaRow}>
          <ThemedText style={[styles.metaText, { color: textMuted }]}>{movie.year}</ThemedText>
          <ThemedText style={[styles.metaDot, { color: textMuted }]}>•</ThemedText>
          <ThemedText style={[styles.metaText, { color: textMuted }]}>
            {formatRuntime(movie.runtimeMinutes)}
          </ThemedText>
          <ThemedText style={[styles.metaDot, { color: textMuted }]}>•</ThemedText>
          <ThemedText style={[styles.metaText, { color: textMuted }]} numberOfLines={1}>
            {genresLabel}
          </ThemedText>
        </View>

        <RatingStars rating={movie.averageRating} />

        <ThemedText style={[styles.reviewCount, { color: textMuted }]}>{movie.reviewCount} reviews</ThemedText>
      </View>
    </MotionPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 14,
    borderRadius: 22,
    borderWidth: 1,
    padding: 12,
  },
  poster: {
    width: 96,
    height: 140,
    borderRadius: 16,
    backgroundColor: '#1C2230',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 4,
  },
  topSection: {
    gap: 6,
  },
  tagline: {
    fontSize: 14,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  metaDot: {
    marginHorizontal: 6,
    fontSize: 12,
    lineHeight: 18,
  },
  reviewCount: {
    fontSize: 12,
    lineHeight: 18,
  },
});