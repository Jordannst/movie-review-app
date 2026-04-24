-- ─────────────────────────────────────────────────────────────
-- MovieReview — 1 review per user per film + editable (no delete)
--
-- Changes:
--  1. Add `updated_at` column (nullable — null means never edited)
--  2. Dedupe existing duplicate (user_id, movie_id) rows so unique
--     constraint can be added safely
--  3. Enforce unique (user_id, movie_id) so a user can't spam reviews
--  4. Trigger to set `updated_at = now()` on every UPDATE
--  5. RLS UPDATE policy so only the author can edit
--  6. NOTE: No DELETE policy yet — reserved for admin role later
--
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- ─────────────────────────────────────────────────────────────

-- 1. updated_at column ─────────────────────────────────────────
alter table public.reviews
  add column if not exists updated_at timestamptz;

-- 2. Dedupe duplicates (keep most recent by created_at) ────────
--    Seed rows have user_id = NULL and are untouched (NULL is
--    considered distinct in PG unique constraints).
delete from public.reviews a
using public.reviews b
where a.user_id is not null
  and a.user_id = b.user_id
  and a.movie_id = b.movie_id
  and a.id <> b.id
  and a.created_at < b.created_at;

-- 3. Unique constraint ────────────────────────────────────────
alter table public.reviews
  drop constraint if exists reviews_user_movie_unique;

alter table public.reviews
  add constraint reviews_user_movie_unique unique (user_id, movie_id);

-- 4. updated_at trigger ───────────────────────────────────────
create or replace function public.set_reviews_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists reviews_set_updated_at on public.reviews;
create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_reviews_updated_at();

-- 5. UPDATE RLS policy ────────────────────────────────────────
drop policy if exists "reviews_update_own" on public.reviews;
create policy "reviews_update_own" on public.reviews
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
