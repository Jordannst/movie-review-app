import { Award } from '@/data/types';
import { supabase } from '@/lib/supabase';

function toAward(row: Record<string, unknown>): Award {
  return {
    id:           row.id as number,
    movieId:      row.movie_id as string,
    awardName:    row.award_name as string,
    organization: row.organization as string,
    year:         row.year as number,
    category:     (row.category as string | null) ?? null,
    isWinner:     row.is_winner as boolean,
  };
}

/** Read all awards for a movie, newest first then winners before nominations. */
export async function getAwardsForMovie(movieId: string): Promise<Award[]> {
  const { data, error } = await supabase
    .from('movie_awards')
    .select('*')
    .eq('movie_id', movieId)
    .order('year', { ascending: false })
    .order('is_winner', { ascending: false })
    .order('organization', { ascending: true });

  if (error) throw new Error(`getAwardsForMovie: ${error.message}`);
  return (data ?? []).map(toAward);
}

/** Shape accepted by the admin form when saving a movie. */
export type AwardInput = Omit<Award, 'id' | 'movieId'>;

/**
 * Admin-only: replace the full awards set for a movie atomically-from-the-client's
 * perspective (delete-all + insert-all). RLS on movie_awards enforces the admin check.
 */
export async function replaceAwardsForMovie(
  movieId: string,
  awards: AwardInput[]
): Promise<void> {
  // 1. Delete existing
  const { error: delErr } = await supabase
    .from('movie_awards')
    .delete()
    .eq('movie_id', movieId);
  if (delErr) throw new Error(`replaceAwardsForMovie/delete: ${delErr.message}`);

  if (awards.length === 0) return;

  // 2. Insert new set
  const rows = awards.map((a) => ({
    movie_id:     movieId,
    award_name:   a.awardName.trim(),
    organization: a.organization.trim(),
    year:         a.year,
    category:     a.category?.trim() ? a.category.trim() : null,
    is_winner:    a.isWinner,
  }));

  const { error: insErr } = await supabase.from('movie_awards').insert(rows);
  if (insErr) throw new Error(`replaceAwardsForMovie/insert: ${insErr.message}`);
}
