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
  pageSize = 20,
  movieFilter?: string
): Promise<AdminReviewsPage> {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  // Note: `reviews.user_id` references `auth.users`, not `public.profiles`, so PostgREST
  // cannot auto-resolve an embedded `profiles(name)`. We embed only the `movies` join
  // (which has a direct FK) and look up profiles in a follow-up `IN` query.
  let query = supabase
    .from('reviews')
    .select(`*, movies!inner(title)`, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  // Optional server-side filter by movie title (case-insensitive partial match).
  // Uses ilike on the embedded movies.title column.
  const trimmedFilter = movieFilter?.trim();
  if (trimmedFilter) {
    query = query.ilike('movies.title', `%${trimmedFilter}%`);
  }

  const { data, error, count } = await query;

  if (error) throw new Error(`getAllReviewsPaginated: ${error.message}`);

  const rows = data ?? [];

  // Collect distinct user_ids and fetch their current display names in one round-trip.
  const userIds = Array.from(
    new Set(rows.map((r) => r.user_id).filter((v): v is string => typeof v === 'string'))
  );
  const profilesById = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profileRows, error: profileErr } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', userIds);
    if (profileErr) throw new Error(`getAllReviewsPaginated: ${profileErr.message}`);
    for (const p of profileRows ?? []) {
      if (p.id && p.name) profilesById.set(p.id as string, p.name as string);
    }
  }

  const reviews: AdminReviewRow[] = rows.map((row) => {
    const base = toReview(row);
    const movieTitle = (row.movies as { title?: string } | null)?.title ?? 'Unknown movie';
    const liveName = typeof row.user_id === 'string' ? profilesById.get(row.user_id) : undefined;
    const authorName = liveName ?? base.authorName;
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
