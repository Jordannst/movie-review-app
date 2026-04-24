import { Profile, Review } from '@/data/types';
import { supabase } from '@/lib/supabase';
import { toReview } from '@/services/reviews';

export type ProfileStats = {
  reviewsCount: number;
  averageRating: number | null;
  watchlistCount: number;
};

export function deriveInitials(name?: string | null, email?: string | null): string {
  const source = (name?.trim() || email?.split('@')[0] || 'MR').trim();
  const initials = source
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return initials || 'MR';
}

/** Map Supabase snake_case row → camelCase Profile */
function toProfile(row: Record<string, unknown>): Profile {
  return {
    id:             row.id as string,
    name:           row.name as string,
    username:       row.username as string | undefined,
    initials:       row.initials as string,
    bio:            row.bio as string,
    badgeLabel:     row.badge_label as string,
    favoriteGenres: (row.favorite_genres as string[]) ?? [],
  };
}

/** Ambil profil user yang sedang login. Kembalikan null jika tidak ada sesi aktif. */
export async function getCurrentUserProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw new Error(`getCurrentUserProfile: ${error.message}`);
  return data ? toProfile(data) : null;
}

/** Ambil profil berdasarkan user id (UUID dari Supabase Auth) */
export async function getProfileById(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw new Error(`getProfileById: ${error.message}`);
  return data ? toProfile(data) : null;
}

/** Ambil ringkasan statistik profil dari data user yang sedang login. */
export async function getProfileStats(userId: string): Promise<ProfileStats> {
  const [
    { data: reviewRows, error: reviewsError, count: reviewsCount },
    { error: watchlistError, count: watchlistCount },
  ] = await Promise.all([
    supabase
      .from('reviews')
      .select('rating', { count: 'exact' })
      .eq('user_id', userId),
    supabase
      .from('watchlist')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
  ]);

  if (reviewsError) throw new Error(`getProfileStats reviews: ${reviewsError.message}`);
  if (watchlistError) throw new Error(`getProfileStats watchlist: ${watchlistError.message}`);

  const ratings = (reviewRows ?? []).map((row) => Number(row.rating));
  const averageRating =
    ratings.length > 0
      ? ratings.reduce((total, rating) => total + rating, 0) / ratings.length
      : null;

  return {
    reviewsCount: reviewsCount ?? ratings.length,
    averageRating,
    watchlistCount: watchlistCount ?? 0,
  };
}

export type UpdateProfileInput = {
  name: string;
  username?: string | null;
  bio: string;
  badgeLabel: string;
  favoriteGenres: string[];
};

/**
 * Upsert profil user yang sedang login. Membuat row baru kalau belum ada,
 * kalau sudah ada di-update. Mengembalikan profile terbaru.
 */
export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
  userEmail?: string | null
): Promise<Profile> {
  const trimmedUsername = input.username?.trim() || null;
  const normalizedUsername = trimmedUsername?.startsWith('@')
    ? trimmedUsername.slice(1)
    : trimmedUsername;

  const payload = {
    id: userId,
    name: input.name.trim(),
    username: normalizedUsername && normalizedUsername.length > 0 ? normalizedUsername : null,
    initials: deriveInitials(input.name, userEmail),
    bio: input.bio.trim(),
    badge_label: input.badgeLabel.trim() || 'Member',
    favorite_genres: input.favoriteGenres,
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Username sudah dipakai, pilih yang lain.');
    }
    throw new Error(`updateProfile: ${error.message}`);
  }

  return toProfile(data);
}

/** Ambil review terbaru milik user tertentu. */
export async function getUserReviews(userId: string, limit = 4): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`getUserReviews: ${error.message}`);
  return (data ?? []).map(toReview);
}
