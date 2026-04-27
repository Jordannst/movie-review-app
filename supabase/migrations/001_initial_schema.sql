-- ─────────────────────────────────────────────────────────────
-- MovieReview — Initial Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- ─────────────────────────────────────────────────────────────

-- Table: movies
create table if not exists public.movies (
  id               text primary key,            -- slug, e.g. 'eclipse-run'
  title            text        not null,
  tagline          text        not null default '',
  year             integer     not null,
  runtime_minutes  integer     not null,
  genres           text[]      not null default '{}',
  director         text        not null default '',
  synopsis         text        not null default '',
  poster_url       text        not null default '',
  backdrop_url     text        not null default '',
  average_rating   numeric(3,1) not null default 0,
  review_count     integer     not null default 0,
  is_featured      boolean     not null default false,
  created_at       timestamptz not null default now()
);

-- Table: reviews
create table if not exists public.reviews (
  id                 text primary key default gen_random_uuid()::text,
  movie_id           text        not null references public.movies(id) on delete cascade,
  user_id            uuid        references auth.users(id) on delete set null,
  author_name        text        not null,
  title              text        not null default '',
  body               text        not null,
  rating             numeric(2,1) not null check (rating >= 1 and rating <= 5),
  tags               text[]      not null default '{}',
  contains_spoilers  boolean     not null default false,
  created_at         timestamptz not null default now()
);

-- Table: profiles
create table if not exists public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  name             text        not null default '',
  username         text        unique,
  initials         text        not null default '',
  bio              text        not null default '',
  badge_label      text        not null default 'Member',
  favorite_genres  text[]      not null default '{}',
  created_at       timestamptz not null default now()
);

-- Table: watchlist
create table if not exists public.watchlist (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  movie_id   text not null references public.movies(id) on delete cascade,
  added_at   timestamptz not null default now(),
  unique (user_id, movie_id)
);

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────
alter table public.movies    enable row level security;
alter table public.reviews   enable row level security;
alter table public.profiles  enable row level security;
alter table public.watchlist enable row level security;

-- Movies: anyone can read, nobody can write from client
create policy "movies_select_all" on public.movies for select using (true);

-- Reviews: anyone can read; logged-in user can insert their own
create policy "reviews_select_all" on public.reviews for select using (true);
create policy "reviews_insert_own" on public.reviews for insert
  with check (auth.uid() = user_id or user_id is null);

-- Profiles: anyone can read; only owner can update
create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Watchlist: only owner can read and write
create policy "watchlist_own" on public.watchlist
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
