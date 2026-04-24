import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    startTransition,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactElement,
} from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    Easing,
    FadeIn,
    FadeInDown,
    SlideInDown,
    SlideOutDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MotionPressable } from '@/components/motion-pressable';
import { ShimmerView } from '@/components/shimmer-view';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { Movie } from '@/data/types';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import {
    getCategoryLabel,
    getMoviesFiltered,
    type MovieCategory,
    type MovieSortKey,
    type MoviesFilterParams,
} from '@/services/movies';

const PAGE_SIZE = 12;
const SCREEN_WIDTH = Dimensions.get('window').width;
const POSTER_COL_GAP = 12;
const POSTER_H_PAD = 24;
const POSTER_WIDTH = (SCREEN_WIDTH - POSTER_H_PAD * 2 - POSTER_COL_GAP) / 2;

// All genres seeded in the app
const ALL_GENRES = ['All', 'Sci-Fi', 'Action', 'Drama', 'Thriller', 'Crime', 'Animation', 'Romance'] as const;

type ViewMode = 'list' | 'grid';
type SortOption = { key: MovieSortKey; label: string };

const SORT_OPTIONS: SortOption[] = [
  { key: 'rating', label: '★ Rating' },
  { key: 'year', label: '📅 Year' },
  { key: 'title', label: 'A–Z' },
];

// ── Skeleton placeholder ──────────────────────────────────────────────────────
const SHIMMER = '#1A1C24';

function SkeletonListCard({ index = 0 }: { index?: number; border?: string; surface?: string }) {
  return (
    <Animated.View
      entering={FadeInDown.duration(220).delay(index * 55).easing(Easing.out(Easing.cubic))}
      style={[
        styles.listCard,
        { borderColor: '#1E2028', backgroundColor: '#131620', flexDirection: 'row', gap: 10 },
      ]}>
      <ShimmerView color={SHIMMER} style={{ width: 52, height: 74, borderRadius: 8 }} duration={900 + index * 80} />
      <View style={{ flex: 1, gap: 7, justifyContent: 'center' }}>
        <ShimmerView color={SHIMMER} style={{ height: 13, width: '70%' }} duration={850 + index * 70} />
        <ShimmerView color={SHIMMER} style={{ height: 10, width: '45%' }} duration={900 + index * 70} />
        <ShimmerView color={SHIMMER} style={{ height: 10, width: '35%' }} duration={950 + index * 70} />
      </View>
    </Animated.View>
  );
}

function SkeletonGridCard({ index = 0 }: { index?: number; border?: string; surface?: string }) {
  return (
    <Animated.View
      entering={FadeInDown.duration(220).delay(index * 55).easing(Easing.out(Easing.cubic))}
      style={[styles.gridCard, { borderColor: '#1E2028', backgroundColor: '#131620', width: POSTER_WIDTH }]}>
      <ShimmerView
        color={SHIMMER}
        style={{ aspectRatio: 2 / 3, borderRadius: 0, width: '100%' }}
        duration={900 + index * 80}
      />
    </Animated.View>
  );
}

// ── List Card (Cinematic, Option B) ──────────────────────────────────────────
function ListCard({ movie, onPress }: { movie: Movie; onPress: () => void }) {
  const border = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');
  const textMuted = useThemeColor({}, 'textMuted');

  return (
    <MotionPressable onPress={onPress} style={[styles.listCard, { borderColor: border, backgroundColor: surface }]}>
      {/* Backdrop */}
      <Image
        source={{ uri: movie.backdropUrl }}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
      />
      {/* Left gradient so text is readable */}
      <View style={styles.listGradientLeft} />
      {/* Poster thumbnail */}
      <Image
        source={{ uri: movie.posterUrl }}
        style={styles.listPosterThumb}
        contentFit="cover"
      />
      {/* Info */}
      <View style={styles.listInfo}>
        <ThemedText style={styles.listTitle} numberOfLines={1}>{movie.title}</ThemedText>
        <View style={styles.listMeta}>
          <ThemedText style={[styles.listMetaText, { color: textMuted }]}>{movie.year}</ThemedText>
          <ThemedText style={[styles.listMetaDot, { color: textMuted }]}>·</ThemedText>
          <ThemedText style={[styles.listMetaText, { color: textMuted }]} numberOfLines={1}>
            {movie.genres.slice(0, 2).join(', ')}
          </ThemedText>
          <ThemedText style={[styles.listMetaDot, { color: textMuted }]}>·</ThemedText>
          <ThemedText style={[styles.listMetaText, { color: textMuted }]}>{movie.runtimeMinutes} min</ThemedText>
        </View>
      </View>
      {/* Rating badge */}
      <View style={styles.listRatingBadge}>
        <ThemedText style={styles.listRatingText}>★ {movie.averageRating.toFixed(1)}</ThemedText>
      </View>
    </MotionPressable>
  );
}

// ── Grid Card (Poster, Option A) ─────────────────────────────────────────────
function GridCard({ movie, onPress }: { movie: Movie; onPress: () => void }) {
  const border = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');
  const textMuted = useThemeColor({}, 'textMuted');

  return (
    <MotionPressable
      onPress={onPress}
      style={[styles.gridCard, { borderColor: border, backgroundColor: surface, width: POSTER_WIDTH }]}>
      <Image
        source={{ uri: movie.posterUrl }}
        style={styles.gridPoster}
        contentFit="cover"
      />
      <View style={styles.gridRatingBadge}>
        <ThemedText style={styles.gridRatingText}>★ {movie.averageRating.toFixed(1)}</ThemedText>
      </View>
      <View style={styles.gridMeta}>
        <ThemedText style={styles.gridTitle} numberOfLines={2}>{movie.title}</ThemedText>
        <ThemedText style={[styles.gridYear, { color: textMuted }]}>{movie.year}</ThemedText>
      </View>
    </MotionPressable>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function BrowseMoviesScreen(): ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== 'light';
  const bgColor = isDark ? Colors.dark.background : Colors.light.background;

  const accent = useThemeColor({}, 'accent');
  const surface = useThemeColor({}, 'surface');
  const surfaceMuted = useThemeColor({}, 'surfaceMuted');
  const border = useThemeColor({}, 'border');
  const textMuted = useThemeColor({}, 'textMuted');

  // Navigation params (when tapped from Home chips or deep-linked)
  const { genre: initialGenre, category: initialCategory } = useLocalSearchParams<{
    genre?: string;
    category?: string;
  }>();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedGenre, setSelectedGenre] = useState<string>(initialGenre ?? 'All');
  const [sort, setSort] = useState<MovieSortKey>('rating');
  const [activeCategory, setActiveCategory] = useState<MovieCategory | null>(
    initialCategory === 'trending' || initialCategory === 'new' || initialCategory === 'awarded'
      ? initialCategory
      : null
  );

  // Trending/new presets override the user's sort choice.
  const categoryOverridesSort = activeCategory === 'trending' || activeCategory === 'new';

  const [movies, setMovies] = useState<Movie[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const listRef = useRef<FlatList>(null);

  // Build query params
  const filterParams = useMemo<MoviesFilterParams>(() => ({
    genre: selectedGenre === 'All' ? undefined : selectedGenre,
    sort,
    category: activeCategory ?? undefined,
    page: 0,
    pageSize: PAGE_SIZE,
  }), [selectedGenre, sort, activeCategory]);

  // Initial load / filter change — reset to page 0
  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);
    setMovies([]);
    setPage(0);
    setHasMore(true);

    getMoviesFiltered(filterParams)
      .then((result) => {
        if (!active) return;
        startTransition(() => {
          setMovies(result.movies);
          setTotalCount(result.totalCount);
          setHasMore(result.hasMore);
          setPage(1);
        });
      })
      .catch((err: Error) => {
        if (!active) return;
        setError(err.message);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => { active = false; };
  }, [filterParams]);

  // Scroll to top on filter/sort change
  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [selectedGenre, sort, activeCategory]);

  const loadMore = useCallback(async () => {
    if (isFetchingMore || !hasMore || isLoading) return;
    setIsFetchingMore(true);

    try {
      const result = await getMoviesFiltered({
        genre: selectedGenre === 'All' ? undefined : selectedGenre,
        sort,
        category: activeCategory ?? undefined,
        page,
        pageSize: PAGE_SIZE,
      });

      startTransition(() => {
        setMovies((prev) => {
          const ids = new Set(prev.map((m) => m.id));
          return prev.concat(result.movies.filter((m) => !ids.has(m.id)));
        });
        setTotalCount(result.totalCount);
        setHasMore(result.hasMore);
        setPage((p) => p + 1);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more.');
    } finally {
      setIsFetchingMore(false);
    }
  }, [isFetchingMore, hasMore, isLoading, selectedGenre, sort, activeCategory, page]);

  function handleOpenMovie(id: string) {
    router.push(`/movies/${id}`);
  }

  /**
   * Tapping a sort pill while a category overrides sort clears the category.
   * This lets users gracefully escape a preset by expressing a new sort intent.
   */
  function handleSortPress(key: MovieSortKey): void {
    if (categoryOverridesSort) {
      setActiveCategory(null);
    }
    setSort(key);
  }

  function handleClearCategory(): void {
    setActiveCategory(null);
  }

  // ── Render Items ─────────────────────────────────────────────────────────
  const renderListItem = useCallback(
    ({ item }: { item: Movie }) => (
      <ListCard movie={item} onPress={() => handleOpenMovie(item.id)} />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Grid renders 2 columns — we pair movies
  const gridPairs = useMemo(() => {
    const pairs: Array<[Movie, Movie | null]> = [];
    for (let i = 0; i < movies.length; i += 2) {
      pairs.push([movies[i]!, movies[i + 1] ?? null]);
    }
    return pairs;
  }, [movies]);

  const renderGridRow = useCallback(
    ({ item, index }: { item: [Movie, Movie | null]; index: number }) => (
      <View style={styles.gridRow}>
        <GridCard
          movie={item[0]}
          onPress={() => handleOpenMovie(item[0].id)}
        />
        {item[1] ? (
          <GridCard
            movie={item[1]}
            // Stagger alternate rows for magazine feel
            onPress={() => handleOpenMovie(item[1]!.id)}
          />
        ) : (
          <View style={{ width: POSTER_WIDTH }} />
        )}
      </View>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const renderFooter = () => {
    if (!isFetchingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator color={accent} size="small" />
      </View>
    );
  };

  const isEmpty = !isLoading && movies.length === 0 && !error;

  // ── JSX ──────────────────────────────────────────────────────────────────
  return (
    <Animated.View
      style={[styles.screen, { backgroundColor: bgColor }]}
      entering={SlideInDown.duration(380).easing(Easing.out(Easing.cubic))}
      exiting={SlideOutDown.duration(320).easing(Easing.in(Easing.cubic))}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          accessibilityLabel="Go back"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={[styles.headerBtn, { backgroundColor: surfaceMuted, borderColor: border }]}>
          <ThemedText style={styles.headerBtnText}>←</ThemedText>
        </TouchableOpacity>

        <ThemedText style={styles.headerTitle}>Browse Films</ThemedText>

        {/* View mode toggle */}
        <View style={styles.viewToggle}>
          <TouchableOpacity
            accessibilityLabel="List view"
            onPress={() => setViewMode('list')}
            style={[
              styles.toggleBtn,
              { borderColor: border },
              viewMode === 'list' && { backgroundColor: `${accent}22`, borderColor: accent },
            ]}>
            <ThemedText style={[styles.toggleIcon, viewMode === 'list' && { color: accent }]}>☰</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel="Grid view"
            onPress={() => setViewMode('grid')}
            style={[
              styles.toggleBtn,
              { borderColor: border },
              viewMode === 'grid' && { backgroundColor: `${accent}22`, borderColor: accent },
            ]}>
            <ThemedText style={[styles.toggleIcon, viewMode === 'grid' && { color: accent }]}>⊞</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Active Category Badge — dismissible ─────────────────── */}
      {activeCategory ? (
        <Animated.View
          entering={FadeIn.duration(260)}
          style={styles.categoryBadgeRow}>
          <View style={[styles.categoryBadge, { backgroundColor: `${accent}18`, borderColor: accent }]}>
            <ThemedText style={[styles.categoryBadgeLabel, { color: accent }]}>
              {getCategoryLabel(activeCategory)}
            </ThemedText>
            <TouchableOpacity
              accessibilityLabel="Clear category filter"
              accessibilityRole="button"
              onPress={handleClearCategory}
              hitSlop={10}
              style={[styles.categoryBadgeClose, { borderColor: `${accent}55` }]}>
              <ThemedText style={[styles.categoryBadgeCloseText, { color: accent }]}>✕</ThemedText>
            </TouchableOpacity>
          </View>
        </Animated.View>
      ) : null}

      {/* ── Genre Chips ─────────────────────────────────────────── */}
      <Animated.View entering={FadeIn.duration(300).delay(80)}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.genreRow}>
          {ALL_GENRES.map((genre) => {
            const active = selectedGenre === genre;
            return (
              <TouchableOpacity
                key={genre}
                accessibilityLabel={`Filter by ${genre}`}
                onPress={() => setSelectedGenre(genre)}
                style={[
                  styles.genreChip,
                  { borderColor: border, backgroundColor: surfaceMuted },
                  active && { borderColor: accent, backgroundColor: `${accent}18` },
                ]}>
                <ThemedText style={[styles.genreChipText, { color: textMuted }, active && { color: accent }]}>
                  {genre}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* ── Sort Pills + Count ────────────────────────────────────────────── */}
      <Animated.View entering={FadeIn.duration(300).delay(120)} style={styles.sortRow}>
        <ThemedText style={[styles.countLabel, { color: textMuted }]}>
          {isLoading ? '—' : `${totalCount} film${totalCount !== 1 ? 's' : ''}`}
        </ThemedText>
        <View style={styles.sortPills}>
          {SORT_OPTIONS.map((opt) => {
            const active = sort === opt.key && !categoryOverridesSort;
            const dimmed = categoryOverridesSort && sort === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                accessibilityLabel={
                  categoryOverridesSort
                    ? `Sort by ${opt.label} (clears active category)`
                    : `Sort by ${opt.label}`
                }
                onPress={() => handleSortPress(opt.key)}
                style={[
                  styles.sortPill,
                  { borderColor: border, backgroundColor: surfaceMuted },
                  active && { borderColor: accent, backgroundColor: `${accent}18` },
                  categoryOverridesSort && { opacity: 0.5 },
                ]}>
                <ThemedText
                  style={[
                    styles.sortPillText,
                    { color: textMuted },
                    active && { color: accent },
                    dimmed && { color: textMuted },
                  ]}>
                  {opt.label}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      {isLoading ? (
        // Loading skeletons
        <View style={styles.skeletonContainer}>
          {viewMode === 'list'
            ? Array.from({ length: 5 }).map((_, i) => (
                <SkeletonListCard key={i} index={i} />
              ))
            : Array.from({ length: 3 }).map((_, i) => (
                <View key={i} style={styles.gridRow}>
                  <SkeletonGridCard index={i * 2} />
                  <SkeletonGridCard index={i * 2 + 1} />
                </View>
              ))}
        </View>
      ) : error ? (
        // Error state
        <View style={styles.centerState}>
          <ThemedText style={styles.stateTitle}>Something went wrong</ThemedText>
          <ThemedText style={[styles.stateBody, { color: textMuted }]}>{error}</ThemedText>
          <MotionPressable
            onPress={() => setMovies([])}
            style={[styles.retryBtn, { backgroundColor: surfaceMuted, borderColor: border }]}>
            <ThemedText style={[styles.retryText, { color: accent }]}>Retry</ThemedText>
          </MotionPressable>
        </View>
      ) : isEmpty ? (
        // Empty state
        <View style={styles.centerState}>
          <ThemedText style={styles.stateEmoji}>🎬</ThemedText>
          <ThemedText style={styles.stateTitle}>No films found</ThemedText>
          <ThemedText style={[styles.stateBody, { color: textMuted }]}>
            Try a different genre or sort order.
          </ThemedText>
        </View>
      ) : viewMode === 'list' ? (
        <FlatList
          ref={listRef}
          data={movies}
          keyExtractor={(item) => item.id}
          renderItem={renderListItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={renderFooter}
        />
      ) : (
        <FlatList
          ref={listRef as React.RefObject<FlatList<[Movie, Movie | null]>>}
          data={gridPairs}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderGridRow}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={renderFooter}
        />
      )}
    </Animated.View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  headerBtn: {
    width: 38, height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnText: { fontSize: 16 },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  viewToggle: { flexDirection: 'row', gap: 4 },
  toggleBtn: {
    width: 36, height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleIcon: { fontSize: 14 },

  // Category badge
  categoryBadgeRow: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  categoryBadgeLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  categoryBadgeClose: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadgeCloseText: {
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 13,
  },

  // Genre chips
  genreRow: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 8,
    flexDirection: 'row',
  },
  genreChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  genreChipText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Sort row
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 12,
  },
  countLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  sortPills: { flexDirection: 'row', gap: 6 },
  sortPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  sortPillText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // List card (Cinematic Option B)
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  listCard: {
    height: 140,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  listGradientLeft: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11,13,18,0.55)',
  },
  listPosterThumb: {
    position: 'absolute',
    right: 14,
    top: '50%',
    marginTop: -38,
    width: 52,
    height: 76,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  listInfo: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 80,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 4,
    // Text shadow for readability over backdrop
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  listMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'nowrap',
  },
  listMetaText: { fontSize: 11, fontWeight: '600' },
  listMetaDot: { fontSize: 11 },
  listRatingBadge: {
    position: 'absolute',
    top: 10,
    left: 12,
    backgroundColor: 'rgba(11,13,18,0.75)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(245,196,81,0.3)',
  },
  listRatingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F5C451',
  },

  // Grid card (Poster Option A)
  gridContent: {
    paddingHorizontal: POSTER_H_PAD,
    paddingBottom: 40,
    gap: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: POSTER_COL_GAP,
  },
  gridCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  gridPoster: {
    width: '100%',
    aspectRatio: 2 / 3,
  },
  gridRatingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(11,13,18,0.8)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(245,196,81,0.3)',
  },
  gridRatingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F5C451',
  },
  gridMeta: {
    padding: 10,
    gap: 2,
  },
  gridTitle: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  gridYear: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Skeleton
  skeletonContainer: {
    paddingHorizontal: 20,
    gap: 12,
    paddingTop: 4,
  },
  skeletonBar: {
    borderRadius: 6,
  },

  // Center states (error / empty)
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 10,
  },
  stateEmoji: { fontSize: 40, marginBottom: 4 },
  stateTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  stateBody: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  retryText: { fontSize: 13, fontWeight: '700' },

  // Footer loader
  footerLoader: {
    paddingVertical: 24,
    alignItems: 'center',
  },
});
