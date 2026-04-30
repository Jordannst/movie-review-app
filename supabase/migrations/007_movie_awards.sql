-- 007_movie_awards.sql
-- First-class awards metadata for movies. Replaces the heuristic
-- "average_rating >= 4.5" filter in services/movies.ts.

create table if not exists public.movie_awards (
  id            bigint generated always as identity primary key,
  movie_id      text        not null references public.movies(id) on delete cascade,
  award_name    text        not null,    -- e.g. "Best Picture"
  organization  text        not null,    -- e.g. "Academy Awards"
  year          integer     not null check (year between 1900 and 2100),
  category      text,                    -- nullable, e.g. "Drama"
  is_winner     boolean     not null default true,
  created_at    timestamptz not null default now()
);

-- Common access patterns:
--  • list all awards for a movie ordered newest-first
--  • EXISTS subquery for "awarded" filter
create index if not exists movie_awards_movie_idx on public.movie_awards (movie_id);
create index if not exists movie_awards_year_idx  on public.movie_awards (year desc);

-- Optional convenience: prevent obvious duplicates entered twice via the editor.
-- Uses a UNIQUE INDEX (not a UNIQUE constraint) because the key includes
-- coalesce(category, '') which is an expression — UNIQUE constraints only
-- support plain columns.
drop index if exists movie_awards_unique_entry;
create unique index movie_awards_unique_entry
  on public.movie_awards
     (movie_id, organization, year, award_name, coalesce(category, ''));

-- ── RLS ──────────────────────────────────────────────────────
alter table public.movie_awards enable row level security;

drop policy if exists "movie_awards_select_all"  on public.movie_awards;
drop policy if exists "movie_awards_insert_admin" on public.movie_awards;
drop policy if exists "movie_awards_update_admin" on public.movie_awards;
drop policy if exists "movie_awards_delete_admin" on public.movie_awards;

create policy "movie_awards_select_all" on public.movie_awards
  for select using (true);

create policy "movie_awards_insert_admin" on public.movie_awards
  for insert with check (public.is_admin());

create policy "movie_awards_update_admin" on public.movie_awards
  for update using (public.is_admin()) with check (public.is_admin());

create policy "movie_awards_delete_admin" on public.movie_awards
  for delete using (public.is_admin());
