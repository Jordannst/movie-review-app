import { Image } from 'expo-image';
import { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

// Decorative-only poster URLs sourced from TMDB public CDN. Mirrors the
// seeded films in `supabase/seed.sql` so the auth screen visual matches
// what the user will see once signed in. Stored as plain strings (no
// metadata) because this background grid is purely visual.
const POSTER_URLS: readonly string[] = [
  'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg', // Inception
  'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg', // The Dark Knight
  'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', // Interstellar
  'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', // Parasite
  'https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg', // Top Gun: Maverick
  'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', // Oppenheimer
  'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg', // Dune: Part Two
  'https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg', // Blade Runner 2049
];

const { width: SCREEN_W } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const GAP = 6;
const POSTER_W = (SCREEN_W - GAP * (COLUMN_COUNT + 1)) / COLUMN_COUNT;
const POSTER_H = POSTER_W * 1.5;
const ROW_H = POSTER_H + GAP;

const ALL_URLS = POSTER_URLS;
// Pad to a multiple of COLUMN_COUNT so every row is full
const PADDED_COUNT = Math.ceil(ALL_URLS.length / COLUMN_COUNT) * COLUMN_COUNT;
const ONE_SET: string[] = [];
for (let i = 0; i < PADDED_COUNT; i++) ONE_SET.push(ALL_URLS[i % ALL_URLS.length]);

const ROWS_PER_SET = ONE_SET.length / COLUMN_COUNT;
const SET_HEIGHT = ROWS_PER_SET * ROW_H;

// Triple the set so there's always a full screen of content visible
const POSTERS = [...ONE_SET, ...ONE_SET, ...ONE_SET];
const SCROLL_DURATION = SET_HEIGHT * 30; // ~33px/sec

export function PosterWall() {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(-SET_HEIGHT, {
        duration: SCROLL_DURATION,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { rotateX: '5deg' },
      { translateY: translateY.value },
    ],
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={[styles.grid, animatedStyle]}>
        {POSTERS.map((url, i) => (
          <View key={i} style={styles.posterWrap}>
            <Image
              source={{ uri: url }}
              style={styles.poster}
              contentFit="cover"
              recyclingKey={`poster-${i}`}
            />
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    opacity: 0.15,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
    padding: GAP,
  },
  posterWrap: {
    width: POSTER_W,
    height: POSTER_H,
    borderRadius: 6,
    overflow: 'hidden',
  },
  poster: {
    width: '100%',
    height: '100%',
  },
});
