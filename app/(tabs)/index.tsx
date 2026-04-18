import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { type ReactElement, useMemo, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FeaturedHero } from '@/components/featured-hero';
import { MotionPressable } from '@/components/motion-pressable';
import { MovieCard } from '@/components/movie-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { featuredMovie, movies } from '@/data/movies';
import { profile } from '@/data/profile';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTabSwipe } from '@/hooks/use-tab-swipe';

const SECTION_ENTER_DURATION = 280;
const ITEM_STAGGER = 45;
const DISCOVER_CHIPS = ['Trending', 'New', 'Awarded'] as const;

function getEnterAnimation(delay = 0) {
  return FadeInDown.duration(SECTION_ENTER_DURATION)
    .delay(delay)
    .easing(Easing.out(Easing.cubic))
    .withInitialValues({
      opacity: 0,
      transform: [{ translateY: 10 }],
    });
}

/** Returns a simple time-of-day greeting. */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Still up late?';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

export default function HomeScreen(): ReactElement {
  const router = useRouter();
  const accent = useThemeColor({}, 'accent');
  const textMuted = useThemeColor({}, 'textMuted');
  const text = useThemeColor({}, 'text');
  const [query, setQuery] = useState('');
  const swipeHandlers = useTabSwipe();

  const normalizedQuery = query.trim().toLowerCase();
  const filteredMovies = useMemo(
    () =>
      normalizedQuery
        ? movies.filter((movie) => {
            const searchFields = [
              movie.title,
              movie.tagline,
              movie.director,
              movie.synopsis,
              movie.year.toString(),
              ...movie.genres,
            ];
            return searchFields.some((field) => field.toLowerCase().includes(normalizedQuery));
          })
        : movies,
    [normalizedQuery]
  );
  const movieCountLabel = `${filteredMovies.length} movie${filteredMovies.length === 1 ? '' : 's'}`;

  const greeting = useMemo(() => getGreeting(), []);

  function handleOpenMovie(movieId: string): void {
    router.push(`/movies/${movieId}`);
  }

  function handleDiscoverPress(): void {}

  return (
    <ThemedView style={styles.screen} {...swipeHandlers}>
      {/* ── Ambient backdrop: film colour aura, fades to dark ───────── */}
      <View style={styles.ambientWrap}>
        <Image
          source={{ uri: featuredMovie.backdropUrl }}
          style={[StyleSheet.absoluteFillObject, { opacity: 0.45 }]}
          contentFit="cover"
          blurRadius={40}
        />
        {/* 3-stage gradient: soft at top → heavier mid → solid dark bottom */}
        <LinearGradient
          colors={['rgba(11,13,18,0.25)', 'rgba(11,13,18,0.50)', '#0B0D12']}
          locations={[0, 0.50, 1]}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          style={styles.scroll}>

          {/* ── 1. FEATURED HERO — first thing the user sees ──── */}
          {!normalizedQuery ? (
            <Animated.View entering={FadeIn.duration(420)} style={styles.heroWrap}>
              <FeaturedHero
                movie={featuredMovie}
                actionLabel="View Details"
                onActionPress={() => handleOpenMovie(featuredMovie.id)}
              />
            </Animated.View>
          ) : null}

          {/* ── 2. GREETING ROW — compact, personal ─────────── */}
          <Animated.View entering={getEnterAnimation(normalizedQuery ? 0 : 80)} style={styles.greetingRow}>
            <View style={styles.greetingLeft}>
              <ThemedText style={[styles.greetingTime, { color: accent }]}>{greeting}</ThemedText>
              <ThemedText type="subtitle" style={styles.greetingQuestion}>
                What&apos;s on tonight? 🎬
              </ThemedText>
            </View>

            {/* Mini avatar pill */}
            <BlurView intensity={28} tint="light" style={styles.avatarPill}>
              <ThemedText style={[styles.avatarInitials, { color: accent }]}>
                {profile.account.initials}
              </ThemedText>
            </BlurView>
          </Animated.View>

          {/* ── 3. SEARCH BAR ────────────────────────────────── */}
          <Animated.View entering={getEnterAnimation(normalizedQuery ? 40 : 130)}>
            <BlurView
              intensity={40}
              tint="dark"
              style={styles.searchBar}>
              <View style={styles.searchIconWrap}>
                <MaterialIcons color={accent} name="search" size={18} />
              </View>
              <TextInput
                accessibilityLabel="Search movies"
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setQuery}
                placeholder="Search titles, genres, or moods"
                placeholderTextColor={textMuted}
                returnKeyType="search"
                selectionColor={accent}
                style={[styles.searchInput, { color: text }]}
                value={query}
              />
            </BlurView>
          </Animated.View>

          {/* ── 4. FILTER CHIPS ──────────────────────────────── */}
          <Animated.View entering={getEnterAnimation(normalizedQuery ? 60 : 170)} style={styles.chipRow}>
            {DISCOVER_CHIPS.map((chip, index) => {
              const isFeaturedChip = index === 0;
              return (
                <MotionPressable
                  key={chip}
                  accessibilityLabel={`Browse ${chip.toLowerCase()} movies`}
                  accessibilityRole="button"
                  haptic
                  onPress={handleDiscoverPress}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: 'transparent',
                      borderColor: isFeaturedChip ? accent : 'rgba(255,255,255,0.1)',
                      overflow: 'hidden',
                      paddingHorizontal: 0,
                      paddingVertical: 0,
                    },
                  ]}>
                  <BlurView intensity={40} tint="dark" style={styles.chipInner}>
                    <ThemedText style={[styles.chipText, isFeaturedChip ? { color: accent } : null]}>
                      {chip}
                    </ThemedText>
                  </BlurView>
                </MotionPressable>
              );
            })}
          </Animated.View>

          {/* ── 5. SECTION HEADER ────────────────────────────── */}
          <Animated.View entering={getEnterAnimation(normalizedQuery ? 80 : 210)} style={styles.sectionHeader}>
            <View>
              <ThemedText style={styles.sectionLabel}>Now showing</ThemedText>
              <ThemedText type="subtitle">
                {normalizedQuery ? `Results for "${query.trim()}"` : 'Browse popular picks'}
              </ThemedText>
            </View>
            <ThemedText style={[styles.sectionMeta, { color: textMuted }]}>{movieCountLabel}</ThemedText>
          </Animated.View>

          {/* ── 6. MOVIE LIST ─────────────────────────────────── */}
          {filteredMovies.length > 0 ? (
            <View style={styles.list}>
              {filteredMovies.map((movie, index) => (
                <Animated.View
                  key={movie.id}
                  entering={getEnterAnimation((normalizedQuery ? 120 : 260) + index * ITEM_STAGGER)}>
                  <MovieCard movie={movie} onPress={() => handleOpenMovie(movie.id)} />
                </Animated.View>
              ))}
            </View>
          ) : (
            <BlurView
              intensity={30}
              tint="dark"
              style={styles.emptyState}>
              <ThemedText type="subtitle">No movies found</ThemedText>
              <ThemedText style={[styles.emptyStateText, { color: textMuted }]}>
                Try a different title, genre, director, or year.
              </ThemedText>
            </BlurView>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0B0D12',
  },
  // Ambient backdrop — top 58% only, fades to dark below
  ambientWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Dimensions.get('window').height * 0.58,
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
    gap: 12,
  },

  // Hero — full-bleed, bleeds into next section (negative margin cancels ScrollView gap)
  heroWrap: {
    marginHorizontal: 0,
    marginBottom: -12,
  },

  // Greeting row — compact, 1-2 lines max
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 4,
    gap: 12,
  },
  greetingLeft: {
    flexShrink: 1,
    gap: 2,
  },
  greetingTime: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  greetingQuestion: {
    lineHeight: 28,
  },
  avatarPill: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarInitials: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 16,
  },

  // Search bar
  searchBar: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginHorizontal: 20,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  searchIconWrap: {
    alignItems: 'center',
    borderRadius: 999,
    height: 34,
    justifyContent: 'center',
    width: 34,
    backgroundColor: 'transparent',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
    paddingVertical: 0,
  },

  // Chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 20,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
  },
  chipInner: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },

  // Section header
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
  sectionMeta: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },

  // Movie list
  list: {
    gap: 14,
    paddingHorizontal: 20,
  },

  // Empty state
  emptyState: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 20,
    marginHorizontal: 20,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  emptyStateText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
