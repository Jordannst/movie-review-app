import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { startTransition, type ReactElement, useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
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
import { Movie } from '@/data/types';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getMovieById } from '@/services/movies';

// ── Constants ─────────────────────────────────────────────
const MAX_RATING = 5;
const MAX_CHARS = 500;
const RATING_OPTIONS = Array.from({ length: MAX_RATING }, (_, i) => i + 1);
const GLASS_BG = 'rgba(255,255,255,0.05)';
const GLASS_BORDER = 'rgba(255,255,255,0.10)';

const RATING_LABELS: Record<number, string> = {
  1: 'Meh',
  2: 'Okay',
  3: 'Good',
  4: 'Great',
  5: 'Masterpiece',
};

const MOOD_TAGS = [
  'Gripping',
  'Visually stunning',
  'Emotionally heavy',
  'Slow burn',
  'Must watch',
  'Great performances',
  'Thought-provoking',
  'Overrated',
];

// ── Star button ────────────────────────────────────────────
type StarButtonProps = {
  active: boolean;
  accent: string;
  onPress: () => void;
};

function StarButton({ active, accent, onPress }: StarButtonProps): ReactElement {
  const scale = useSharedValue(1);
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current) { hasMounted.current = true; return; }
    scale.value = withSequence(
      withTiming(active ? 1.12 : 0.96, { duration: 100, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 180, easing: Easing.out(Easing.back(1.5)) })
    );
  }, [active, scale]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animStyle}>
      <MotionPressable
        accessibilityRole="button"
        haptic
        onPress={onPress}
        pressScale={0.94}
        style={[
          styles.starBtn,
          active && { borderColor: accent, backgroundColor: 'rgba(167,139,250,0.12)' },
        ]}>
        <MaterialIcons
          color={active ? accent : 'rgba(255,255,255,0.25)'}
          name={active ? 'star' : 'star-border'}
          size={26}
        />
      </MotionPressable>
    </Animated.View>
  );
}

// ── Banner header (safe-area-aware, no overlapping) ────────
type BannerHeaderProps = {
  accent: string;
  movieTitle: string;
  movieYear: string;
  onBack: () => void;
};

function BannerHeader({ accent, movieTitle, movieYear, onBack }: BannerHeaderProps): ReactElement {
  const insets = useSafeAreaInsets();

  return (
    <Animated.View entering={FadeIn.duration(450)} style={styles.topBanner}>
      {/* Gradient backgrounds */}
      <LinearGradient
        colors={['rgba(45,10,90,0.80)', 'rgba(18,26,61,0.85)', 'rgba(4,29,31,0.80)']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={['transparent', '#0B0D12']}
        locations={[0.55, 1]}
        style={styles.bannerFade}
      />

      {/* Column layout: top row → spacer → bottom row. No absolute positioning. */}
      <View style={[styles.bannerInner, { paddingTop: insets.top + 10 }]}>
        {/* Top row — back button left-aligned */}
        <TouchableOpacity
          accessibilityLabel="Go back"
          accessibilityRole="button"
          onPress={onBack}
          style={styles.backBtn}>
          <BlurView intensity={28} tint="dark" style={styles.backBtnInner}>
            <ThemedText style={styles.backBtnText}>← Back</ThemedText>
          </BlurView>
        </TouchableOpacity>

        {/* Spacer pushes content down */}
        <View style={styles.bannerSpacer} />

        {/* Bottom content — pill + title */}
        <View style={styles.bannerContent}>
          <BlurView intensity={22} tint="dark" style={styles.movieContextPill}>
            <ThemedText style={styles.reviewingLabel}>Reviewing</ThemedText>
            <ThemedText style={[styles.movieContextTitle, { color: accent }]}>
              {movieTitle}{movieYear}
            </ThemedText>
          </BlurView>
          <ThemedText type="title" style={styles.pageTitle}>
            Your take. 🎬
          </ThemedText>
        </View>
      </View>
    </Animated.View>
  );
}

// ── Main screen ────────────────────────────────────────────
export default function ReviewFormScreen(): ReactElement {
  const router = useRouter();
  const { movieId } = useLocalSearchParams<{ movieId?: string | string[] }>();
  const resolvedMovieId = Array.isArray(movieId) ? movieId[0] : movieId;
  const [movie, setMovie] = useState<Movie | null>(null);
  const [isMovieLoading, setIsMovieLoading] = useState(true);
  const [movieError, setMovieError] = useState<string | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);

  const [rating, setRating] = useState(4);
  const [comment, setComment] = useState('');
  const [containsSpoilers, setContainsSpoilers] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);

  const accent = useThemeColor({}, 'accent');
  const textMuted = useThemeColor({}, 'textMuted');
  const text = useThemeColor({}, 'text');

  useEffect(() => {
    let isActive = true;

    async function loadMovie() {
      if (!resolvedMovieId) {
        setMovie(null);
        setMovieError(null);
        setIsMovieLoading(false);
        return;
      }

      setIsMovieLoading(true);
      setMovieError(null);

      try {
        const movieResult = await getMovieById(resolvedMovieId);

        if (!isActive) return;

        startTransition(() => {
          setMovie(movieResult);
        });
      } catch (error) {
        if (!isActive) return;
        setMovieError(error instanceof Error ? error.message : 'Failed to load movie details from Supabase.');
      } finally {
        if (isActive) {
          setIsMovieLoading(false);
        }
      }
    }

    void loadMovie();

    return () => {
      isActive = false;
    };
  }, [resolvedMovieId, reloadVersion]);

  const ratingLabel = RATING_LABELS[rating] ?? '';
  const charsLeft = MAX_CHARS - comment.length;
  const canSubmit = comment.trim().length > 0;

  const movieTitle = movie?.title ?? 'this film';
  const movieYear = movie?.year ? ` · ${movie.year}` : '';

  function handleRetryMovie(): void {
    setReloadVersion((current) => current + 1);
  }

  function toggleTag(tag: string): void {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) { next.delete(tag); } else { next.add(tag); }
      return next;
    });
  }

  function handleSubmit(): void { setSubmitted(true); }

  // ── Success state ──────────────────────────────────────
  if (submitted) {
    return (
      <ThemedView style={styles.screen}>
        <Animated.View entering={FadeIn.duration(400)} style={styles.successWrap}>
          {/* Glow backdrop */}
          <LinearGradient
            colors={['rgba(124,58,237,0.20)', 'rgba(59,130,246,0.10)', 'transparent']}
            style={StyleSheet.absoluteFillObject}
          />
          <BlurView intensity={30} tint="dark" style={styles.successCard}>
            {/* Icon */}
            <View style={[styles.successIconWrap, { borderColor: accent }]}>
              <MaterialIcons color={accent} name="check" size={32} />
            </View>
            <ThemedText style={[styles.successKicker, { color: accent }]}>Review submitted</ThemedText>
            <ThemedText type="title">Nice — your take is in! 🎬</ThemedText>
            <ThemedText style={[styles.successCopy, { color: textMuted }]}>
              This draft is still local to the current prototype flow, but the movie context now comes from Supabase for{' '}
              <ThemedText style={{ fontWeight: '700' }}>{movieTitle}</ThemedText>.
            </ThemedText>
            {containsSpoilers ? (
              <View style={[styles.spoilerStatusPill, { borderColor: accent }]}>
                <MaterialIcons color={accent} name="visibility-off" size={16} />
                <ThemedText style={[styles.spoilerStatusText, { color: accent }]}>
                  This review is marked as containing spoilers.
                </ThemedText>
              </View>
            ) : null}
            <PrimaryButton label="Back to Movie" onPress={() => router.back()} />
          </BlurView>
        </Animated.View>
      </ThemedView>
    );
  }

  if (isMovieLoading) {
    return (
      <ThemedView style={styles.screen}>
        <View style={styles.statusWrap}>
          <BlurView intensity={30} tint="dark" style={styles.statusCard}>
            <ThemedText type="title">Loading movie</ThemedText>
            <ThemedText style={[styles.statusCopy, { color: textMuted }]}>
              Pulling the selected movie details from Supabase before you write.
            </ThemedText>
          </BlurView>
        </View>
      </ThemedView>
    );
  }

  if (movieError) {
    return (
      <ThemedView style={styles.screen}>
        <View style={styles.statusWrap}>
          <BlurView intensity={30} tint="dark" style={styles.statusCard}>
            <ThemedText type="title">Couldn&apos;t load movie</ThemedText>
            <ThemedText style={[styles.statusCopy, { color: textMuted }]}>
              {movieError}
            </ThemedText>
            <PrimaryButton label="Retry" onPress={handleRetryMovie} />
          </BlurView>
        </View>
      </ThemedView>
    );
  }

  if (!movie) {
    return (
      <ThemedView style={styles.screen}>
        <View style={styles.statusWrap}>
          <BlurView intensity={30} tint="dark" style={styles.statusCard}>
            <ThemedText type="title">Movie not found</ThemedText>
            <ThemedText style={[styles.statusCopy, { color: textMuted }]}>
              The selected movie could not be found in Supabase.
            </ThemedText>
            <PrimaryButton label="Back" onPress={() => router.back()} />
          </BlurView>
        </View>
      </ThemedView>
    );
  }

  // ── Form ───────────────────────────────────────────────
  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">

        {/* ── 1. Cinematic context header ─────────────────── */}
        <BannerHeader
          accent={accent}
          movieTitle={movieTitle}
          movieYear={movieYear}
          onBack={() => router.back()}
        />

        {/* ── 2. Rating ────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(300).delay(80).easing(Easing.out(Easing.cubic))} style={styles.section}>
          <ThemedText style={[styles.sectionLabel, { color: textMuted }]}>Rating</ThemedText>
          <View style={styles.starsRow}>
            {RATING_OPTIONS.map((val) => (
              <StarButton
                key={val}
                accent={accent}
                active={val <= rating}
                onPress={() => setRating(val)}
              />
            ))}
          </View>
          <View style={styles.ratingLabelRow}>
            <ThemedText style={[styles.ratingWord, { color: accent }]}>{ratingLabel}</ThemedText>
            <ThemedText style={[styles.ratingFraction, { color: textMuted }]}>{rating} / 5</ThemedText>
          </View>
        </Animated.View>

        {/* ── 3. Mood tags ─────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(300).delay(140).easing(Easing.out(Easing.cubic))} style={styles.section}>
          <ThemedText style={[styles.sectionLabel, { color: textMuted }]}>Quick tags (optional)</ThemedText>
          <View style={styles.tagsWrap}>
            {MOOD_TAGS.map((tag) => {
              const isSelected = selectedTags.has(tag);
              return (
                <MotionPressable
                  key={tag}
                  accessibilityRole="button"
                  haptic
                  onPress={() => toggleTag(tag)}
                  pressScale={0.95}
                  style={[
                    styles.tag,
                    isSelected && styles.tagSelected,
                    isSelected
                      ? { borderColor: accent, backgroundColor: 'rgba(167,139,250,0.14)' }
                      : null,
                  ]}>
                  <ThemedText
                    style={[
                      styles.tagText,
                      { color: isSelected ? accent : textMuted },
                      isSelected && styles.tagTextSelected,
                    ]}>
                    {tag}
                  </ThemedText>
                </MotionPressable>
              );
            })}
          </View>
        </Animated.View>

        {/* ── 4. Spoiler warning ───────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(300).delay(200).easing(Easing.out(Easing.cubic))} style={styles.section}>
          <ThemedText style={[styles.sectionLabel, { color: textMuted }]}>Spoiler warning</ThemedText>
          <MotionPressable
            accessibilityRole="switch"
            accessibilityState={{ checked: containsSpoilers }}
            haptic
            onPress={() => setContainsSpoilers((current) => !current)}
            pressScale={0.985}
            style={[
              styles.spoilerToggle,
              containsSpoilers
                ? { borderColor: accent, backgroundColor: 'rgba(167,139,250,0.12)' }
                : null,
            ]}>
            <View style={styles.spoilerToggleCopy}>
              <ThemedText type="defaultSemiBold">Blur this review for readers</ThemedText>
              <ThemedText style={[styles.spoilerToggleText, { color: textMuted }]}>
                Use this if you mention major plot turns, endings, or reveals.
              </ThemedText>
            </View>

            <View
              style={[
                styles.spoilerTogglePill,
                containsSpoilers
                  ? { borderColor: accent, backgroundColor: accent }
                  : null,
              ]}>
              <MaterialIcons
                color={containsSpoilers ? '#0B0D12' : textMuted}
                name={containsSpoilers ? 'visibility-off' : 'visibility'}
                size={16}
              />
              <ThemedText
                style={[
                  styles.spoilerTogglePillText,
                  { color: containsSpoilers ? '#0B0D12' : textMuted },
                ]}>
                {containsSpoilers ? 'On' : 'Off'}
              </ThemedText>
            </View>
          </MotionPressable>
        </Animated.View>

        {/* ── 5. Text area ─────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(300).delay(240).easing(Easing.out(Easing.cubic))} style={styles.section}>
          <View style={styles.textareaHeader}>
            <ThemedText style={[styles.sectionLabel, { color: textMuted }]}>Your review</ThemedText>
            <ThemedText style={[styles.charCount, { color: charsLeft < 50 ? '#f97316' : textMuted }]}>
              {comment.length} / {MAX_CHARS}
            </ThemedText>
          </View>
          <TextInput
            accessibilityLabel="Write your review"
            maxLength={MAX_CHARS}
            multiline
            onChangeText={setComment}
            placeholder="What stood out? What surprised you?"
            placeholderTextColor="rgba(255,255,255,0.22)"
            style={[styles.textArea, { color: text }]}
            textAlignVertical="top"
            value={comment}
          />
        </Animated.View>

        {/* ── 6. Submit CTA card ───────────────────────────── */}
        <Animated.View
          entering={FadeInDown.duration(300).delay(300).easing(Easing.out(Easing.cubic))}
          style={styles.ctaWrap}>
          <LinearGradient
            colors={['rgba(124,58,237,0.18)', 'rgba(59,130,246,0.10)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaGradient}>
            <BlurView intensity={22} tint="dark" style={styles.ctaCard}>
              <ThemedText style={[styles.ctaContext, { color: textMuted }]}>
                Your review for{' '}
                <ThemedText style={[styles.ctaMovieTitle, { color: accent }]}>{movieTitle}</ThemedText>{' '}
                will appear in the community feed
                {containsSpoilers ? ' with a spoiler warning.' : '.'}
              </ThemedText>
              <PrimaryButton disabled={!canSubmit} label="Submit Review" onPress={handleSubmit} />
            </BlurView>
          </LinearGradient>
        </Animated.View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0B0D12',
  },
  statusWrap: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  statusCard: {
    gap: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    padding: 20,
    backgroundColor: GLASS_BG,
  },
  statusCopy: {
    fontSize: 15,
    lineHeight: 22,
  },
  scroll: { flex: 1 },
  content: {
    paddingBottom: 48,
    gap: 20,
  },

  // Top banner
  topBanner: {
    width: '100%',
    minHeight: 170,
    overflow: 'hidden',
  },
  bannerInner: {
    flex: 1,
    flexDirection: 'column',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 0,
  },
  bannerSpacer: {
    flex: 1,
    minHeight: 12,
  },
  bannerFade: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 70,
  },
  backBtn: {
    borderRadius: 999,
    overflow: 'hidden',
    alignSelf: 'flex-start',
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
  bannerContent: {
    padding: 16,
    paddingTop: 0,
    gap: 8,
  },
  movieContextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: GLASS_BG,
  },
  reviewingLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
  },
  movieContextTitle: {
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
  },
  pageTitle: {
    lineHeight: 36,
  },

  // Sections
  section: {
    gap: 10,
    paddingHorizontal: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    lineHeight: 14,
  },

  // Stars
  starsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  starBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    backgroundColor: GLASS_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingWord: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  ratingFraction: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
  },

  // Mood tags
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    backgroundColor: GLASS_BG,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  tagSelected: {
    // Colors set inline
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  tagTextSelected: {
    fontWeight: '700',
  },
  spoilerToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    backgroundColor: GLASS_BG,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  spoilerToggleCopy: {
    flex: 1,
    gap: 4,
  },
  spoilerToggleText: {
    fontSize: 13,
    lineHeight: 18,
  },
  spoilerTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  spoilerTogglePillText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },

  // Textarea
  textareaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  charCount: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
  },
  textArea: {
    minHeight: 140,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    backgroundColor: GLASS_BG,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    lineHeight: 22,
  },

  // CTA
  ctaWrap: {
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.28)',
  },
  ctaGradient: { borderRadius: 20 },
  ctaCard: {
    gap: 14,
    padding: 18,
    backgroundColor: GLASS_BG,
  },
  ctaContext: {
    fontSize: 13,
    lineHeight: 19,
  },
  ctaMovieTitle: {
    fontWeight: '700',
  },

  // Success
  successWrap: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    borderRadius: 24,
    overflow: 'hidden',
  },
  successCard: {
    gap: 14,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    backgroundColor: GLASS_BG,
    overflow: 'hidden',
  },
  successIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(167,139,250,0.1)',
  },
  successKicker: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    lineHeight: 14,
  },
  successCopy: {
    fontSize: 14,
    lineHeight: 20,
  },
  spoilerStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'rgba(167,139,250,0.10)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  spoilerStatusText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
});
