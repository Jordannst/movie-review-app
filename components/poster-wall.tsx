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
const POSTER_URLS = movies.map((m) => m.posterUrl);
const DOUBLE_POSTERS = [...POSTER_URLS, ...POSTER_URLS];
const ROW_COUNT = Math.ceil(DOUBLE_POSTERS.length / COLUMN_COUNT);
const GRID_H = ROW_COUNT * (POSTER_H + GAP) + GAP;
const SCROLL_DISTANCE = GRID_H / 2;
const SCROLL_DURATION = SCROLL_DISTANCE * 50;

export function PosterWall() {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(-SCROLL_DISTANCE, {
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
        {DOUBLE_POSTERS.map((url, i) => (
          <View key={`${url}-${i}`} style={styles.posterWrap}>
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
