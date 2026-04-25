import { Movie } from '@/data/types';
import { supabase } from '@/lib/supabase';

export type MovieInput = {
  id: string;              // slug-style id, e.g. 'the-dark-knight'
  title: string;
  tagline: string;
  year: number;
  runtimeMinutes: number;
  genres: string[];
  director: string;
  synopsis: string;
  posterUrl: string;
  backdropUrl: string;
  averageRating?: number;  // defaults to 0
  reviewCount?: number;    // defaults to 0
  isFeatured?: boolean;    // defaults to false
};

/**
 * Upsert payload keys must match DB columns (snake_case).
 *
 * IMPORTANT: `average_rating` and `review_count` are derived/aggregate fields not
 * surfaced by `MovieForm`. Always omit them from the payload when the caller did
 * not explicitly provide a value, so:
 *   - INSERT relies on the DB defaults (0).
 *   - UPDATE preserves the existing values instead of resetting them to 0.
 */
function toDbPayload(input: MovieInput): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    id:              input.id.trim(),
    title:           input.title.trim(),
    tagline:         input.tagline.trim(),
    year:            input.year,
    runtime_minutes: input.runtimeMinutes,
    genres:          input.genres,
    director:        input.director.trim(),
    synopsis:        input.synopsis.trim(),
    poster_url:      input.posterUrl.trim(),
    backdrop_url:    input.backdropUrl.trim(),
    is_featured:     input.isFeatured ?? false,
  };
  if (input.averageRating !== undefined) {
    payload.average_rating = input.averageRating;
  }
  if (input.reviewCount !== undefined) {
    payload.review_count = input.reviewCount;
  }
  return payload;
}

export async function createMovie(input: MovieInput): Promise<Movie> {
  const { data, error } = await supabase
    .from('movies')
    .insert(toDbPayload(input))
    .select()
    .single();

  if (error) {
    if (error.code === '23505') throw new Error('Movie ID already exists — pick a unique slug.');
    throw new Error(`createMovie: ${error.message}`);
  }
  return mapRow(data);
}

export async function updateMovie(id: string, input: MovieInput): Promise<Movie> {
  const { id: _, ...payloadWithoutId } = toDbPayload(input);
  const { data, error } = await supabase
    .from('movies')
    .update(payloadWithoutId)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') throw new Error('Movie no longer exists.');
    throw new Error(`updateMovie: ${error.message}`);
  }
  return mapRow(data);
}

export async function deleteMovie(id: string): Promise<void> {
  const { error } = await supabase.from('movies').delete().eq('id', id);
  if (error) throw new Error(`deleteMovie: ${error.message}`);
}

export async function toggleFeatured(id: string, nextValue: boolean): Promise<void> {
  const { error } = await supabase
    .from('movies')
    .update({ is_featured: nextValue })
    .eq('id', id);

  if (error) throw new Error(`toggleFeatured: ${error.message}`);
}

function mapRow(row: Record<string, unknown>): Movie {
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
