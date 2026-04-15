import { Movie, Review } from '@/data/types';

export type ProfileStat = {
  label: string;
  value: string;
  note: string;
};

export type ProfileActivity = {
  id: string;
  type: 'reviewed' | 'rated' | 'watchlisted';
  movieId: Movie['id'];
  title: string;
  detail: string;
  timestampLabel: string;
  rating?: number;
};

export type ProfileData = {
  account: {
    name: string;
    username: string;
    initials: string;
    bio: string;
    joinedLabel: string;
    badgeLabel: string;
  };
  stats: ProfileStat[];
  favoriteGenres: string[];
  recentActivity: ProfileActivity[];
  recentReviewIds: Review['id'][];
  ctaMovieId: Movie['id'];
};

export const profile: ProfileData = {
  account: {
    name: 'Jordan Stone',
    username: '@jordannst',
    initials: 'JS',
    bio: 'Seeded demo account for the MovieReview MVP. Mostly here for sleek thrillers, repertory mysteries, and a dependable Sunday review streak.',
    joinedLabel: 'Joined April 2026',
    badgeLabel: 'Dummy account',
  },
  stats: [
    {
      label: 'Reviews',
      value: '18',
      note: '4 posted this month',
    },
    {
      label: 'Avg. rating',
      value: '4.4',
      note: 'Leans atmospheric',
    },
    {
      label: 'Watchlist',
      value: '12',
      note: 'Weekend queue',
    },
    {
      label: 'Streak',
      value: '6 wk',
      note: 'Checked in weekly',
    },
  ],
  favoriteGenres: ['Thriller', 'Mystery', 'Drama', 'Sci-Fi', 'Horror'],
  recentActivity: [
    {
      id: 'activity-001',
      type: 'reviewed',
      movieId: 'eclipse-run',
      title: 'Logged a standout review',
      detail: 'Called out the blackout chase and the emotional finish as the big reason it stayed with me.',
      timestampLabel: '2h ago',
      rating: 4.8,
    },
    {
      id: 'activity-002',
      type: 'watchlisted',
      movieId: 'the-last-projection',
      title: 'Saved a repertory rewatch',
      detail: 'Keeping this one for the weekend mystery slot when the mood calls for something wistful.',
      timestampLabel: 'Yesterday',
    },
    {
      id: 'activity-003',
      type: 'rated',
      movieId: 'silent-static',
      title: 'Dropped a quick late-night rating',
      detail: 'The atmosphere landed harder than the final twist, which still makes it easy to recommend.',
      timestampLabel: '3d ago',
      rating: 4,
    },
    {
      id: 'activity-004',
      type: 'reviewed',
      movieId: 'neon-empire',
      title: 'Shared notes with friends',
      detail: 'Filed it under stylish dramas worth revisiting for the dialogue and oversized performances alone.',
      timestampLabel: 'Last week',
      rating: 4.2,
    },
  ],
  recentReviewIds: ['rev-001', 'rev-004', 'rev-005'],
  ctaMovieId: 'eclipse-run',
};
