-- Support profile screen queries for a user's latest reviews and review stats.
create index if not exists reviews_user_created_at_idx
  on public.reviews (user_id, created_at desc);
