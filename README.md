# MovieReview

A cross-platform mobile movie review application built with **React Native** and **Expo**, featuring user authentication, movie browsing, review writing, watchlist management, and an admin panel for content moderation.

> **Course Project** — Mobile App Development

---

## Overview

MovieReview is a fully-featured mobile app that lets users discover movies, write detailed reviews with ratings and tags, build a personal watchlist, and engage with a curated catalog. Admin users get an additional control panel for managing the movie catalog and moderating user-submitted reviews.

The project demonstrates production-grade mobile development patterns: typed Supabase integration, row-level security, optimistic UI updates with rollback, paginated lists, debounced search, and role-based access control with hidden navigation.

---

## Features

### For All Users
- **Authentication** — Email/password sign up & sign in via Supabase Auth
- **Profile management** — Edit name, username, bio, avatar, favorite genres
- **Browse movies** — Search, filter by genre, view detailed pages with cast, synopsis, and aggregate ratings
- **Featured carousel** — Curated picks on the home screen with rich visuals
- **Write reviews** — Rate (1–5 stars), title + body, optional tags, spoiler flag
- **Watchlist** — Save movies for later, view in dedicated list
- **One review per movie per user** — Editable, with edit history shown via `updatedAt`

### For Admin Users (Hidden Tab)
- **Admin Hub** — Live stats (movies, reviews, featured count) + quick action cards
- **Movie CRUD** — Create, edit, delete movies with full form validation
- **Featured toggle** — Optimistic on/off switch directly from the list
- **Slug-based IDs** — Locked on edit to prevent broken references
- **Live image previews** — Poster + backdrop URLs with error fallback
- **Review moderation** — Paginated queue, filter by movie title, delete with confirmation
- **Spoiler indicator** — Visual flag on reviews marked as containing spoilers

### Security
- **Row-level security (RLS)** on all tables — admin writes enforced at the database level, not just client-side
- **Privilege escalation guard** — Profile updates explicitly cannot modify the `role` column
- **Hidden routes** — Non-admin users never see the Admin tab; deep-link attempts redirect to the home screen via `AdminGuard`

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Expo](https://expo.dev) (SDK 54) + [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing) |
| **Language** | TypeScript (strict mode) |
| **UI** | React Native 0.81, [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/) v4 |
| **Backend** | [Supabase](https://supabase.com) (Postgres + Auth + RLS) |
| **State** | React Context + hooks (no external state library) |
| **Icons** | [@expo/vector-icons](https://icons.expo.fyi/) (Ionicons / MaterialIcons) |
| **Images** | [expo-image](https://docs.expo.dev/versions/latest/sdk/image/) for memory-efficient caching |
| **Animations** | Reanimated (entering animations, layout transitions, shared values) |
| **Storage** | [@react-native-async-storage/async-storage](https://github.com/react-native-async-storage/async-storage) for session persistence |

---

## Project Structure

```
MovieReview/
├── app/                          # Expo Router file-based routes
│   ├── (tabs)/                   # Bottom-tab routes
│   │   ├── index.tsx             # Home (featured + sections)
│   │   ├── profile.tsx           # User profile + watchlist
│   │   └── admin.tsx             # Admin hub (gated)
│   ├── admin/                    # Admin-only screens
│   │   ├── movies/
│   │   │   ├── index.tsx         # Movies list
│   │   │   ├── new.tsx           # Create movie (modal)
│   │   │   └── [id].tsx          # Edit movie (modal)
│   │   └── reviews.tsx           # Moderation queue
│   ├── auth/                     # Sign in / sign up flow
│   ├── movies/                   # Movie browsing
│   │   ├── index.tsx             # All movies + filters
│   │   └── [id].tsx              # Movie detail + reviews
│   ├── profile/                  # Profile sub-screens
│   └── _layout.tsx               # Root stack
├── components/                   # Shared UI components
│   ├── admin/                    # Admin-specific (guard, form)
│   ├── floating-tab-bar.tsx      # Custom tab bar with role-aware filtering
│   ├── rating-stars.tsx
│   └── ...
├── contexts/                     # React Context providers
│   └── auth-context.tsx          # Session, profile, isAdmin
├── data/
│   └── types.ts                  # Shared domain types (Movie, Review, Profile)
├── hooks/                        # Custom hooks (theme, admin guard, etc.)
├── lib/
│   └── supabase.ts               # Configured Supabase client
├── services/                     # Database access layer
│   ├── movies.ts                 # Public read queries
│   ├── reviews.ts                # Public + user-scoped writes
│   ├── profile.ts                # Profile CRUD (role-stripped)
│   ├── admin-movies.ts           # Admin write operations
│   └── admin-reviews.ts          # Admin moderation queries
├── supabase/
│   ├── migrations/               # Versioned SQL migrations
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_profile_query_indexes.sql
│   │   ├── 003_profile_insert_own.sql
│   │   ├── 004_reviews_single_per_user_editable.sql
│   │   └── 005_admin_role.sql    # RLS + is_admin() helper
│   └── seed.sql                  # Sample movies + reviews
├── theme/                        # Design tokens
└── package.json
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **npm** or **pnpm**
- **Expo Go** app on your phone (iOS / Android), OR Android Studio / Xcode for emulators
- **Supabase project** (free tier is fine)

### 1. Clone & Install

```bash
git clone <repo-url>
cd MovieReview
npm install
```

### 2. Configure Supabase

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

Get these from your Supabase project dashboard → **Project Settings** → **API**.

### 3. Run Migrations

In the Supabase SQL editor, run the migration files **in order**:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_profile_query_indexes.sql
supabase/migrations/003_profile_insert_own.sql
supabase/migrations/004_reviews_single_per_user_editable.sql
supabase/migrations/005_admin_role.sql
```

Optionally, run `supabase/seed.sql` to populate with sample movies and reviews.

### 4. Promote a User to Admin

After signing up through the app, run this in the SQL editor (replace with your UUID):

```sql
-- View all profiles + roles
SELECT id, name, role FROM public.profiles;

-- Promote one to admin
UPDATE public.profiles
SET role = 'admin'
WHERE id = '<your-uuid>';
```

Restart the app — the **Admin** tab will appear in the bottom navigation.

### 5. Start the App

```bash
npx expo start
```

Then choose:
- **`a`** — Open on Android emulator
- **`i`** — Open on iOS simulator (macOS only)
- Scan the QR code with **Expo Go** on a physical device
- **`w`** — Open in web browser (limited features)

---

## Key Engineering Patterns

### Generation Counter for Async Safety

Long-lived screens (e.g. paginated reviews moderation) use a `useRef` generation counter to discard stale fetch responses when the user refreshes mid-pagination — preventing data corruption from out-of-order async resolution.

### Stale-While-Revalidate

Lists keep showing existing data while refetching in the background. Loading spinners only appear on the very first load. This pattern is used in `app/admin/movies/index.tsx` and `app/admin/reviews.tsx`.

### Optimistic UI with Rollback

Featured toggle in the admin movies list updates the UI instantly, then rolls back if the server call fails. See `handleToggleFeatured` in `app/admin/movies/index.tsx`.

### Manual Joins When PostgREST Can't Resolve FKs

`reviews.user_id` references `auth.users` (not `public.profiles`), so PostgREST can't auto-resolve embedded `profiles(name)` lookups. The admin reviews query falls back to a two-step manual join. See `services/admin-reviews.ts`.

### Conditional Payload Fields

`toDbPayload` in `services/admin-movies.ts` conditionally omits `average_rating` and `review_count` from update payloads — preventing accidental data wipes since the form doesn't expose these derived columns.

---

## Scripts

| Command | Purpose |
|---|---|
| `npm start` / `npx expo start` | Start the Metro bundler |
| `npm run android` | Open on Android emulator |
| `npm run ios` | Open on iOS simulator |
| `npm run web` | Open in web browser |
| `npm run lint` | Run ESLint |
| `npx tsc --noEmit` | Type-check without emitting files |

---

## License

This project is created for educational purposes as part of a Mobile App Development course.
