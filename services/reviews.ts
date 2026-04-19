import { supabase } from '@/lib/supabase';
import { Review } from '@/data/types';

/** Map Supabase snake_case row → camelCase Review */
function toReview(row: Record<string, unknown>): Review {
  return {
    id:               row.id as string,
    movieId:          row.movie_id as string,
    authorName:       row.author_name as string,
    title:            row.title as string,
    body:             row.body as string,
    rating:           Number(row.rating),
    tags:             (row.tags as string[]) ?? [],
    containsSpoilers: (row.contains_spoilers as boolean) ?? false,
    createdAt:        (row.created_at as string).slice(0, 10), // 'YYYY-MM-DD'
  };
}

/** Ambil semua review untuk satu film, diurutkan terbaru dulu */
export async function getReviewsForMovie(movieId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('movie_id', movieId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`getReviewsForMovie: ${error.message}`);
  return (data ?? []).map(toReview);
}

/** Ambil review terbaru dari semua film (untuk feed / profile), dengan limit opsional */
export async function getRecentReviews(limit = 20): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`getRecentReviews: ${error.message}`);
  return (data ?? []).map(toReview);
}

type CreateReviewInput = {
  movieId: string;
  authorName: string;
  title: string;
  body: string;
  rating: number;
  tags?: string[];
  containsSpoilers?: boolean;
};

/** Kirim review baru ke Supabase */
export async function createReview(input: CreateReviewInput): Promise<Review> {
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      movie_id:          input.movieId,
      author_name:       input.authorName,
      title:             input.title,
      body:              input.body,
      rating:            input.rating,
      tags:              input.tags ?? [],
      contains_spoilers: input.containsSpoilers ?? false,
    })
    .select()
    .single();

  if (error) throw new Error(`createReview: ${error.message}`);
  return toReview(data);
}
