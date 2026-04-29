import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { type ReactElement, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FeaturedHero } from '@/components/featured-hero';
import { MotionPressable } from '@/components/motion-pressable';
import { MovieCard } from '@/components/movie-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { featuredMovie, movies } from '@/data/movies';
import { useThemeColor } from '@/hooks/use-theme-color';

const SECTION_ENTER_DURATION = 280;
const ITEM_STAGGER = 45;
const DISCOVER_CHIPS = ['Trending', 'New', 'Awarded'] as const;

function getEnterAnimation(delay = 0) {
  return FadeInDown.duration(SECTION_ENTER_DURATION)
    .delay(delay)
    .easing(Easing.out(Easing.quad))
    .withInitialValues({
      opacity: 0,
      transform: [{ translateY: 10 }],
    });
}

export default function HomeScreen(): ReactElement {
  const router = useRouter();

  const background = useThemeColor({}, 'background');
  const surface = useThemeColor({}, 'surface');
  const surfaceMuted = useThemeColor({}, 'surfaceMuted');
  const border = useThemeColor({}, 'border');
  const accent = '#e8b84b'; // 🔥 FIX GOLD COLOR
  const textMuted = useThemeColor({}, 'textMuted');
  const text = useThemeColor({}, 'text');

  const [query, setQuery] = useState('');

  const normalizedQuery = query.trim().toLowerCase();

  const filteredMovies = normalizedQuery
    ? movies.filter((movie) => {
        const searchFields = [
          movie.title,
          movie.tagline,
          movie.director,
          movie.synopsis,
          movie.year.toString(),
          ...movie.genres,
        ];

        return searchFields.some((field) =>
          field.toLowerCase().includes(normalizedQuery)
        );
      })
    : movies;

  const movieCountLabel = `${filteredMovies.length} movie${
    filteredMovies.length === 1 ? '' : 's'
  }`;

  function handleOpenMovie(movieId: string): void {
    router.push(`/movies/${movieId}`);
  }

  // 🔥 FIX NAVIGASI DISCOVER
  function handleDiscoverPress(category: string): void {
    router.push({
      pathname: '/(tabs)/DiscoverScreen',
      params: { category: category.toLowerCase() },
    });
  }

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          style={{ backgroundColor: background }}
        >
          {/* HEADER */}
          <Animated.View entering={getEnterAnimation(0)} style={styles.header}>
            <View style={styles.headerCopy}>
              <ThemedText style={[styles.kicker, { color: accent }]}>
                Tonight&apos;s Discover
              </ThemedText>

              <ThemedText type="title" style={styles.headerTitle}>
                Find the next movie worth your night.
              </ThemedText>

              <ThemedText style={[styles.subtitle, { color: textMuted }]}>
                Start with the featured spotlight, then browse movies and open any title.
              </ThemedText>
            </View>

            {/* SEARCH */}
            <View style={[styles.searchBar, { backgroundColor: surface, borderColor: border }]}>
              <View style={[styles.searchIconWrap, { backgroundColor: surfaceMuted }]}>
                <MaterialIcons color={accent} name="search" size={18} />
              </View>

              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search movies..."
                placeholderTextColor={textMuted}
                style={[styles.searchInput, { color: text }]}
              />
            </View>

            {/* CHIPS */}
            <View style={styles.chipRow}>
              {DISCOVER_CHIPS.map((chip, index) => {
                const isActive = index === 0;

                return (
                  <MotionPressable
                    key={chip}
                    onPress={() => handleDiscoverPress(chip)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: surface,
                        borderColor: isActive ? accent : border,
                      },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.chipText,
                        isActive ? { color: accent } : null,
                      ]}
                    >
                      {chip}
                    </ThemedText>
                  </MotionPressable>
                );
              })}
            </View>
          </Animated.View>

          {/* FEATURED */}
          {!normalizedQuery && (
            <Animated.View entering={getEnterAnimation(70)}>
              <FeaturedHero
                movie={featuredMovie}
                actionLabel="View Details"
                onActionPress={() => handleOpenMovie(featuredMovie.id)}
              />
            </Animated.View>
          )}

          {/* SECTION HEADER */}
          <Animated.View entering={getEnterAnimation(120)} style={styles.sectionHeader}>
            <View>
              <ThemedText style={styles.sectionLabel}>Now showing</ThemedText>
              <ThemedText type="subtitle">
                {normalizedQuery
                  ? `Search results for "${query}"`
                  : 'Browse popular picks'}
              </ThemedText>
            </View>

            <ThemedText style={[styles.sectionMeta, { color: textMuted }]}>
              {movieCountLabel}
            </ThemedText>
          </Animated.View>

          {/* MOVIE LIST */}
          {filteredMovies.length > 0 ? (
            <View style={styles.list}>
              {filteredMovies.map((movie, index) => (
                <Animated.View
                  key={movie.id}
                  entering={getEnterAnimation(170 + index * ITEM_STAGGER)}
                >
                  <MovieCard
                    movie={movie}
                    onPress={() => handleOpenMovie(movie.id)}
                  />
                </Animated.View>
              ))}
            </View>
          ) : (
            <View style={[styles.emptyState, { backgroundColor: surface, borderColor: border }]}>
              <ThemedText type="subtitle">No movies found</ThemedText>
              <ThemedText style={[styles.emptyStateText, { color: textMuted }]}>
                Try another keyword.
              </ThemedText>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },

  content: {
    gap: 22,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },

  header: { gap: 16 },

  headerCopy: { gap: 10 },

  kicker: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  headerTitle: {
    lineHeight: 38,
  },

  subtitle: {
    fontSize: 15,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },

  searchIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },

  searchInput: {
    flex: 1,
    fontSize: 15,
  },

  chipRow: {
    flexDirection: 'row',
    gap: 10,
  },

  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
  },

  sectionMeta: {
    fontSize: 13,
  },

  list: {
    gap: 14,
  },

  emptyState: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },

  emptyStateText: {
    fontSize: 14,
  },
});