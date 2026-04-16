import { Movie } from '@/data/types';

export const movies: Movie[] = [
  {
    id: 'eclipse-run',
    title: 'Eclipse Run',
    tagline: 'A midnight getaway through a city that never forgives.',
    year: 2026,
    runtimeMinutes: 118,
    genres: ['Thriller', 'Sci-Fi'],
    director: 'Mina Vale',
    synopsis:
      'A former getaway driver is pulled into one last job after a citywide blackout reveals a conspiracy hiding inside the transit grid.',
    posterUrl:
      'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=900&q=80',
    backdropUrl:
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1400&q=80',
    averageRating: 4.7,
    reviewCount: 128,
  },
  {
    id: 'neon-empire',
    title: 'Neon Empire',
    tagline: 'Every frame is a power move.',
    year: 2025,
    runtimeMinutes: 134,
    genres: ['Drama', 'Crime'],
    director: 'Andre Kessler',
    synopsis:
      'A pop icon turned media mogul wages a stylized war for control of the city’s biggest streaming network.',
    posterUrl:
      'https://images.unsplash.com/photo-1513106580091-1d82408b8cd6?auto=format&fit=crop&w=900&q=80',
    backdropUrl:
      'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=1400&q=80',
    averageRating: 4.3,
    reviewCount: 86,
  },
  {
    id: 'the-last-projection',
    title: 'The Last Projection',
    tagline: 'One theater. One reel. One final chance to remember.',
    year: 2024,
    runtimeMinutes: 109,
    genres: ['Mystery', 'Drama'],
    director: 'Lena Hart',
    synopsis:
      'When a historic cinema is set to close, its projectionist uncovers a lost film that seems to rewrite the memories of everyone who watches it.',
    posterUrl:
      'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=900&q=80',
    backdropUrl:
      'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1400&q=80',
    averageRating: 4.8,
    reviewCount: 204,
  },
  {
    id: 'silent-static',
    title: 'Silent Static',
    tagline: 'The signal was never dead. It was listening.',
    year: 2026,
    runtimeMinutes: 96,
    genres: ['Horror', 'Mystery'],
    director: 'Jonah Cross',
    synopsis:
      'A late-night radio host follows a ghost frequency across the desert and discovers that every caller already knows her name.',
    posterUrl:
      'https://images.unsplash.com/photo-1505685296765-3a2736de412f?auto=format&fit=crop&w=900&q=80',
    backdropUrl:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80',
    averageRating: 4.1,
    reviewCount: 59,
  },
];

export const featuredMovie = movies.find((m) => m.id === 'the-last-projection') ?? movies[0];

export function getMovieById(id: string): Movie | undefined {
  return movies.find((movie) => movie.id === id);
}
