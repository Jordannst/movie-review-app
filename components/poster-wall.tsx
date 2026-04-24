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

import { movies } from '@/data/movies';

const { width: SCREEN_W } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const GAP = 6;
const POSTER_W = (SCREEN_W - GAP * (COLUMN_COUNT + 1)) / COLUMN_COUNT;
const POSTER_H = POSTER_W * 1.5;
const ROW_H = POSTER_H + GAP;

const ALL_URLS = movies.map((m) => m.posterUrl);
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
