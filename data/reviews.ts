import { Review } from '@/data/types';

export const reviews: Review[] = [
  {
    id: 'rev-001',
    movieId: 'eclipse-run',
    authorName: 'Jordan N.',
    title: 'Sharp, stylish, and surprisingly emotional',
    body:
      'The chase scenes look huge on a phone screen and the character beats still land. It feels slick without losing the human stakes.',
    rating: 4.8,
    createdAt: '2026-04-10',
  },
  {
    id: 'rev-002',
    movieId: 'eclipse-run',
    authorName: 'Amara',
    title: 'Pure neon adrenaline',
    body:
      'Exactly the kind of late-night thriller you want in a featured slot. The pacing is relentless and the soundtrack rules.',
    rating: 4.6,
    createdAt: '2026-04-08',
  },
  {
    id: 'rev-003',
    movieId: 'neon-empire',
    authorName: 'Kai P.',
    title: 'Messy in the best way',
    body:
      'Big performances, sharp dialogue, and enough visual swagger to carry the slower middle section.',
    rating: 4.2,
    createdAt: '2026-04-05',
    containsSpoilers: true,
  },
  {
    id: 'rev-004',
    movieId: 'the-last-projection',
    authorName: 'Sofia L.',
    title: 'A love letter to old theaters',
    body:
      'Warm, wistful, and a little eerie. It captures the feeling of staying in your seat after the credits just to sit with the mood.',
    rating: 5,
    createdAt: '2026-04-03',
  },
  {
    id: 'rev-005',
    movieId: 'silent-static',
    authorName: 'Micah',
    title: 'Creepy and compact',
    body:
      'Not every twist lands, but the atmosphere is fantastic and the central premise is memorable enough to anchor the whole ride.',
    rating: 4,
    createdAt: '2026-04-01',
  },
];

export function getReviewsForMovie(movieId: string): Review[] {
  return reviews.filter((review) => review.movieId === movieId);
}
