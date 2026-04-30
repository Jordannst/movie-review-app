-- 006_movies_aggregates_trigger.sql
-- Make movies.review_count and movies.average_rating derived columns
-- that always reflect the actual rows in `reviews`.
--
-- This eliminates two long-standing inconsistencies:
--   1. Seeded review_count values (e.g. 4821) wildly exceed real review rows.
--   2. Seeded average_rating values use IMDB-style 1–10 scale, but the
--      reviews CHECK constraint enforces 1–5. Cards/detail pills now
--      always display a number on the same scale as the user's stars.

-- ── 1. Recalc function ───────────────────────────────────────
create or replace function public.recalc_movie_aggregates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_movie_id text := coalesce(new.movie_id, old.movie_id);
begin
  update public.movies m
     set review_count   = (
           select count(*)::int
           from public.reviews r
           where r.movie_id = target_movie_id
         ),
         average_rating = coalesce((
           select round(avg(r.rating)::numeric, 1)
           from public.reviews r
           where r.movie_id = target_movie_id
         ), 0)
   where m.id = target_movie_id;

  return coalesce(new, old);
end;
$$;

revoke all on function public.recalc_movie_aggregates() from public;

-- ── 2. Trigger on reviews ────────────────────────────────────
drop trigger if exists reviews_recalc_movie_aggregates on public.reviews;

create trigger reviews_recalc_movie_aggregates
after insert or update of rating, movie_id or delete
on public.reviews
for each row execute function public.recalc_movie_aggregates();

-- ── 3. One-shot recalc for every existing movie ─────────────
-- Using a correlated subquery so the result is deterministic
-- and independent of the trigger.
update public.movies m
   set review_count   = coalesce(agg.cnt, 0),
       average_rating = coalesce(agg.avg_rating, 0)
  from (
    select movie_id,
           count(*)::int                        as cnt,
           round(avg(rating)::numeric, 1)       as avg_rating
      from public.reviews
     group by movie_id
  ) agg
 where agg.movie_id = m.id;

-- Movies that have zero reviews keep their seed values? No — set both to 0
-- so the data is honest. Anything else is dishonest UI.
update public.movies
   set review_count = 0,
       average_rating = 0
 where id not in (select movie_id from public.reviews);
