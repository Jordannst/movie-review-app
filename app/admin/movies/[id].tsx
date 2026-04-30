import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { type ReactElement, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdminGuard } from '@/components/admin/admin-guard';
import { MovieForm } from '@/components/admin/movie-form';
import { ThemedText } from '@/components/themed-text';
import { Award, Movie } from '@/data/types';
import { type MovieInput, updateMovie } from '@/services/admin-movies';
import { getAwardsForMovie } from '@/services/awards';
import { getMovieById } from '@/services/movies';

const BG = '#0B0D12';
const SURFACE = '#141828';
const BORDER = '#1E2234';
const TEXT_PRIMARY = '#F5F7FA';
const TEXT_MUTED = '#8E9BB0';
const YELLOW = '#F5C451';

export default function EditMovieScreen(): ReactElement {
  return (
    <AdminGuard>
      <Edit />
    </AdminGuard>
  );
}

function Edit(): ReactElement {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : undefined;

  const [movie, setMovie] = useState<Movie | null>(null);
  const [awards, setAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    let cancelled = false;
    Promise.all([getMovieById(id), getAwardsForMovie(id)])
      .then(([m, aw]) => {
        if (cancelled) return;
        if (m) {
          setMovie(m);
          setAwards(aw);
        } else {
          setNotFound(true);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        Alert.alert(
          'Failed to load',
          err instanceof Error ? err.message : 'Unknown error'
        );
        setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleSubmit(input: MovieInput): Promise<void> {
    if (!id) return;
    await updateMovie(id, input);
    router.back();
  }

  if (loading) {
    return (
      <View style={styles.statusScreen}>
        <ActivityIndicator color={YELLOW} />
      </View>
    );
  }

  if (notFound || !movie) {
    return (
      <View style={styles.statusScreen}>
        <SafeAreaView edges={['top']} style={styles.flex}>
          <View style={styles.statusHeader}>
            <Pressable onPress={() => router.back()} hitSlop={12} style={styles.headerBtn}>
              <Ionicons name="close" size={22} color={TEXT_PRIMARY} />
            </Pressable>
          </View>
          <View style={styles.statusBody}>
            <View style={styles.iconWrap}>
              <Ionicons name="alert-circle-outline" size={32} color={TEXT_MUTED} />
            </View>
            <ThemedText style={styles.statusTitle}>Movie not found</ThemedText>
            <ThemedText style={styles.statusDesc}>
              {id
                ? `No movie exists with id "${id}". It may have been deleted.`
                : 'Missing movie id in the route.'}
            </ThemedText>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.backBtn,
                pressed && styles.backBtnPressed,
              ]}>
              <ThemedText style={styles.backBtnText}>Go back</ThemedText>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Map Movie → Partial<MovieInput> for form initial values.
  // Note: averageRating/reviewCount are intentionally omitted — those are derived
  // by the database/triggers, not editable by admins.
  const initial: Partial<MovieInput> = {
    id: movie.id,
    title: movie.title,
    tagline: movie.tagline,
    year: movie.year,
    runtimeMinutes: movie.runtimeMinutes,
    genres: movie.genres,
    director: movie.director,
    synopsis: movie.synopsis,
    posterUrl: movie.posterUrl,
    backdropUrl: movie.backdropUrl,
    isFeatured: movie.isFeatured,
  };

  // Map Award[] → AwardInput[] (drop id/movieId; coerce null category to '')
  const initialAwards = awards.map((a) => ({
    awardName:    a.awardName,
    organization: a.organization,
    year:         a.year,
    category:     a.category ?? '',
    isWinner:     a.isWinner,
  }));

  return (
    <MovieForm
      initial={initial}
      initialAwards={initialAwards}
      submitLabel="Save Changes"
      lockId
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  statusScreen: { flex: 1, backgroundColor: BG },

  statusHeader: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  statusBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    gap: 12,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: TEXT_PRIMARY,
  },
  statusDesc: {
    fontSize: 13,
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 19,
  },
  backBtn: {
    marginTop: 12,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(245,196,81,0.4)',
    backgroundColor: 'rgba(245,196,81,0.1)',
  },
  backBtnPressed: {
    backgroundColor: 'rgba(245,196,81,0.2)',
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: YELLOW,
    letterSpacing: 0.3,
  },
});
