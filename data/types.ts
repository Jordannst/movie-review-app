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

export type Profile = {
  id: string;
  name: string;
  username?: string;
  initials: string;
  bio: string;
  badgeLabel: string;
  favoriteGenres: string[];
};
