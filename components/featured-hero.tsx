import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { type ReactElement } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { RatingStars } from '@/components/rating-stars';
import { ThemedText } from '@/components/themed-text';
import { Movie } from '@/data/types';
import { useThemeColor } from '@/hooks/use-theme-color';
import { PlayButton } from '@/components/ui/play-button';
// Import data lokal
import { movies as localMovies } from '@/data/movies';

type FeaturedHeroProps = {
  movie: Movie;
  eyebrow?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  style?: StyleProp<ViewStyle>;
  topInset?: number;
};

export function FeaturedHero({
  movie,
  eyebrow = 'Featured Tonight',
  actionLabel,
  onActionPress,
  style,
  topInset = 0,
}: FeaturedHeroProps): ReactElement {
  const border = useThemeColor({}, 'border');
  const accent = useThemeColor({}, 'accent');
  const shouldShowAction = Boolean(actionLabel && onActionPress);

  return (
    <View style={[styles.container, { borderColor: border }, style]}>
      <Image source={{ uri: movie.backdropUrl }} style={styles.backdrop} contentFit="cover" />
      
      <LinearGradient
        colors={['rgba(11,13,18,0.20)', 'rgba(11,13,18,0.55)', '#0B0D12']}
        locations={[0, 0.55, 1]}
        style={styles.overlay}
      />

      <View style={styles.playButtonContainer} pointerEvents="box-none">
        <PlayButton 
          trailerUrl={
            movie.trailerUrl || 
            localMovies.find(m => m.id === movie.id)?.trailerUrl
          } 
          size={64} 
        />
      </View>

      <View style={[styles.content, topInset > 0 && { paddingTop: topInset + 12 }]} pointerEvents="box-none">
        <View style={styles.textBlock}>
          <ThemedText style={[styles.eyebrow, { color: accent }]}>{eyebrow}</ThemedText>
          <ThemedText type="title" numberOfLines={2} style={styles.title} lightColor="#F5F7FA" darkColor="#F5F7FA">
            {movie.title}
          </ThemedText>
          <ThemedText
            style={styles.tagline}
            lightColor="#D7DCE4"
            darkColor="#D7DCE4"
            numberOfLines={2}>
            {movie.tagline}
          </ThemedText>
        </View>

        <View style={styles.metaRow}>
          <View style={[styles.metaBadge, { borderColor: border }]}>
            <ThemedText style={styles.metaText} lightColor="#F5F7FA" darkColor="#F5F7FA">
              {movie.year}
            </ThemedText>
          </View>
          <View style={[styles.metaBadge, { borderColor: border }]}>
            <ThemedText style={styles.metaText} lightColor="#F5F7FA" darkColor="#F5F7FA">
              {movie.genres.join(' / ')}
            </ThemedText>
          </View>
        </View>

        <RatingStars rating={movie.averageRating} textColor="#F5F7FA" />

        <ThemedText style={styles.synopsis} lightColor="#F5F7FA" darkColor="#F5F7FA" numberOfLines={3}>
          {movie.synopsis}
        </ThemedText>

        {shouldShowAction && actionLabel && onActionPress ? (
          <PrimaryButton label={actionLabel} onPress={onActionPress} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 560,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  playButtonContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    paddingBottom: 100,
  },
  content: {
    gap: 14,
    padding: 22,
    zIndex: 20,
  },
  textBlock: {
    gap: 8,
  },
  eyebrow: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    lineHeight: 38,
  },
  tagline: {
    fontSize: 15,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaBadge: {
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'rgba(11, 13, 18, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  metaText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  synopsis: {
    fontSize: 14,
    lineHeight: 21,
  },
});