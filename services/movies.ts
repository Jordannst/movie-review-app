import { supabase } from '@/lib/supabase';
import { Movie } from '@/data/types';

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
