import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState, type ReactElement } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MovieCard } from '@/components/movie-card';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import { Movie } from '@/data/types';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getWatchlistMovies } from '@/services/watchlist';

const ENTER_DURATION = 260;
const ITEM_STAGGER = 45;

function getEnterAnimation(delay = 0) {
  return FadeInDown.duration(ENTER_DURATION)
    .delay(delay)
    .easing(Easing.out(Easing.cubic))
    .withInitialValues({ opacity: 0, transform: [{ translateY: 10 }] });
}

export default function WatchlistScreen(): ReactElement {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);
  const accent = useThemeColor({}, 'accent');
  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const textMuted = useThemeColor({}, 'textMuted');

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadWatchlist() {
        if (isAuthLoading) return;

        if (!user) {
          setMovies([]);
          setError(null);
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        setError(null);

        try {
          const rows = await getWatchlistMovies(user.id);
          if (!isActive) return;
          setMovies(rows.map((row) => row.movie));
        } catch (loadError) {
          if (!isActive) return;
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Failed to load your watchlist.'
          );
        } finally {
          if (isActive) setIsLoading(false);
        }
      }

      void loadWatchlist();

      return () => {
        isActive = false;
      };
    }, [isAuthLoading, reloadVersion, user])
  );

  function handleRetry(): void {
    setReloadVersion((current) => current + 1);
  }

  function handleOpenMovie(movieId: string): void {
    router.push(`/movies/${movieId}`);
  }

  function handleBrowseMovies(): void {
    router.push('/movies');
  }

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            accessibilityLabel="Go back"
            accessibilityRole="button"
            onPress={() => router.back()}
            style={[styles.headerBtn, { borderColor: border, backgroundColor: surface }]}>
            <Ionicons name="chevron-back" size={20} color={accent} />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <ThemedText style={[styles.kicker, { color: accent }]}>Watch later</ThemedText>
            <ThemedText type="title">Your Watchlist</ThemedText>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={accent} />
            <ThemedText style={[styles.centerCopy, { color: textMuted }]}>
              Loading saved movies
            </ThemedText>
          </View>
        ) : error ? (
          <View style={[styles.statusCard, { borderColor: border, backgroundColor: surface }]}>
            <ThemedText type="defaultSemiBold">Couldn&apos;t load watchlist</ThemedText>
            <ThemedText style={[styles.statusCopy, { color: textMuted }]}>{error}</ThemedText>
            <PrimaryButton label="Retry" onPress={handleRetry} />
          </View>
        ) : movies.length === 0 ? (
          <View style={[styles.statusCard, { borderColor: border, backgroundColor: surface }]}>
            <Ionicons name="bookmark-outline" size={28} color={accent} />
            <ThemedText type="defaultSemiBold">No saved movies yet</ThemedText>
            <ThemedText style={[styles.statusCopy, { color: textMuted }]}>
              Save films from a movie detail page and they will appear here.
            </ThemedText>
            <PrimaryButton label="Browse Movies" onPress={handleBrowseMovies} />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scroll}
            contentContainerStyle={styles.listContent}>
            <View style={styles.countRow}>
              <ThemedText style={[styles.countText, { color: textMuted }]}>
                {movies.length} saved movie{movies.length === 1 ? '' : 's'}
              </ThemedText>
            </View>
            {movies.map((movie, index) => (
              <Animated.View
                key={movie.id}
                entering={getEnterAnimation(80 + index * ITEM_STAGGER)}>
                <MovieCard movie={movie} onPress={() => handleOpenMovie(movie.id)} />
              </Animated.View>
            ))}
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
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    gap: 3,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    lineHeight: 14,
    textTransform: 'uppercase',
  },
  scroll: {
    flex: 1,
  },
  listContent: {
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 36,
  },
  countRow: {
    paddingBottom: 2,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  centerCopy: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusCard: {
    gap: 12,
    margin: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  statusCopy: {
    fontSize: 14,
    lineHeight: 20,
  },
});
