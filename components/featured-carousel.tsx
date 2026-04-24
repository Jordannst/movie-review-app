import { type ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import {
    Dimensions,
    FlatList,
    type StyleProp,
    StyleSheet,
    View,
    type ViewStyle,
} from 'react-native';
import Animated, {
    Extrapolation,
    interpolate,
    runOnJS,
    type SharedValue,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
} from 'react-native-reanimated';

import { FeaturedHero } from '@/components/featured-hero';
import { Movie } from '@/data/types';
import { useThemeColor } from '@/hooks/use-theme-color';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

type FeaturedCarouselProps = {
  movies: Movie[];
  topInset?: number;
  onActionPress?: (movie: Movie) => void;
  actionLabel?: string;
  eyebrow?: string;
  style?: StyleProp<ViewStyle>;
};

const AUTO_ADVANCE_INTERVAL_MS = 5000;
const RESUME_AFTER_IDLE_MS = 3000;
const SCREEN_WIDTH = Dimensions.get('window').width;

// Visual tuning for inactive slides
const INACTIVE_SCALE = 0.94;
const INACTIVE_OPACITY = 0.65;

// Dot indicator size
const DOT_INACTIVE_WIDTH = 6;
const DOT_ACTIVE_WIDTH = 20;

export function FeaturedCarousel({
  movies,
  topInset,
  onActionPress,
  actionLabel,
  eyebrow = 'Featured Tonight',
  style,
}: FeaturedCarouselProps): ReactElement | null {
  const accent = useThemeColor({}, 'accent');
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const flatListRef = useRef<FlatList<Movie>>(null);
  const activeIndexRef = useRef(0);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Shared value tracks live scroll x — drives slide & dot animations natively (60fps)
  const scrollX = useSharedValue(0);

  // Keep the ref in sync with state so auto-advance reads the latest index
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  // Auto-advance effect — skip when only 1 movie or when paused
  useEffect(() => {
    if (isPaused || movies.length <= 1) return;

    autoAdvanceTimerRef.current = setInterval(() => {
      const next = (activeIndexRef.current + 1) % movies.length;
      activeIndexRef.current = next;
      setActiveIndex(next);
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
    }, AUTO_ADVANCE_INTERVAL_MS);

    return () => {
      if (autoAdvanceTimerRef.current) {
        clearInterval(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }
    };
  }, [isPaused, movies.length]);

  // Cleanup any lingering resume timer on unmount
  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  const pauseAutoAdvance = useCallback(() => {
    setIsPaused(true);
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, []);

  const settleOnIndex = useCallback(
    (rawIndex: number) => {
      const clamped = Math.max(0, Math.min(movies.length - 1, rawIndex));
      activeIndexRef.current = clamped;
      setActiveIndex(clamped);

      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = setTimeout(() => {
        setIsPaused(false);
      }, RESUME_AFTER_IDLE_MS);
    },
    [movies.length]
  );

  // Native scroll handler — drives scrollX shared value on UI thread
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
    onBeginDrag: () => {
      runOnJS(pauseAutoAdvance)();
    },
    onMomentumEnd: (event) => {
      const newIndex = Math.round(event.contentOffset.x / SCREEN_WIDTH);
      runOnJS(settleOnIndex)(newIndex);
    },
  });

  const getItemLayout = useCallback(
    (_: ArrayLike<Movie> | null | undefined, index: number) => ({
      length: SCREEN_WIDTH,
      offset: SCREEN_WIDTH * index,
      index,
    }),
    []
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Movie; index: number }) => (
      <CarouselSlide
        movie={item}
        index={index}
        scrollX={scrollX}
        eyebrow={eyebrow}
        topInset={topInset}
        actionLabel={actionLabel}
        onActionPress={onActionPress}
      />
    ),
    [actionLabel, eyebrow, onActionPress, scrollX, topInset]
  );

  if (movies.length === 0) return null;

  // Single-movie fallback: render FeaturedHero directly (no carousel overhead)
  if (movies.length === 1) {
    const [only] = movies;
    return (
      <View style={style}>
        <FeaturedHero
          movie={only}
          eyebrow={eyebrow}
          topInset={topInset}
          actionLabel={actionLabel}
          onActionPress={onActionPress ? () => onActionPress(only) : undefined}
        />
      </View>
    );
  }

  return (
    <View style={style}>
      <AnimatedFlatList
        ref={flatListRef as never}
        data={movies as never}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => (item as Movie).id}
        renderItem={renderItem as never}
        getItemLayout={getItemLayout as never}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={SCREEN_WIDTH}
        snapToAlignment="start"
        disableIntervalMomentum
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        windowSize={3}
        removeClippedSubviews
      />

      {/* Page indicator — each dot animates width + opacity based on scrollX */}
      <View style={styles.dotsRow} pointerEvents="none">
        {movies.map((movie, index) => (
          <CarouselDot
            key={movie.id}
            index={index}
            scrollX={scrollX}
            accent={accent}
          />
        ))}
      </View>
    </View>
  );
}

// ───────────────────────── Slide ─────────────────────────
type CarouselSlideProps = {
  movie: Movie;
  index: number;
  scrollX: SharedValue<number>;
  eyebrow?: string;
  topInset?: number;
  actionLabel?: string;
  onActionPress?: (movie: Movie) => void;
};

function CarouselSlide({
  movie,
  index,
  scrollX,
  eyebrow,
  topInset,
  actionLabel,
  onActionPress,
}: CarouselSlideProps): ReactElement {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];

    const scale = interpolate(
      scrollX.value,
      inputRange,
      [INACTIVE_SCALE, 1, INACTIVE_SCALE],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [INACTIVE_OPACITY, 1, INACTIVE_OPACITY],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ scale }],
    };
  });

  return (
    <Animated.View style={[{ width: SCREEN_WIDTH }, animatedStyle]}>
      <FeaturedHero
        movie={movie}
        eyebrow={eyebrow}
        topInset={topInset}
        actionLabel={actionLabel}
        onActionPress={onActionPress ? () => onActionPress(movie) : undefined}
      />
    </Animated.View>
  );
}

// ───────────────────────── Dot ─────────────────────────
type CarouselDotProps = {
  index: number;
  scrollX: SharedValue<number>;
  accent: string;
};

function CarouselDot({ index, scrollX, accent }: CarouselDotProps): ReactElement {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];

    const width = interpolate(
      scrollX.value,
      inputRange,
      [DOT_INACTIVE_WIDTH, DOT_ACTIVE_WIDTH, DOT_INACTIVE_WIDTH],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.35, 1, 0.35],
      Extrapolation.CLAMP
    );

    return {
      width,
      opacity,
    };
  });

  return <Animated.View style={[styles.dot, { backgroundColor: accent }, animatedStyle]} />;
}

const styles = StyleSheet.create({
  dotsRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
