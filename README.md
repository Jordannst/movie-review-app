# MovieReview

Aplikasi mobile review film cross-platform yang dibangun dengan **React Native** dan **Expo**, dilengkapi fitur autentikasi pengguna, jelajah film, penulisan review, manajemen watchlist, serta panel admin untuk moderasi konten.

> **Tugas Mata Kuliah** — Mobile App Development

---

## Ringkasan

MovieReview adalah aplikasi mobile yang memungkinkan pengguna untuk menemukan film, menulis review lengkap dengan rating dan tag, membangun watchlist pribadi, dan berinteraksi dengan katalog film yang terkurasi. Pengguna dengan role admin mendapat akses tambahan berupa control panel untuk mengelola katalog film dan memoderasi review yang dikirim user.

Project ini mendemonstrasikan pola pengembangan mobile production-grade: integrasi Supabase yang ter-typing rapi, row-level security, optimistic UI dengan rollback, paginated list, debounced search, serta role-based access control dengan navigasi tersembunyi.

---

## Fitur

### Untuk Semua Pengguna
- **Autentikasi** — Sign up & sign in dengan email/password lewat Supabase Auth
- **Manajemen Profile** — Edit nama, username, bio, avatar, dan genre favorit
- **Jelajah Film** — Search, filter berdasarkan genre, halaman detail dengan cast, sinopsis, dan rating agregat
- **Featured Carousel** — Pilihan kurasi di home screen dengan visual yang kaya
- **Tulis Review** — Beri rating (1–5 bintang), judul + body, tag opsional, flag spoiler
- **Watchlist** — Simpan film untuk ditonton nanti, lihat di list khusus
- **Satu Review per Film per User** — Bisa di-edit, history edit ditampilkan via `updatedAt`

### Untuk Admin (Tab Tersembunyi)
- **Admin Hub** — Statistik live (movies, reviews, featured count) + kartu quick action
- **CRUD Film** — Create, edit, delete film dengan validasi form lengkap
- **Toggle Featured** — Switch on/off optimistic langsung dari list
- **Slug-based ID** — Dikunci saat edit untuk mencegah referensi rusak
- **Preview Gambar Live** — URL poster + backdrop dengan fallback error
- **Moderasi Review** — Paginated queue, filter berdasarkan judul film, delete dengan konfirmasi
- **Indikator Spoiler** — Tanda visual pada review yang ditandai mengandung spoiler

### Keamanan
- **Row-level security (RLS)** di semua tabel — write admin di-enforce di level database, bukan hanya client-side
- **Privilege escalation guard** — Update profile secara eksplisit tidak bisa mengubah kolom `role`
- **Route Tersembunyi** — Non-admin tidak akan pernah melihat tab Admin; percobaan deep-link akan di-redirect ke home screen via `AdminGuard`

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| **Framework** | [Expo](https://expo.dev) (SDK 54) + [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing) |
| **Bahasa** | TypeScript (strict mode) |
| **UI** | React Native 0.81, [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/) v4 |
| **Backend** | [Supabase](https://supabase.com) (Postgres + Auth + RLS) |
| **State** | React Context + hooks (tanpa state library eksternal) |
| **Icons** | [@expo/vector-icons](https://icons.expo.fyi/) (Ionicons / MaterialIcons) |
| **Gambar** | [expo-image](https://docs.expo.dev/versions/latest/sdk/image/) untuk caching yang hemat memori |
| **Animasi** | Reanimated (entering animations, layout transitions, shared values) |
| **Storage** | [@react-native-async-storage/async-storage](https://github.com/react-native-async-storage/async-storage) untuk persistensi session |

---

## Struktur Project

```
MovieReview/
├── app/                          # Route file-based dari Expo Router
│   ├── (tabs)/                   # Route bottom-tab
│   │   ├── index.tsx             # Home (featured + sections)
│   │   ├── profile.tsx           # Profile + watchlist
│   │   └── admin.tsx             # Admin hub (gated)
│   ├── admin/                    # Layar khusus admin
│   │   ├── movies/
│   │   │   ├── index.tsx         # List film
│   │   │   ├── new.tsx           # Create film (modal)
│   │   │   └── [id].tsx          # Edit film (modal)
│   │   └── reviews.tsx           # Antrian moderasi review
│   ├── auth/                     # Flow sign in / sign up
│   ├── movies/                   # Jelajah film
│   │   ├── index.tsx             # Semua film + filter
│   │   └── [id].tsx              # Detail film + review
│   ├── profile/                  # Sub-screen profile
│   └── _layout.tsx               # Stack root
├── components/                   # Komponen UI yang dipakai bersama
│   ├── admin/                    # Khusus admin (guard, form)
│   ├── floating-tab-bar.tsx      # Tab bar custom dengan filter berdasarkan role
│   ├── rating-stars.tsx
│   └── ...
├── contexts/                     # React Context provider
│   └── auth-context.tsx          # Session, profile, isAdmin
├── data/
│   └── types.ts                  # Tipe domain bersama (Movie, Review, Profile)
├── hooks/                        # Custom hooks (theme, admin guard, dll.)
├── lib/
│   └── supabase.ts               # Client Supabase yang sudah ter-konfigurasi
├── services/                     # Lapisan akses database
│   ├── movies.ts                 # Query baca publik
│   ├── reviews.ts                # Write user-scoped + baca publik
│   ├── profile.ts                # CRUD profile (role di-strip)
│   ├── admin-movies.ts           # Operasi tulis admin
│   └── admin-reviews.ts          # Query moderasi admin
├── supabase/
│   ├── migrations/               # Migrasi SQL terversi
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_profile_query_indexes.sql
│   │   ├── 003_profile_insert_own.sql
│   │   ├── 004_reviews_single_per_user_editable.sql
│   │   └── 005_admin_role.sql    # RLS + helper is_admin()
│   └── seed.sql                  # Sample film + review
├── theme/                        # Design tokens
└── package.json
```

---

## Cara Menjalankan

### Prasyarat

- **Node.js** ≥ 20
- **npm** atau **pnpm**
- Aplikasi **Expo Go** di HP (iOS / Android), ATAU Android Studio / Xcode untuk emulator
- **Supabase project** (free tier sudah cukup)

### 1. Clone & Install

```bash
git clone <repo-url>
cd MovieReview
npm install
```

### 2. Konfigurasi Supabase

Buat file `.env` di root project:

```env
EXPO_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

Ambil nilai keduanya dari dashboard Supabase → **Project Settings** → **API**.

### 3. Jalankan Migrasi

Di SQL editor Supabase, jalankan file migrasi **secara berurutan**:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_profile_query_indexes.sql
supabase/migrations/003_profile_insert_own.sql
supabase/migrations/004_reviews_single_per_user_editable.sql
supabase/migrations/005_admin_role.sql
```

Opsional: jalankan `supabase/seed.sql` untuk mengisi sample data film dan review.

### 4. Promote User Menjadi Admin

Setelah sign up lewat app, jalankan query berikut di SQL editor (ganti dengan UUID Anda):

```sql
-- Lihat semua profile + role
SELECT id, name, role FROM public.profiles;

-- Promote satu user menjadi admin
UPDATE public.profiles
SET role = 'admin'
WHERE id = '<uuid-anda>';
```

Restart aplikasi — tab **Admin** akan muncul di navigasi bawah.

### 5. Jalankan Aplikasi

```bash
npx expo start
```

Lalu pilih:
- **`a`** — Buka di emulator Android
- **`i`** — Buka di simulator iOS (hanya macOS)
- Scan QR code dengan **Expo Go** di perangkat fisik
- **`w`** — Buka di web browser (fitur terbatas)

---

## Pola Engineering Utama

### Generation Counter untuk Async Safety

Layar dengan masa hidup panjang (mis. moderasi review yang paginated) memakai generation counter berbasis `useRef` untuk membuang response fetch yang sudah usang ketika user refresh di tengah-tengah pagination — mencegah korupsi data akibat resolusi async yang tidak berurutan.

### Stale-While-Revalidate

List tetap menampilkan data yang sudah ada sambil melakukan refetch di background. Spinner loading hanya muncul saat first load saja. Pola ini dipakai di `app/admin/movies/index.tsx` dan `app/admin/reviews.tsx`.

### Optimistic UI dengan Rollback

Toggle featured di list film admin meng-update UI secara instan, lalu rollback kalau call ke server gagal. Lihat `handleToggleFeatured` di `app/admin/movies/index.tsx`.

### Manual Join saat PostgREST Tidak Bisa Resolve FK

`reviews.user_id` mereferensi ke `auth.users` (bukan `public.profiles`), sehingga PostgREST tidak bisa otomatis me-resolve embedded `profiles(name)`. Query review admin pakai pendekatan manual join dua langkah. Lihat `services/admin-reviews.ts`.

### Field Payload Kondisional

`toDbPayload` di `services/admin-movies.ts` secara kondisional mengabaikan `average_rating` dan `review_count` dari payload update — mencegah penghapusan data tidak sengaja karena form tidak mengekspos kolom-kolom turunan tersebut.

---

## Scripts

| Perintah | Fungsi |
|---|---|
| `npm start` / `npx expo start` | Menjalankan Metro bundler |
| `npm run android` | Buka di emulator Android |
| `npm run ios` | Buka di simulator iOS |
| `npm run web` | Buka di web browser |
| `npm run lint` | Jalankan ESLint |
| `npx tsc --noEmit` | Cek tipe tanpa emit file |

---

## Lisensi

Project ini dibuat untuk keperluan edukasi sebagai bagian dari mata kuliah Mobile App Development.
