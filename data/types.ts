export type Movie = {
  id: string;
  title: string;
  tagline: string;
  year: number;
  runtimeMinutes: number;
  genres: string[];
  director: string;
  synopsis: string;
  posterUrl: string;
  backdropUrl: string;
  averageRating: number;
  reviewCount: number;
  isFeatured?: boolean;
  /** Lightweight flag for cards/lists. Populated by `getMoviesFiltered`. */
  hasWinningAward?: boolean;
  /** Full awards list. Populated by `getMovieById`. */
  awards?: Award[];
};

export type Award = {
  id: number;
  movieId: Movie['id'];
  awardName: string;        // "Best Picture"
  organization: string;     // "Academy Awards"
  year: number;
  category?: string | null; // nullable
  isWinner: boolean;
};

export type Review = {
  id: string;
  movieId: Movie['id'];
  authorName: string;
  title: string;
  body: string;
  rating: number;
  tags?: string[];
  containsSpoilers?: boolean;
  createdAt: string;
  /** Null if the review has never been edited. */
  updatedAt?: string | null;
};

export type UserRole = 'user' | 'admin';

export type Profile = {
  id: string;
  name: string;
  username?: string;
  initials: string;
  bio: string;
  badgeLabel: string;
  favoriteGenres: string[];
  role: UserRole;
};
