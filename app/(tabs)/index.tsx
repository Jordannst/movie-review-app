import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { startTransition, useEffect, useMemo, useState, type ReactElement } from 'react';
import { Dimensions, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { FeaturedCarousel } from '@/components/featured-carousel';
import { MotionPressable } from '@/components/motion-pressable';
import { MovieCard } from '@/components/movie-card';
import { PrimaryButton } from '@/components/primary-button';
import { ShimmerView } from '@/components/shimmer-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import { Movie } from '@/data/types';
import { useTabSwipe } from '@/hooks/use-tab-swipe';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getFeaturedMovies, getMovies, type MovieCategory } from '@/services/movies';
import { deriveInitials, getCurrentUserProfile } from '@/services/profile';

const SECTION_ENTER_DURATION = 280;
const ITEM_STAGGER = 45;
const DISCOVER_CHIPS: readonly { label: string; category: MovieCategory }[] = [
  { label: 'Trending', category: 'trending' },
  { label: 'New', category: 'new' },
  { label: 'Awarded', category: 'awarded' },
] as const;
const SHIMMER_COLOR = '#1A1C24';

// ── Home Loading Skeleton ────────────────────────────────────────────────────
function HomeLoadingSkeleton({ topInset }: { topInset: number }) {
  return (
    <View style={{ flex: 1 }}>
      {/* Hero shimmer */}
      <ShimmerView
        color={SHIMMER_COLOR}
        style={{ width: '100%', height: 560 + topInset, borderRadius: 0 }}
        duration={1100}
      />

      {/* Greeting shimmer */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, gap: 6 }}>
        <ShimmerView color={SHIMMER_COLOR} style={{ height: 10, width: 80, borderRadius: 4 }} />
        <ShimmerView color={SHIMMER_COLOR} style={{ height: 18, width: '55%', borderRadius: 6 }} />
      </View>

      {/* Search bar shimmer */}
      <ShimmerView
        color={SHIMMER_COLOR}
        style={{ height: 48, marginHorizontal: 20, marginTop: 14, borderRadius: 20 }}
        duration={950}
      />

      {/* Card skeletons — stagger in */}
      <View style={{ paddingHorizontal: 20, marginTop: 20, gap: 10 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Animated.View
            key={i}
            entering={FadeInDown.duration(240).delay(i * 60).easing(Easing.out(Easing.cubic))}
            style={{
              flexDirection: 'row',
              gap: 10,
              backgroundColor: '#131620',
              borderRadius: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: '#1E2028',
            }}>
            <ShimmerView
              color={SHIMMER_COLOR}
              style={{ width: 48, height: 68, borderRadius: 8 }}
              duration={900 + i * 80}
            />
            <View style={{ flex: 1, gap: 7, justifyContent: 'center' }}>
              <ShimmerView color={SHIMMER_COLOR} style={{ height: 13, width: '68%', borderRadius: 5 }} duration={850 + i * 70} />
              <ShimmerView color={SHIMMER_COLOR} style={{ height: 10, width: '42%', borderRadius: 4 }} duration={900 + i * 70} />
              <ShimmerView color={SHIMMER_COLOR} style={{ height: 10, width: '30%', borderRadius: 4 }} duration={950 + i * 70} />
            </View>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

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

function getMetadataString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

export default function HomeScreen(): ReactElement {
  const router = useRouter();
  const { user } = useAuth();
  const accent = useThemeColor({}, 'accent');
  const textMuted = useThemeColor({}, 'textMuted');
  const text = useThemeColor({}, 'text');
  const [query, setQuery] = useState('');
  const [movieItems, setMovieItems] = useState<Movie[]>([]);
  const [featuredMovies, setFeaturedMovies] = useState<Movie[]>([]);
  const [profileInitials, setProfileInitials] = useState('MR');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);
  const swipeHandlers = useTabSwipe();
  const metadataName = useMemo(
    () =>
      getMetadataString(user?.user_metadata?.name) ??
      getMetadataString(user?.user_metadata?.full_name),
    [user?.user_metadata]
  );

  useEffect(() => {
    let isActive = true;

    async function loadHomeMovies() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const profilePromise = user ? getCurrentUserProfile().catch(() => null) : Promise.resolve(null);
        const [moviesData, featuredList, profileData] = await Promise.all([
          getMovies(),
          getFeaturedMovies(5),
          profilePromise,
        ]);

        if (!isActive) return;

        startTransition(() => {
          setMovieItems(moviesData);
          // Fallback to first movie kalau service mengembalikan list kosong
          const carousel = featuredList.length > 0
            ? featuredList
            : moviesData[0]
              ? [moviesData[0]]
              : [];
          setFeaturedMovies(carousel);
          setProfileInitials(
            profileData?.initials?.trim() ||
              deriveInitials(profileData?.name || metadataName, user?.email)
          );
        });
      } catch (error) {
        if (!isActive) return;
        setLoadError(error instanceof Error ? error.message : 'Failed to load movies from Supabase.');
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadHomeMovies();

    return () => {
      isActive = false;
    };
  }, [metadataName, reloadVersion, user]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredMovies = useMemo(
    () =>
      normalizedQuery
        ? movieItems.filter((movie) => {
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
        : movieItems,
    [movieItems, normalizedQuery]
  );
  const greeting = useMemo(() => getGreeting(), []);
  const insets = useSafeAreaInsets();

  function handleOpenMovie(movieId: string): void {
    router.push(`/movies/${movieId}`);
  }

  function handleDiscoverPress(category?: MovieCategory): void {
    if (category) {
      router.push({ pathname: '/movies' as never, params: { category } });
    } else {
      router.push('/movies' as never);
    }
  }

  function handleRetry(): void {
    setReloadVersion((current) => current + 1);
  }

  const heroBackdropMovie = featuredMovies[0] ?? null;
  const isInitialLoad = isLoading && movieItems.length === 0 && featuredMovies.length === 0;

  return (
    <ThemedView style={styles.screen} {...swipeHandlers}>
      {/* ── Ambient backdrop: film colour aura, fades to dark ───────── */}
      <View style={styles.ambientWrap}>
        {heroBackdropMovie ? (
          <Image
            source={{ uri: heroBackdropMovie.backdropUrl }}
            style={[StyleSheet.absoluteFillObject, { opacity: 0.45 }]}
            contentFit="cover"
            blurRadius={40}
          />
        ) : null}
        {/* 3-stage gradient: soft at top → heavier mid → solid dark bottom */}
        <LinearGradient
          colors={['rgba(11,13,18,0.25)', 'rgba(11,13,18,0.50)', '#0B0D12']}
          locations={[0, 0.50, 1]}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        {isInitialLoad ? (
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            style={styles.scroll}>
            <HomeLoadingSkeleton topInset={insets.top} />
          </ScrollView>
        ) : (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: normalizedQuery ? insets.top : 0 },
          ]}
          showsVerticalScrollIndicator={false}
          style={styles.scroll}>

          {/* ── 1. FEATURED CAROUSEL — first thing the user sees ── */}
          {!normalizedQuery && featuredMovies.length > 0 ? (
            <Animated.View entering={FadeIn.duration(420)} style={styles.heroWrap}>
              <FeaturedCarousel
                movies={featuredMovies}
                actionLabel="View Details"
                onActionPress={(movie) => handleOpenMovie(movie.id)}
                topInset={insets.top}
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
                {profileInitials}
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
                  key={chip.category}
                  accessibilityLabel={`Browse ${chip.label.toLowerCase()} movies`}
                  accessibilityRole="button"
                  haptic
                  onPress={() => handleDiscoverPress(chip.category)}
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
                      {chip.label}
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
            <MotionPressable
              accessibilityLabel="See all movies"
              accessibilityRole="button"
              haptic
              onPress={() => handleDiscoverPress()}
              style={[styles.seeAllBtn, { borderColor: accent, backgroundColor: `${accent}15` }]}>
              <ThemedText style={[styles.seeAllText, { color: accent }]}>See all →</ThemedText>
            </MotionPressable>
          </Animated.View>

          {/* ── 6. MOVIE LIST ─────────────────────────────────── */}
          {loadError ? (
            <BlurView
              intensity={30}
              tint="dark"
              style={styles.emptyState}>
              <ThemedText type="subtitle">Couldn&apos;t load movies</ThemedText>
              <ThemedText style={[styles.emptyStateText, { color: textMuted }]}>
                {loadError}
              </ThemedText>
              <PrimaryButton label="Retry" onPress={handleRetry} />
            </BlurView>
          ) : filteredMovies.length > 0 ? (
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
        )}
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
    paddingBottom: 32,
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

  seeAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
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
