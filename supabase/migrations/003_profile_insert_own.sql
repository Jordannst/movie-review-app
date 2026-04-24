-- ─────────────────────────────────────────────────────────────
-- MovieReview — Allow users to insert their own profile row
-- Required so Edit Profile can create a profile for first-time users.
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- ─────────────────────────────────────────────────────────────

-- Profiles: owner can create their own row
create policy "profiles_insert_own" on public.profiles
  for insert
  with check (auth.uid() = id);
