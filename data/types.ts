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
};

export type Review = {
  id: string;
  movieId: Movie['id'];
  authorName: string;
  title: string;
  body: string;
  rating: number;
  createdAt: string;
  containsSpoilers?: boolean;
};
