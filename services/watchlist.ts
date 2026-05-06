import { Movie } from '@/data/types';
import { supabase } from '@/lib/supabase';
import { toMovie } from '@/services/movies';

export type WatchlistMovie = {
  movie: Movie;
  addedAt: string;
};

type WatchlistRow = {
  added_at?: string;
  movies?: Record<string, unknown> | Record<string, unknown>[] | null;
};

function getEmbeddedMovie(row: WatchlistRow): Record<string, unknown> | null {
  if (!row.movies) return null;
  return Array.isArray(row.movies) ? row.movies[0] ?? null : row.movies;
}

export async function isMovieInWatchlist(userId: string, movieId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('watchlist')
    .select('id')
    .eq('user_id', userId)
    .eq('movie_id', movieId)
    .maybeSingle();

  if (error) throw new Error(`isMovieInWatchlist: ${error.message}`);
  return Boolean(data);
}

export async function addToWatchlist(userId: string, movieId: string): Promise<void> {
  const { error } = await supabase
    .from('watchlist')
    .upsert(
      { user_id: userId, movie_id: movieId },
      { onConflict: 'user_id,movie_id', ignoreDuplicates: true }
    );

  if (error) throw new Error(`addToWatchlist: ${error.message}`);
}

export async function removeFromWatchlist(userId: string, movieId: string): Promise<void> {
  const { error } = await supabase
    .from('watchlist')
    .delete()
    .eq('user_id', userId)
    .eq('movie_id', movieId);

  if (error) throw new Error(`removeFromWatchlist: ${error.message}`);
}

export async function getWatchlistMovies(userId: string): Promise<WatchlistMovie[]> {
  const { data, error } = await supabase
    .from('watchlist')
    .select('added_at, movies(*)')
    .eq('user_id', userId)
    .order('added_at', { ascending: false });

  if (error) throw new Error(`getWatchlistMovies: ${error.message}`);

  return ((data ?? []) as WatchlistRow[])
    .map((row) => {
      const movieRow = getEmbeddedMovie(row);
      if (!movieRow) return null;

      return {
        movie: toMovie(movieRow),
        addedAt: row.added_at ?? '',
      };
    })
    .filter((item): item is WatchlistMovie => Boolean(item));
}
