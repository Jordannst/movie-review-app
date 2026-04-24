import { supabase } from '@/lib/supabase';
import { Review } from '@/data/types';

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

type CreateReviewInput = {
  movieId: string;
  userId: string;
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
      user_id:           input.userId,
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
