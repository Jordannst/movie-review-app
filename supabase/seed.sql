-- ─────────────────────────────────────────────────────────────
-- MovieReview — Real Movie Seed Data
-- Run AFTER 001_initial_schema.sql
-- Supabase Dashboard → SQL Editor → New Query → Run
-- Images sourced from TMDB public CDN
-- ─────────────────────────────────────────────────────────────

-- Real Movies
insert into public.movies (id, title, tagline, year, runtime_minutes, genres, director, synopsis, poster_url, backdrop_url, average_rating, review_count, is_featured)
values
  ('inception',
   'Inception',
   'Your mind is the scene of the crime.',
   2010, 148,
   array['Sci-Fi', 'Action', 'Thriller'],
   'Christopher Nolan',
   'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O., but his tragic past may doom the project and his team to disaster.',
   'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
   'https://image.tmdb.org/t/p/original/s3TBrRGB1iav7gFOCNx3H31MoES.jpg',
   8.8, 4821, false),

  ('the-dark-knight',
   'The Dark Knight',
   'Why so serious?',
   2008, 152,
   array['Action', 'Crime', 'Drama'],
   'Christopher Nolan',
   'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
   'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
   'https://image.tmdb.org/t/p/original/cfT29Im5VDvjE0RpyKOSdCKZal7.jpg',
   9.0, 6512, false),

  ('interstellar',
   'Interstellar',
   'Mankind was born on Earth. It was never meant to die here.',
   2014, 169,
   array['Sci-Fi', 'Drama', 'Adventure'],
   'Christopher Nolan',
   'The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.',
   'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
   'https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
   8.7, 5103, false),

  ('parasite',
   'Parasite',
   'Act like you own the place.',
   2019, 132,
   array['Thriller', 'Comedy', 'Drama'],
   'Bong Joon-ho',
   'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.',
   'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
   'https://image.tmdb.org/t/p/original/TU9NIjwzjoKPwQHoHshkFcQUCG.jpg',
   8.6, 4420, false),

  ('top-gun-maverick',
   'Top Gun: Maverick',
   'Feel the need... The need for speed.',
   2022, 131,
   array['Action', 'Drama'],
   'Joseph Kosinski',
   'After more than thirty years of service as one of the Navy''s top aviators, Pete "Maverick" Mitchell finds himself training TOP GUN graduates for a specialized mission the likes of which no living pilot has ever seen.',
   'https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg',
   'https://image.tmdb.org/t/p/original/AaV1YIdWKnjAIAOe8UUKBFm327v.jpg',
   8.2, 10770, false),

  ('oppenheimer',
   'Oppenheimer',
   'The world forever changes.',
   2023, 180,
   array['Drama', 'History', 'Thriller'],
   'Christopher Nolan',
   'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.',
   'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
   'https://image.tmdb.org/t/p/original/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg',
   8.2, 4188, true),

  ('dune-part-two',
   'Dune: Part Two',
   'Long live the fighters.',
   2024, 167,
   array['Sci-Fi', 'Adventure'],
   'Denis Villeneuve',
   'Paul Atreides unites with Chani and the Fremen while on a path of revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe, only he can foresee their terrible future.',
   'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
   'https://image.tmdb.org/t/p/original/eZ239CUp1d6OryZEBPnO2n87gMG.jpg',
   8.1, 7792, false),

  ('blade-runner-2049',
   'Blade Runner 2049',
   'The key to the future is finally unearthed.',
   2017, 164,
   array['Sci-Fi', 'Drama', 'Mystery'],
   'Denis Villeneuve',
   'A young blade runner''s discovery of a long-buried secret leads him to track down former blade runner Rick Deckard, who''s been missing for thirty years.',
   'https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg',
   'https://image.tmdb.org/t/p/original/askFH4GSk2u9z3ZE5ypdKIMeqLJ.jpg',
   8.0, 2910, false)
on conflict (id) do nothing;

-- Real-sounding reviews for the movies
insert into public.reviews (id, movie_id, author_name, title, body, rating, contains_spoilers)
values
  ('rev-001', 'inception', 'Marcus T.',
   'A masterpiece of layered storytelling',
   'Nolan at his absolute best. Each layer of the dream within a dream is meticulously crafted, and the emotional core — Cobb''s grief for Mal — grounds an otherwise mind-bending concept. The spinning top ending still haunts me years later.',
   5.0, true),

  ('rev-002', 'inception', 'Priya S.',
   'Rewatchable for life',
   'I''ve seen this five times and I still notice new details. The practical effects mixed with Hans Zimmer''s score create something genuinely cinematic. A rare blockbuster that respects its audience''s intelligence.',
   4.8, false),

  ('rev-003', 'the-dark-knight', 'Jordan K.',
   'Heath Ledger defines a generation',
   'No comic book villain has come close to matching what Ledger did with the Joker. The interrogation scene alone is a ten-minute acting clinic. The ferry sequence forces real moral philosophy into what could have been a standard action movie.',
   5.0, false),

  ('rev-004', 'the-dark-knight', 'Amara N.',
   'The best superhero film ever made',
   'It transcends the genre entirely. Nolan treats it like a crime epic in the vein of Heat, not a superhero movie. Every scene adds something, and the stakes feel genuinely alive — not CGI-spectacle alive, but dramatically alive.',
   4.9, false),

  ('rev-005', 'interstellar', 'Kai M.',
   'Emotionally devastating in the best way',
   'The docking scene set to Zimmer''s organ-heavy score is the most viscerally intense thing I''ve ever seen in a theater. The time dilation sequences are staggering. A film that earns its tears.',
   4.8, false),

  ('rev-006', 'parasite', 'Sofia L.',
   'Impossibly well-constructed',
   'Bong Joon-ho pulls off tonal whiplash that should not work — dark comedy to thriller to outright horror — and it works every single time. The house itself functions like a fifth character. Required viewing.',
   5.0, false),

  ('rev-007', 'parasite', 'Dayo R.',
   'Genre-defying and brutally honest',
   'The Palme d''Or and Best Picture were both deserved. No film in years has made class anxiety feel this visceral. The ending refuses to let anyone off the hook, which is exactly right.',
   4.7, true),

  ('rev-008', 'top-gun-maverick', 'Lily Chen',
   'The sequel that shamed every other blockbuster',
   'Thirty years later and Maverick is still the best pilot in the room — and this film is still the best action movie in years. The practical flying footage alone is worth the price of admission. A crowd-pleaser that earns every cheer.',
   4.9, false),

  ('rev-009', 'oppenheimer', 'James T.',
   'A three-hour film that earns every minute',
   'Nolan weaponizes non-linear structure to put us inside Oppenheimer''s fractured memory. Cillian Murphy finally gets the lead he deserved, and Robert Downey Jr. quietly delivers the performance of his career.',
   4.7, false),

  ('rev-010', 'dune-part-two', 'Fatima A.',
   'Denis Villeneuve delivers the year''s finest cinema',
   'Everything Part One promised, Part Two delivers tenfold. Zendaya finally gets the screen time she deserved, and the final act is utterly uncompromising. The spice must flow — and it absolutely does.',
   4.8, false),

  ('rev-011', 'blade-runner-2049', 'Micah D.',
   'Stunning, patient, and underrated on release',
   'Roger Deakins'' cinematography is the best of the 2010s, full stop. The film takes its time building an atmosphere that gets under your skin. It''s a meditative experience that improves significantly with rewatches.',
   4.8, false)
on conflict (id) do nothing;
