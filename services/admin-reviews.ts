import { Review } from '@/data/types';
import { supabase } from '@/lib/supabase';
import { toReview } from '@/services/reviews';

export type AdminReviewRow = Review & {
  movieTitle: string;
  authorName: string;
};

export type AdminReviewsPage = {
  reviews: AdminReviewRow[];
  totalCount: number;
  hasMore: boolean;
};

export async function getAllReviewsPaginated(
  page = 0,
  pageSize = 20
): Promise<AdminReviewsPage> {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from('reviews')
    .select(
      `
      *,
      movies!inner(title),
      profiles(name)
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw new Error(`getAllReviewsPaginated: ${error.message}`);

  const reviews = (data ?? []).map((row) => {
    const base = toReview(row);
    const movieTitle = (row.movies as { title?: string } | null)?.title ?? 'Unknown movie';
    const authorName = (row.profiles as { name?: string } | null)?.name ?? base.authorName;
    return { ...base, movieTitle, authorName };
  });

  const totalCount = count ?? 0;

  return {
    reviews,
    totalCount,
    hasMore: from + reviews.length < totalCount,
  };
}

export async function adminDeleteReview(reviewId: string): Promise<void> {
  const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
  if (error) throw new Error(`adminDeleteReview: ${error.message}`);
}
