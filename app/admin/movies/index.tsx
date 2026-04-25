import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { type ReactElement, useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    StyleSheet,
    Switch,
    TextInput,
    View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdminGuard } from '@/components/admin/admin-guard';
import { ThemedText } from '@/components/themed-text';
import { Movie } from '@/data/types';
import { deleteMovie, toggleFeatured } from '@/services/admin-movies';
import { getMovies } from '@/services/movies';

const BG = '#0B0D12';
const SURFACE = '#141828';
const SURFACE_2 = '#1A1F2E';
const BORDER = '#1E2234';
const DIM = '#5A607A';
const TEXT_PRIMARY = '#F5F7FA';
const TEXT_MUTED = '#8E9BB0';
const YELLOW = '#F5C451';
const DANGER = '#F04452';

export default function AdminMoviesListScreen(): ReactElement {
  return (
    <AdminGuard>
      <List />
    </AdminGuard>
  );
}

function List(): ReactElement {
  const router = useRouter();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Stale-while-revalidate: silent refetch on focus, full spinner only on first mount.
  // Cancellation flag prevents stale responses from overwriting newer state after blur.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void getMovies()
        .then((all) => {
          if (!cancelled) setMovies(all);
        })
        .catch((err) => {
          if (!cancelled) {
            Alert.alert('Failed to load', err instanceof Error ? err.message : 'Unknown error');
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [])
  );

  // Pull-to-refresh: own loader independent of focus loader.
  async function handleRefresh() {
    setRefreshing(true);
    try {
      const all = await getMovies();
      setMovies(all);
    } catch (err) {
      Alert.alert('Failed to load', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setRefreshing(false);
    }
  }

  const filtered = movies.filter(
    (m) => !query.trim() || m.title.toLowerCase().includes(query.trim().toLowerCase())
  );

  async function handleToggleFeatured(movie: Movie) {
    const next = !movie.isFeatured;
    // Optimistic update
    setMovies((prev) =>
      prev.map((m) => (m.id === movie.id ? { ...m, isFeatured: next } : m))
    );
    try {
      await toggleFeatured(movie.id, next);
    } catch (err) {
      // Rollback
      setMovies((prev) =>
        prev.map((m) => (m.id === movie.id ? { ...m, isFeatured: !next } : m))
      );
      Alert.alert('Failed', err instanceof Error ? err.message : 'Unknown error');
    }
  }

  function confirmDelete(movie: Movie) {
    Alert.alert(
      `Delete "${movie.title}"?`,
      'This will permanently remove the movie and all its reviews. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMovie(movie.id);
              setMovies((prev) => prev.filter((m) => m.id !== movie.id));
            } catch (err) {
              Alert.alert('Delete failed', err instanceof Error ? err.message : 'Unknown error');
            }
          },
        },
      ]
    );
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={22} color={TEXT_PRIMARY} />
          </Pressable>
          <View style={styles.headerCenter}>
            <ThemedText style={styles.headerTitle}>Manage Movies</ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              {loading ? 'Loading…' : `${movies.length} movies`}
            </ThemedText>
          </View>
          <Pressable
            onPress={() => router.push('/admin/movies/new' as never)}
            hitSlop={12}
            style={({ pressed }) => [
              styles.addBtn,
              pressed && styles.addBtnPressed,
            ]}>
            <Ionicons name="add" size={18} color={YELLOW} />
            <ThemedText style={styles.addBtnText}>New</ThemedText>
          </Pressable>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color={DIM} style={styles.searchIcon} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by title…"
            placeholderTextColor="#3A4060"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.searchInput}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={DIM} />
            </Pressable>
          ) : null}
        </View>

        {/* List */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={YELLOW} />
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons
              name={query ? 'search' : 'film-outline'}
              size={36}
              color={DIM}
            />
            <ThemedText style={styles.emptyTitle}>
              {query ? 'No matches' : 'No movies yet'}
            </ThemedText>
            <ThemedText style={styles.emptyDesc}>
              {query
                ? `Nothing matches "${query.trim()}".`
                : 'Tap "+ New" to add your first movie.'}
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(m) => m.id}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            contentContainerStyle={styles.listContent}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeIn.duration(220).delay(index * 30)}>
                <MovieRow
                  movie={item}
                  onToggleFeatured={() => handleToggleFeatured(item)}
                  onEdit={() => router.push(`/admin/movies/${item.id}` as never)}
                  onDelete={() => confirmDelete(item)}
                />
              </Animated.View>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

// ── Row ────────────────────────────────────────────────────────

type MovieRowProps = {
  movie: Movie;
  onToggleFeatured: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

function MovieRow({ movie, onToggleFeatured, onEdit, onDelete }: MovieRowProps): ReactElement {
  return (
    <View style={styles.row}>
      {movie.posterUrl ? (
        <Image
          source={{ uri: movie.posterUrl }}
          style={styles.poster}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={[styles.poster, styles.posterPlaceholder]}>
          <Ionicons name="film-outline" size={20} color={DIM} />
        </View>
      )}

      <View style={styles.rowText}>
        <ThemedText style={styles.rowTitle} numberOfLines={1}>
          {movie.title}
        </ThemedText>
        <ThemedText style={styles.rowMeta} numberOfLines={1}>
          {movie.year}
          {movie.genres.length > 0 ? ` · ${movie.genres.slice(0, 2).join(', ')}` : ''}
        </ThemedText>
        <View style={styles.rowStats}>
          <StatPill icon="star" value={movie.averageRating.toFixed(1)} />
          <StatPill icon="chatbubble-outline" value={String(movie.reviewCount)} />
        </View>
      </View>

      <View style={styles.actions}>
        {/* Featured switch */}
        <View style={styles.featuredWrap}>
          <Switch
            value={!!movie.isFeatured}
            onValueChange={onToggleFeatured}
            trackColor={{ false: BORDER, true: 'rgba(245,196,81,0.4)' }}
            thumbColor={movie.isFeatured ? YELLOW : '#9CA3AF'}
            ios_backgroundColor={BORDER}
          />
          <ThemedText style={styles.featuredLabel}>FEATURED</ThemedText>
        </View>

        {/* Edit */}
        <Pressable
          onPress={onEdit}
          hitSlop={8}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}>
          <Ionicons name="pencil" size={16} color={YELLOW} />
        </Pressable>

        {/* Delete */}
        <Pressable
          onPress={onDelete}
          hitSlop={8}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressedDanger]}>
          <Ionicons name="trash-outline" size={16} color={DANGER} />
        </Pressable>
      </View>
    </View>
  );
}

function StatPill({
  icon,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
}): ReactElement {
  return (
    <View style={styles.statPill}>
      <Ionicons name={icon} size={10} color={DIM} />
      <ThemedText style={styles.statPillText}>{value}</ThemedText>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: DIM,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(245,196,81,0.4)',
    backgroundColor: 'rgba(245,196,81,0.1)',
  },
  addBtnPressed: {
    backgroundColor: 'rgba(245,196,81,0.2)',
  },
  addBtnText: { fontSize: 12, fontWeight: '800', color: YELLOW, letterSpacing: 0.3 },

  // Search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE,
    gap: 8,
  },
  searchIcon: {},
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: TEXT_PRIMARY,
    height: 32,
  },

  // Empty state
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginTop: 4,
  },
  emptyDesc: {
    fontSize: 13,
    color: DIM,
    textAlign: 'center',
    lineHeight: 19,
  },

  // List
  listContent: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 120 },
  separator: { height: 10 },

  // Row
  row: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE,
    gap: 12,
  },
  poster: {
    width: 50,
    height: 75,
    borderRadius: 8,
    backgroundColor: SURFACE_2,
  },
  posterPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, justifyContent: 'space-between' },
  rowTitle: { fontSize: 14, fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: 0.1 },
  rowMeta: { fontSize: 11, color: TEXT_MUTED, marginTop: 2 },
  rowStats: { flexDirection: 'row', gap: 6, marginTop: 6 },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: SURFACE_2,
  },
  statPillText: { fontSize: 10, fontWeight: '700', color: TEXT_MUTED },

  // Actions column
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featuredWrap: {
    alignItems: 'center',
    gap: 2,
    marginRight: 4,
  },
  featuredLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: DIM,
    letterSpacing: 0.5,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE_2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnPressed: {
    backgroundColor: 'rgba(245,196,81,0.12)',
    borderColor: 'rgba(245,196,81,0.4)',
  },
  iconBtnPressedDanger: {
    backgroundColor: 'rgba(240,68,82,0.12)',
    borderColor: 'rgba(240,68,82,0.4)',
  },
});
