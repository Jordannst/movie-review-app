import { supabase } from '@/lib/supabase';
import { Profile } from '@/data/types';

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
