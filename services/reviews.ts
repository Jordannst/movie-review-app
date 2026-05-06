import { Review } from '@/data/types';
import { supabase } from '@/lib/supabase';

export type ReviewSortBy = 'newest' | 'top-rated';

export type GetMovieReviewsOptions = {
  page?: number;
  pageSize?: number;
  sortBy?: ReviewSortBy;
  excludeSpoilers?: boolean;
};

export type MovieReviewPage = {
  reviews: Review[];
  totalCount: number;
  hasMore: boolean;
};

const DEFAULT_REVIEW_PAGE = 1;
const DEFAULT_REVIEW_PAGE_SIZE = 12;

/** Map Supabase snake_case row → camelCase Review */
export function toReview(row: Record<string, unknown>): Review {
  const rawUpdatedAt = row.updated_at as string | null | undefined;
  return {
    id:               row.id as string,
    movieId:          row.movie_id as string,
    userId:           (row.user_id as string | null | undefined) ?? null,
    authorName:       row.author_name as string,
    title:            row.title as string,
    body:             row.body as string,
    rating:           Number(row.rating),
    tags:             (row.tags as string[]) ?? [],
    containsSpoilers: (row.contains_spoilers as boolean) ?? false,
    createdAt:        (row.created_at as string).slice(0, 10), // 'YYYY-MM-DD'
    updatedAt:        rawUpdatedAt ? rawUpdatedAt.slice(0, 10) : null,
  };
}

/** Ambil review untuk satu film dengan pagination + sorting terstruktur */
export async function getReviewsForMovie(
  movieId: string,
  options: GetMovieReviewsOptions = {}
): Promise<MovieReviewPage> {
  const page = Math.max(DEFAULT_REVIEW_PAGE, Math.trunc(options.page ?? DEFAULT_REVIEW_PAGE));
  const pageSize = Math.max(
    1,
    Math.trunc(options.pageSize ?? DEFAULT_REVIEW_PAGE_SIZE)
  );
  const sortBy = options.sortBy ?? 'newest';
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('reviews')
    .select('*', { count: 'exact' })
    .eq('movie_id', movieId);

  if (options.excludeSpoilers) {
    query = query.eq('contains_spoilers', false);
  }

  if (sortBy === 'top-rated') {
    query = query.order('rating', { ascending: false }).order('created_at', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data, error, count } = await query.range(from, to);

  if (error) throw new Error(`getReviewsForMovie: ${error.message}`);

  const reviews = (data ?? []).map(toReview);
  const totalCount = count ?? 0;

  return {
    reviews,
    totalCount,
    hasMore: from + reviews.length < totalCount,
  };
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

export type UpsertReviewInput = {
  movieId: string;
  userId: string;
  authorName: string;
  title: string;
  body: string;
  rating: number;
  tags?: string[];
  containsSpoilers?: boolean;
};

/**
 * Cek apakah user sudah punya review untuk film ini.
 * Return null kalau belum ada.
 */
export async function getUserReviewForMovie(
  userId: string,
  movieId: string
): Promise<Review | null> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('user_id', userId)
    .eq('movie_id', movieId)
    .maybeSingle();

  if (error) throw new Error(`getUserReviewForMovie: ${error.message}`);
  return data ? toReview(data) : null;
}

/**
 * Simpan review — insert kalau user belum pernah review film ini,
 * atau update review existing (unique constraint `reviews_user_movie_unique`
 * memastikan 1 user = 1 review per film).
 *
 * Trigger DB akan set `updated_at = now()` saat baris di-update.
 */
export async function upsertReview(input: UpsertReviewInput): Promise<Review> {
  const payload = {
    movie_id:          input.movieId,
    user_id:           input.userId,
    author_name:       input.authorName,
    title:             input.title,
    body:              input.body,
    rating:            input.rating,
    tags:              input.tags ?? [],
    contains_spoilers: input.containsSpoilers ?? false,
  };

  const { data, error } = await supabase
    .from('reviews')
    .upsert(payload, { onConflict: 'user_id,movie_id' })
    .select()
    .single();

  if (error) throw new Error(`upsertReview: ${error.message}`);
  return toReview(data);
}

/**
 * @deprecated Gunakan `upsertReview` untuk mematuhi aturan
 * "1 review per user per film". Fungsi ini tetap ada untuk
 * backwards-compatibility dengan kode lama.
 */
export const createReview = upsertReview;
