import { Movie } from '@/data/types';

export const movies: Movie[] = [
  {
    id: 'inception',
    title: 'Inception',
    tagline: 'Your mind is the scene of the crime.',
    year: 2010,
    runtimeMinutes: 148,
    genres: ['Sci-Fi', 'Action', 'Thriller'],
    director: 'Christopher Nolan',
    synopsis:
      'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O., but his tragic past may doom the project and his team to disaster.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/s3TBrRGB1iav7gFOCNx3H31MoES.jpg',
    averageRating: 8.8,
    reviewCount: 4821,
    isFeatured: true,
  },
  {
    id: 'the-dark-knight',
    title: 'The Dark Knight',
    tagline: 'Why so serious?',
    year: 2008,
    runtimeMinutes: 152,
    genres: ['Action', 'Crime', 'Drama'],
    director: 'Christopher Nolan',
    synopsis:
      'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/hqkIcbrOHL86UncnHIsHVcVmzue.jpg',
    averageRating: 9.0,
    reviewCount: 6512,
  },
  {
    id: 'interstellar',
    title: 'Interstellar',
    tagline: 'Mankind was born on Earth. It was never meant to die here.',
    year: 2014,
    runtimeMinutes: 169,
    genres: ['Sci-Fi', 'Drama', 'Adventure'],
    director: 'Christopher Nolan',
    synopsis:
      'The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
    averageRating: 8.7,
    reviewCount: 5103,
  },
  {
    id: 'parasite',
    title: 'Parasite',
    tagline: 'Act like you own the place.',
    year: 2019,
    runtimeMinutes: 132,
    genres: ['Thriller', 'Comedy', 'Drama'],
    director: 'Bong Joon-ho',
    synopsis:
      'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/TU9NIjwzjoKPwQHoHshkFcQUCG.jpg',
    averageRating: 8.6,
    reviewCount: 4420,
  },
  {
    id: 'everything-everywhere',
    title: 'Everything Everywhere All at Once',
    tagline: 'The fate of the multiverse rests on the shoulders of a middle-aged Chinese laundromat owner.',
    year: 2022,
    runtimeMinutes: 139,
    genres: ['Sci-Fi', 'Action', 'Comedy'],
    director: 'Daniel Kwan & Daniel Scheinert',
    synopsis:
      'An aging Chinese immigrant is swept up in an insane adventure in which she alone can save existence by exploring other universes connecting with the lives she could have led.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/feSiISwgEpVzR1v3zv2n2NSa0aZ.jpg',
    averageRating: 8.0,
    reviewCount: 3971,
  },
  {
    id: 'oppenheimer',
    title: 'Oppenheimer',
    tagline: 'The world forever changes.',
    year: 2023,
    runtimeMinutes: 180,
    genres: ['Drama', 'History', 'Thriller'],
    director: 'Christopher Nolan',
    synopsis:
      'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg',
    averageRating: 8.2,
    reviewCount: 4188,
  },
  {
    id: 'dune-2021',
    title: 'Dune: Part One',
    tagline: 'Beyond fear, destiny awaits.',
    year: 2021,
    runtimeMinutes: 155,
    genres: ['Sci-Fi', 'Adventure', 'Drama'],
    director: 'Denis Villeneuve',
    synopsis:
      'Paul Atreides must travel to the most dangerous planet in the universe to ensure the future of his family and his people.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV61Q0SIH5fD.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/jYEW5xZkZk2WTrdbMGAPFuBqbDc.jpg',
    averageRating: 7.9,
    reviewCount: 3640,
  },
  {
    id: 'blade-runner-2049',
    title: 'Blade Runner 2049',
    tagline: 'The key to the future is finally unearthed.',
    year: 2017,
    runtimeMinutes: 164,
    genres: ['Sci-Fi', 'Drama', 'Mystery'],
    director: 'Denis Villeneuve',
    synopsis:
      'A young blade runner\'s discovery of a long-buried secret leads him to track down former blade runner Rick Deckard, who\'s been missing for thirty years.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/ilRyazdMlwGFGo7JoerXqF6QLCR.jpg',
    averageRating: 8.0,
    reviewCount: 2910,
  },
];

export const featuredMovie = movies.find((m) => m.isFeatured) ?? movies[0];

export function getMovieById(id: string): Movie | undefined {
  return movies.find((movie) => movie.id === id);
}
