import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { type ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdminGuard } from '@/components/admin/admin-guard';
import { ThemedText } from '@/components/themed-text';
import {
    type AdminReviewRow,
    adminDeleteReview,
    getAllReviewsPaginated,
} from '@/services/admin-reviews';

const BG = '#0B0D12';
const SURFACE = '#141828';
const SURFACE_2 = '#1A1F2E';
const BORDER = '#1E2234';
const DIM = '#5A607A';
const TEXT_PRIMARY = '#F5F7FA';
const TEXT_MUTED = '#8E9BB0';
const YELLOW = '#F5C451';
const DANGER = '#F04452';
const SPOILER = '#E08C3D';

const PAGE_SIZE = 20;

export default function AdminReviewsScreen(): ReactElement {
  return (
    <AdminGuard>
      <Moderation />
    </AdminGuard>
  );
}

function Moderation(): ReactElement {
  const router = useRouter();
  const [rows, setRows] = useState<AdminReviewRow[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filter input (raw, what user types) + debounced applied filter.
  const [filterInput, setFilterInput] = useState('');
  const [appliedFilter, setAppliedFilter] = useState('');

  // Generation counter: any "fresh page-0" fetch (focus / refresh / retry / filter change)
  // bumps it. In-flight calls compare their captured generation against current to detect
  // staleness — prevents loadMore from appending pages that belong to a previous
  // dataset after a concurrent refresh.
  const genRef = useRef(0);

  // Debounce the filter input so we don't fetch on every keystroke.
  useEffect(() => {
    if (filterInput.trim() === appliedFilter) return;
    const t = setTimeout(() => setAppliedFilter(filterInput.trim()), 300);
    return () => clearTimeout(t);
  }, [filterInput, appliedFilter]);

  // Unified page-0 loader. Used by focus, filter change, refresh, and retry.
  // Stale-while-revalidate: keeps existing rows visible during refetch — only
  // toggles the full-screen spinner if no data has loaded yet.
  const loadFirstPage = useCallback(
    async (filter: string, opts: { showSpinner?: boolean } = {}): Promise<void> => {
      const myGen = ++genRef.current;
      if (opts.showSpinner) setLoading(true);
      try {
        const result = await getAllReviewsPaginated(0, PAGE_SIZE, filter || undefined);
        if (myGen !== genRef.current) return;
        setRows(result.reviews);
        setTotalCount(result.totalCount);
        setHasMore(result.hasMore);
        setPage(1);
        setLoadError(null);
      } catch (err) {
        if (myGen !== genRef.current) return;
        const msg = err instanceof Error ? err.message : 'Unknown error';
        if (opts.showSpinner) setLoadError(msg);
        else Alert.alert('Failed to load', msg);
      } finally {
        if (myGen === genRef.current && opts.showSpinner) setLoading(false);
      }
    },
    []
  );

  // Reload page 0 on focus AND whenever the applied filter changes.
  useFocusEffect(
    useCallback(() => {
      // Show spinner only when there's no data yet (initial load); otherwise stale-while-revalidate.
      void loadFirstPage(appliedFilter, { showSpinner: rows.length === 0 });
      return () => {
        // On blur, bump generation so any in-flight call becomes stale and won't setState.
        genRef.current++;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appliedFilter, loadFirstPage])
  );

  async function handleRefresh() {
    setRefreshing(true);
    const myGen = ++genRef.current;
    try {
      const result = await getAllReviewsPaginated(0, PAGE_SIZE, appliedFilter || undefined);
      if (myGen !== genRef.current) return;
      setRows(result.reviews);
      setTotalCount(result.totalCount);
      setHasMore(result.hasMore);
      setPage(1);
      setLoadError(null);
    } catch (err) {
      if (myGen !== genRef.current) return;
      Alert.alert('Failed to load', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setRefreshing(false);
    }
  }

  async function handleRetry() {
    await loadFirstPage(appliedFilter, { showSpinner: true });
  }

  async function loadMore() {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    const myGen = genRef.current; // do NOT bump — this is a continuation, not a fresh load
    try {
      const result = await getAllReviewsPaginated(page, PAGE_SIZE, appliedFilter || undefined);
      if (myGen !== genRef.current) return; // a refresh / filter change happened mid-flight; discard
      setRows((prev) => [...prev, ...result.reviews]);
      setHasMore(result.hasMore);
      setPage((p) => p + 1);
    } catch (err) {
      if (myGen !== genRef.current) return;
      Alert.alert('Failed to load more', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoadingMore(false);
    }
  }

  function confirmDelete(row: AdminReviewRow) {
    Alert.alert(
      'Delete this review?',
      `From ${row.authorName} on "${row.movieTitle}". This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminDeleteReview(row.id);
              setRows((prev) => prev.filter((r) => r.id !== row.id));
              setTotalCount((c) => (c !== null ? Math.max(0, c - 1) : c));
            } catch (err) {
              Alert.alert(
                'Delete failed',
                err instanceof Error ? err.message : 'Unknown error'
              );
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
            <ThemedText style={styles.headerTitle}>Moderate Reviews</ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              {loading
                ? 'Loading…'
                : totalCount !== null
                  ? `${totalCount} review${totalCount === 1 ? '' : 's'}${appliedFilter ? ' • filtered' : ''}`
                  : `${rows.length} loaded`}
            </ThemedText>
          </View>
          <View style={styles.headerBtn} />
        </View>

        {/* Filter input */}
        <View style={styles.filterWrap}>
          <View style={styles.filterInputWrap}>
            <Ionicons name="search" size={16} color={DIM} />
            <TextInput
              value={filterInput}
              onChangeText={setFilterInput}
              placeholder="Filter by movie title…"
              placeholderTextColor={DIM}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.filterInput}
              returnKeyType="search"
            />
            {filterInput.length > 0 ? (
              <Pressable onPress={() => setFilterInput('')} hitSlop={10}>
                <Ionicons name="close-circle" size={16} color={DIM} />
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* Body */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={YELLOW} />
          </View>
        ) : loadError && rows.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="cloud-offline-outline" size={36} color={DANGER} />
            <ThemedText style={styles.emptyTitle}>Failed to load</ThemedText>
            <ThemedText style={styles.emptyDesc}>{loadError}</ThemedText>
            <Pressable
              onPress={handleRetry}
              style={({ pressed }) => [
                styles.retryBtn,
                pressed && styles.retryBtnPressed,
              ]}>
              <Ionicons name="refresh" size={14} color={YELLOW} />
              <ThemedText style={styles.retryBtnText}>Try again</ThemedText>
            </Pressable>
          </View>
        ) : rows.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons
              name={appliedFilter ? 'search-outline' : 'chatbubbles-outline'}
              size={36}
              color={DIM}
            />
            <ThemedText style={styles.emptyTitle}>
              {appliedFilter ? 'No matching reviews' : 'No reviews yet'}
            </ThemedText>
            <ThemedText style={styles.emptyDesc}>
              {appliedFilter
                ? `Nothing matches "${appliedFilter}". Try a different movie title.`
                : 'Reviews from users will appear here for moderation.'}
            </ThemedText>
            {appliedFilter ? (
              <Pressable
                onPress={() => setFilterInput('')}
                style={({ pressed }) => [
                  styles.retryBtn,
                  pressed && styles.retryBtnPressed,
                ]}>
                <Ionicons name="close" size={14} color={YELLOW} />
                <ThemedText style={styles.retryBtnText}>Clear filter</ThemedText>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <FlatList
            data={rows}
            keyExtractor={(r) => r.id}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            onEndReached={loadMore}
            onEndReachedThreshold={0.6}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.footer}>
                  <ActivityIndicator color={YELLOW} size="small" />
                </View>
              ) : !hasMore && rows.length > PAGE_SIZE ? (
                <View style={styles.footer}>
                  <ThemedText style={styles.footerText}>End of list</ThemedText>
                </View>
              ) : null
            }
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeIn.duration(220).delay(Math.min(index, 8) * 30)}>
                <ReviewCard row={item} onDelete={() => confirmDelete(item)} />
              </Animated.View>
            )}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

// ── Card ───────────────────────────────────────────────────────

type ReviewCardProps = {
  row: AdminReviewRow;
  onDelete: () => void;
};

function ReviewCard({ row, onDelete }: ReviewCardProps): ReactElement {
  return (
    <View style={styles.row}>
      {/* Top row: author + movie pill */}
      <View style={styles.rowHead}>
        <View style={styles.authorWrap}>
          <View style={styles.avatar}>
            <ThemedText style={styles.avatarText}>
              {row.authorName.slice(0, 1).toUpperCase()}
            </ThemedText>
          </View>
          <View style={styles.authorMeta}>
            <ThemedText style={styles.author} numberOfLines={1}>
              {row.authorName}
            </ThemedText>
            <ThemedText style={styles.date}>{formatDate(row.createdAt)}</ThemedText>
          </View>
        </View>
        <View style={styles.moviePill}>
          <Ionicons name="film-outline" size={11} color={YELLOW} />
          <ThemedText style={styles.movieText} numberOfLines={1}>
            {row.movieTitle}
          </ThemedText>
        </View>
      </View>

      {/* Rating stars */}
      <View style={styles.ratingRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Ionicons
            key={n}
            name={n <= row.rating ? 'star' : 'star-outline'}
            size={12}
            color={n <= row.rating ? YELLOW : DIM}
          />
        ))}
        <ThemedText style={styles.ratingValue}>{row.rating}/5</ThemedText>
        {row.containsSpoilers ? (
          <View style={styles.spoilerBadge}>
            <Ionicons name="warning-outline" size={10} color={SPOILER} />
            <ThemedText style={styles.spoilerText}>SPOILERS</ThemedText>
          </View>
        ) : null}
      </View>

      {/* Title */}
      {row.title ? (
        <ThemedText style={styles.reviewTitle} numberOfLines={2}>
          {row.title}
        </ThemedText>
      ) : null}

      {/* Body */}
      {row.body ? (
        <ThemedText style={styles.body} numberOfLines={4}>
          {row.body}
        </ThemedText>
      ) : null}

      {/* Tags */}
      {row.tags && row.tags.length > 0 ? (
        <View style={styles.tagsRow}>
          {row.tags.slice(0, 4).map((t) => (
            <View key={t} style={styles.tagChip}>
              <ThemedText style={styles.tagText}>{t}</ThemedText>
            </View>
          ))}
          {row.tags.length > 4 ? (
            <ThemedText style={styles.tagOverflow}>+{row.tags.length - 4}</ThemedText>
          ) : null}
        </View>
      ) : null}

      {/* Footer: delete action */}
      <View style={styles.cardFooter}>
        <Pressable
          onPress={onDelete}
          hitSlop={6}
          style={({ pressed }) => [
            styles.deleteBtn,
            pressed && styles.deleteBtnPressed,
          ]}>
          <Ionicons name="trash-outline" size={14} color={DANGER} />
          <ThemedText style={styles.deleteText}>Delete review</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

// ── Helpers ────────────────────────────────────────────────────

function formatDate(iso: string): string {
  // Concise absolute format: "Apr 25, 2026"
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
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
  },

  // Filter
  filterWrap: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  filterInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE,
  },
  filterInput: {
    flex: 1,
    fontSize: 13,
    color: TEXT_PRIMARY,
    padding: 0,
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
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(245,196,81,0.4)',
    backgroundColor: 'rgba(245,196,81,0.1)',
  },
  retryBtnPressed: {
    backgroundColor: 'rgba(245,196,81,0.2)',
  },
  retryBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: YELLOW,
    letterSpacing: 0.3,
  },

  // List
  listContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 120 },
  separator: { height: 10 },
  footer: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  footerText: { fontSize: 11, color: DIM, fontWeight: '700', letterSpacing: 0.5 },

  // Row card
  row: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE,
    gap: 8,
  },
  rowHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  authorWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: SURFACE_2,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: YELLOW,
    letterSpacing: 0.3,
  },
  authorMeta: { flex: 1, minWidth: 0 },
  author: { fontSize: 13, fontWeight: '800', color: TEXT_PRIMARY },
  date: { fontSize: 10, color: DIM, marginTop: 1 },

  moviePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(245,196,81,0.3)',
    backgroundColor: 'rgba(245,196,81,0.08)',
    maxWidth: 160,
  },
  movieText: {
    fontSize: 10,
    fontWeight: '700',
    color: YELLOW,
    letterSpacing: 0.2,
    flexShrink: 1,
  },

  // Rating row
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  ratingValue: {
    fontSize: 11,
    fontWeight: '700',
    color: TEXT_MUTED,
    marginLeft: 4,
  },
  spoilerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(224,140,61,0.4)',
    backgroundColor: 'rgba(224,140,61,0.1)',
    marginLeft: 6,
  },
  spoilerText: {
    fontSize: 9,
    fontWeight: '800',
    color: SPOILER,
    letterSpacing: 0.5,
  },

  // Body
  reviewTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginTop: 2,
    letterSpacing: 0.1,
  },
  body: {
    fontSize: 12,
    lineHeight: 17,
    color: TEXT_MUTED,
  },

  // Tags
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
    alignItems: 'center',
  },
  tagChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: SURFACE_2,
  },
  tagText: { fontSize: 10, fontWeight: '700', color: TEXT_MUTED },
  tagOverflow: { fontSize: 10, fontWeight: '700', color: DIM, marginLeft: 2 },

  // Footer
  cardFooter: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(240,68,82,0.3)',
    backgroundColor: 'rgba(240,68,82,0.08)',
  },
  deleteBtnPressed: {
    backgroundColor: 'rgba(240,68,82,0.18)',
    borderColor: 'rgba(240,68,82,0.5)',
  },
  deleteText: {
    fontSize: 11,
    fontWeight: '800',
    color: DANGER,
    letterSpacing: 0.3,
  },
});
