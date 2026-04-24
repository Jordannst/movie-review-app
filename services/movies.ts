import { Movie } from '@/data/types';
import { supabase } from '@/lib/supabase';

/** Map Supabase snake_case row → camelCase Movie */
function toMovie(row: Record<string, unknown>): Movie {
  return {
    id:             row.id as string,
    title:          row.title as string,
    tagline:        row.tagline as string,
    year:           row.year as number,
    runtimeMinutes: row.runtime_minutes as number,
    genres:         row.genres as string[],
    director:       row.director as string,
    synopsis:       row.synopsis as string,
    posterUrl:      row.poster_url as string,
    backdropUrl:    row.backdrop_url as string,
    averageRating:  Number(row.average_rating),
    reviewCount:    row.review_count as number,
    isFeatured:     row.is_featured as boolean,
  };
}

/** Ambil semua film, diurutkan berdasarkan review_count desc */
export async function getMovies(): Promise<Movie[]> {
  const { data, error } = await supabase
    .from('movies')
    .select('*')
    .order('review_count', { ascending: false });

  if (error) throw new Error(`getMovies: ${error.message}`);
  return (data ?? []).map(toMovie);
}

/** Ambil satu film berdasarkan id (slug) */
export async function getMovieById(id: string): Promise<Movie | null> {
  const { data, error } = await supabase
    .from('movies')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // not found
    throw new Error(`getMovieById: ${error.message}`);
  }
  return data ? toMovie(data) : null;
}

/** Ambil film yang is_featured = true; fallback ke film dengan review_count tertinggi */
export async function getFeaturedMovie(): Promise<Movie | null> {
  const { data, error } = await supabase
    .from('movies')
    .select('*')
    .eq('is_featured', true)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`getFeaturedMovie: ${error.message}`);
  if (data) return toMovie(data);

  // fallback: ambil film pertama
  const { data: first, error: err2 } = await supabase
    .from('movies')
    .select('*')
    .order('review_count', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (err2) throw new Error(`getFeaturedMovie fallback: ${err2.message}`);
  return first ? toMovie(first) : null;
}

/**
 * Ambil daftar film featured untuk carousel "Featured Tonight".
 * Fallback ke top-rated kalau tidak ada film is_featured=true yang ditandai.
 */
export async function getFeaturedMovies(limit = 5): Promise<Movie[]> {
  const { data, error } = await supabase
    .from('movies')
    .select('*')
    .eq('is_featured', true)
    .order('average_rating', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`getFeaturedMovies: ${error.message}`);

  if (data && data.length > 0) {
    return data.map(toMovie);
  }

  // Fallback: top-rated movies
  const { data: fallback, error: fallbackError } = await supabase
    .from('movies')
    .select('*')
    .order('average_rating', { ascending: false })
    .limit(limit);

  if (fallbackError) throw new Error(`getFeaturedMovies fallback: ${fallbackError.message}`);
  return (fallback ?? []).map(toMovie);
}

export type MovieSortKey = 'rating' | 'year' | 'title';

/**
 * Dynamic discovery categories (distinct from static genres).
 * - `trending`  → sorted by review_count desc (most-discussed)
 * - `new`       → sorted by year desc (newest first)
 * - `awarded`   → filtered to average_rating >= AWARDED_THRESHOLD
 */
export type MovieCategory = 'trending' | 'new' | 'awarded';

export const AWARDED_THRESHOLD = 4.5;

export function getCategoryLabel(category: MovieCategory): string {
  switch (category) {
    case 'trending': return 'Trending Now';
    case 'new':      return 'New Releases';
    case 'awarded':  return 'Award-Winning Films';
  }
}

export type MoviesFilterParams = {
  genre?: string;           // undefined or 'All' = no filter
  sort?: MovieSortKey;      // default: 'rating' (ignored when category overrides)
  category?: MovieCategory; // dynamic discovery preset
  page?: number;            // 0-indexed
  pageSize?: number;        // default 12
};

export type MoviesPage = {
  movies: Movie[];
  totalCount: number;
  hasMore: boolean;
};

/** Ambil film dengan filter genre, kategori dinamis, sorting, dan pagination */
export async function getMoviesFiltered(
  params: MoviesFilterParams = {}
): Promise<MoviesPage> {
  const { genre, sort = 'rating', category, page = 0, pageSize = 12 } = params;

  let query = supabase.from('movies').select('*', { count: 'exact' });

  // Genre filter — Supabase array contains operator
  if (genre && genre !== 'All') {
    query = query.contains('genres', [genre]);
  }

  // Category filter (awarded narrows by rating; trending/new only override sort)
  if (category === 'awarded') {
    query = query.gte('average_rating', AWARDED_THRESHOLD);
  }

  // Sort: category preset overrides user sort for trending/new
  if (category === 'trending') {
    query = query
      .order('review_count', { ascending: false })
      .order('average_rating', { ascending: false });
  } else if (category === 'new') {
    query = query
      .order('year', { ascending: false })
      .order('average_rating', { ascending: false });
  } else if (sort === 'rating') {
    query = query.order('average_rating', { ascending: false });
  } else if (sort === 'year') {
    query = query.order('year', { ascending: false });
  } else {
    query = query.order('title', { ascending: true });
  }

  // Pagination
  const from = page * pageSize;
  query = query.range(from, from + pageSize - 1);

  const { data, error, count } = await query;

  if (error) throw new Error(`getMoviesFiltered: ${error.message}`);

  const movies = (data ?? []).map(toMovie);
  const totalCount = count ?? 0;

  return {
    movies,
    totalCount,
    hasMore: from + movies.length < totalCount,
  };
}
