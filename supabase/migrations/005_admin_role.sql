-- 005_admin_role.sql
-- Add role to profiles; helper function; admin RLS for movies and reviews.

-- ─────────────────────────────────────────────────────────────
-- 1. Role column
-- ─────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists role text not null default 'user'
  check (role in ('user', 'admin'));

create index if not exists profiles_role_idx on public.profiles (role);

-- ─────────────────────────────────────────────────────────────
-- 2. is_admin() helper (SECURITY DEFINER so it reads profiles
--    regardless of caller's own profile RLS)
-- ─────────────────────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ─────────────────────────────────────────────────────────────
-- 3. Admin write access on movies
-- ─────────────────────────────────────────────────────────────
drop policy if exists "movies_insert_admin" on public.movies;
drop policy if exists "movies_update_admin" on public.movies;
drop policy if exists "movies_delete_admin" on public.movies;

create policy "movies_insert_admin" on public.movies
  for insert
  with check (public.is_admin());

create policy "movies_update_admin" on public.movies
  for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "movies_delete_admin" on public.movies
  for delete
  using (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- 4. Admin delete on reviews (moderation)
-- ─────────────────────────────────────────────────────────────
drop policy if exists "reviews_delete_admin" on public.reviews;

create policy "reviews_delete_admin" on public.reviews
  for delete
  using (public.is_admin());
