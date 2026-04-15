import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { type ReactElement, useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { MotionPressable } from '@/components/motion-pressable';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getMovieById } from '@/data/movies';
import { useThemeColor } from '@/hooks/use-theme-color';

const MAX_RATING = 5;
const RATING_OPTIONS = Array.from({ length: MAX_RATING }, (_, index) => index + 1);
const SECTION_ENTER_DURATION = 280;
const STAR_PEAK_SCALE = 1.08;
const STAR_SETTLE_SCALE = 1;
const STAR_RELEASE_SCALE = 0.98;

type RatingStarButtonProps = {
  active: boolean;
  accent: string;
  border: string;
  onPress: () => void;
  surface: string;
  surfaceMuted: string;
  textMuted: string;
};

function getEnterAnimation(delay = 0) {
  return FadeInDown.duration(SECTION_ENTER_DURATION)
    .delay(delay)
    .easing(Easing.out(Easing.quad))
    .withInitialValues({
      opacity: 0,
      transform: [{ translateY: 10 }],
    });
}

function RatingStarButton({
  active,
  accent,
  border,
  onPress,
  surface,
  surfaceMuted,
  textMuted,
}: RatingStarButtonProps): ReactElement {
  const scale = useSharedValue(1);
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    scale.value = withSequence(
      withTiming(active ? STAR_PEAK_SCALE : STAR_RELEASE_SCALE, {
        duration: 110,
        easing: Easing.out(Easing.quad),
      }),
      withTiming(STAR_SETTLE_SCALE, {
        duration: 160,
        easing: Easing.out(Easing.quad),
      })
    );
  }, [active, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <MotionPressable
        accessibilityRole="button"
        haptic
        onPress={onPress}
        pressScale={0.96}
        pressedOpacity={0.94}
        style={[
          styles.starButton,
          {
            backgroundColor: active ? surface : surfaceMuted,
            borderColor: active ? accent : border,
          },
        ]}>
        <MaterialIcons color={active ? accent : textMuted} name={active ? 'star' : 'star-border'} size={26} />
      </MotionPressable>
    </Animated.View>
  );
}

export default function ReviewFormScreen(): ReactElement {
  const router = useRouter();
  const { movieId } = useLocalSearchParams<{ movieId?: string | string[] }>();
  const resolvedMovieId = Array.isArray(movieId) ? movieId[0] : movieId;
  const movie = resolvedMovieId ? getMovieById(resolvedMovieId) : undefined;
  const [rating, setRating] = useState(4);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const background = useThemeColor({}, 'background');
  const surface = useThemeColor({}, 'surface');
  const surfaceMuted = useThemeColor({}, 'surfaceMuted');
  const border = useThemeColor({}, 'border');
  const textMuted = useThemeColor({}, 'textMuted');
  const accent = useThemeColor({}, 'accent');
  const text = useThemeColor({}, 'text');
  const canSubmit = comment.trim().length > 0;

  let helperText = 'Your review will not be saved yet. This screen is currently a UI-only demo.';

  if (movie) {
    helperText = `You are reviewing ${movie.title}. Submission is simulated for this MVP.`;
  }

  function handleBackToMovie(): void {
    router.back();
  }

  function handleSubmit(): void {
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <ThemedView style={styles.screen}>
        <Animated.View entering={getEnterAnimation(0)} style={styles.successCardWrapper}>
          <View style={[styles.successCard, { backgroundColor: surface, borderColor: border }]}>
            <ThemedText style={[styles.kicker, { color: accent }]}>Review submitted</ThemedText>
            <ThemedText type="title">Nice. Your draft review is ready.</ThemedText>
            <ThemedText style={[styles.successCopy, { color: textMuted }]}>
              In the next phase, this action will save data to Supabase and appear in the movie detail page automatically.
            </ThemedText>
            <PrimaryButton label="Back to Movie" onPress={handleBackToMovie} />
          </View>
        </Animated.View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.screen}>
      <View style={styles.content}>
        <Animated.View entering={getEnterAnimation(0)} style={styles.header}>
          <ThemedText style={[styles.kicker, { color: accent }]}>Write Review</ThemedText>
          <ThemedText type="title">Share your take.</ThemedText>
          <ThemedText style={[styles.subtitle, { color: textMuted }]}>{helperText}</ThemedText>
        </Animated.View>

        <Animated.View entering={getEnterAnimation(70)} style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
          <ThemedText type="subtitle">Your rating</ThemedText>
          <View style={styles.starsRow}>
            {RATING_OPTIONS.map((currentValue) => {
              const isActive = currentValue <= rating;

              return (
                <RatingStarButton
                  key={currentValue}
                  accent={accent}
                  active={isActive}
                  border={border}
                  onPress={() => setRating(currentValue)}
                  surface={surface}
                  surfaceMuted={surfaceMuted}
                  textMuted={textMuted}
                />
              );
            })}
          </View>
          <ThemedText style={[styles.ratingText, { color: textMuted }]}>{rating} of 5 selected</ThemedText>
        </Animated.View>

        <Animated.View entering={getEnterAnimation(130)} style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
          <ThemedText type="subtitle">Comment</ThemedText>
          <TextInput
            multiline
            placeholder="Tell us what worked, what surprised you, and whether you would recommend this movie."
            placeholderTextColor={textMuted}
            style={[
              styles.input,
              {
                backgroundColor: background,
                borderColor: border,
                color: text,
              },
            ]}
            textAlignVertical="top"
            value={comment}
            onChangeText={setComment}
          />
        </Animated.View>

        <Animated.View entering={getEnterAnimation(190)}>
          <PrimaryButton disabled={!canSubmit} label="Submit Review" onPress={handleSubmit} />
        </Animated.View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    gap: 20,
    padding: 20,
  },
  header: {
    gap: 10,
  },
  kicker: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    gap: 14,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  starButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
  },
  ratingText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  input: {
    minHeight: 160,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    lineHeight: 22,
  },
  successCardWrapper: {
    margin: 20,
    marginTop: 32,
  },
  successCard: {
    gap: 16,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  successCopy: {
    fontSize: 15,
    lineHeight: 22,
  },
});