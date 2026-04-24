import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { startTransition, type ReactElement, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ReviewCard } from '@/components/review-card';
import { ShimmerView } from '@/components/shimmer-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import { Movie, Profile, Review } from '@/data/types';
import { useTabSwipe } from '@/hooks/use-tab-swipe';
import { getFeaturedMovie, getMovies } from '@/services/movies';
import {
  deriveInitials,
  getCurrentUserProfile,
  getProfileStats,
  getUserReviews,
  type ProfileStats,
} from '@/services/profile';

const YELLOW = '#F5C842';
const BORDER_CLR = '#1A1D2A';
const DIM_CLR = '#5A607A';
const BG_CLR = '#0B0D12';
const SHIMMER_CLR = '#1A1D2A';

const ENTER_DURATION = 300;
const ITEM_STAGGER = 40;

type ProfileAccount = {
  name: string;
  username: string;
  initials: string;
  bio: string;
  badgeLabel: string;
};

function getEnterAnimation(delay = 0) {
  return FadeInDown.duration(ENTER_DURATION)
    .delay(delay)
    .easing(Easing.out(Easing.cubic))
    .withInitialValues({ opacity: 0, transform: [{ translateY: 10 }] });
}

function getMetadataString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function formatReviewDate(createdAt: string): string {
  const [year, month, day] = createdAt.split('-').map(Number);
  const localDate = new Date(year, (month ?? 1) - 1, day ?? 1);

  return localDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatCount(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return value.toString();
}

function buildAccount(profile: Profile | null, userEmail?: string, userName?: string): ProfileAccount {
  const emailName = userEmail?.split('@')[0];
  const name = profile?.name?.trim() || userName || emailName || 'Movie fan';
  const username = profile?.username?.trim()
    ? profile.username.startsWith('@')
      ? profile.username
      : `@${profile.username}`
    : userEmail ?? '@member';

  return {
    name,
    username,
    initials: profile?.initials?.trim() || deriveInitials(name, userEmail),
    bio: profile?.bio?.trim() || 'No bio yet.',
    badgeLabel: profile?.badgeLabel?.trim() || 'Member',
  };
}

function ProfileLoadingSkeleton(): ReactElement {
  return (
    <>
      <View style={styles.loadingHero}>
        <View style={styles.accentBar} />
        <View style={styles.loadingHeroBottom}>
          <ShimmerView color={SHIMMER_CLR} style={{ width: 64, height: 64, borderRadius: 10 }} />
          <View style={{ gap: 8, flex: 1 }}>
            <ShimmerView color={SHIMMER_CLR} style={{ width: '52%', height: 20, borderRadius: 6 }} />
            <ShimmerView color={SHIMMER_CLR} style={{ width: '38%', height: 12, borderRadius: 6 }} />
            <ShimmerView color={SHIMMER_CLR} style={{ width: 86, height: 12, borderRadius: 6 }} />
          </View>
        </View>
      </View>

      <View style={styles.loadingBody}>
        <ShimmerView color={SHIMMER_CLR} style={{ width: '100%', height: 44, borderRadius: 8 }} />
        <View style={styles.statsGrid}>
          <View style={styles.statRow}>
            <View style={[styles.statCell, styles.statBorderR, styles.statBorderB]}>
              <ShimmerView color={SHIMMER_CLR} style={{ width: 54, height: 24, borderRadius: 6 }} />
            </View>
            <View style={[styles.statCell, styles.statBorderB]}>
              <ShimmerView color={SHIMMER_CLR} style={{ width: 54, height: 24, borderRadius: 6 }} />
            </View>
          </View>
          <View style={styles.statRow}>
            <View style={[styles.statCell, styles.statBorderR]}>
              <ShimmerView color={SHIMMER_CLR} style={{ width: 54, height: 24, borderRadius: 6 }} />
            </View>
            <View style={styles.statCell}>
              <ShimmerView color={SHIMMER_CLR} style={{ width: 54, height: 24, borderRadius: 6 }} />
            </View>
          </View>
        </View>
        {Array.from({ length: 3 }).map((_, index) => (
          <ShimmerView
            key={index}
            color={SHIMMER_CLR}
            style={{ width: '100%', height: 58, borderRadius: 8 }}
            duration={900 + index * 80}
          />
        ))}
      </View>
    </>
  );
}

export default function ProfileScreen(): ReactElement {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const swipeHandlers = useTabSwipe();

  const [profileDetails, setProfileDetails] = useState<Profile | null>(null);
  const [profileStats, setProfileStats] = useState<ProfileStats | null>(null);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [moviesById, setMoviesById] = useState<Record<string, Movie>>({});
  const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);

  useEffect(() => {
    let isActive = true;

    async function loadProfile() {
      if (isAuthLoading) return;

      if (!user) {
        setProfileDetails(null);
        setProfileStats(null);
        setRecentReviews([]);
        setMoviesById({});
        setFeaturedMovie(null);
        setLoadError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        const [profileData, statsData, reviewsData, moviesData, featuredData] = await Promise.all([
          getCurrentUserProfile(),
          getProfileStats(user.id),
          getUserReviews(user.id, 4),
          getMovies(),
          getFeaturedMovie(),
        ]);

        if (!isActive) return;

        const nextMoviesById = moviesData.reduce<Record<string, Movie>>((acc, movie) => {
          acc[movie.id] = movie;
          return acc;
        }, {});

        startTransition(() => {
          setProfileDetails(profileData);
          setProfileStats(statsData);
          setRecentReviews(reviewsData);
          setMoviesById(nextMoviesById);
          setFeaturedMovie(featuredData ?? moviesData[0] ?? null);
        });
      } catch (error) {
        if (!isActive) return;
        setLoadError(error instanceof Error ? error.message : 'Failed to load profile from Supabase.');
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      isActive = false;
    };
  }, [isAuthLoading, reloadVersion, user]);

  const metadataName = useMemo(
    () =>
      getMetadataString(user?.user_metadata?.name) ??
      getMetadataString(user?.user_metadata?.full_name),
    [user?.user_metadata]
  );

  const account = useMemo(
    () => buildAccount(profileDetails, user?.email, metadataName),
    [metadataName, profileDetails, user?.email]
  );

  const favoriteGenres = profileDetails?.favoriteGenres ?? [];

  const statItems = useMemo(
    () => [
      {
        label: 'Reviews',
        value: formatCount(profileStats?.reviewsCount ?? 0),
      },
      {
        label: 'Avg. rating',
        value:
          profileStats?.averageRating === null || profileStats?.averageRating === undefined
            ? '-'
            : profileStats.averageRating.toFixed(1),
      },
      {
        label: 'Watchlist',
        value: formatCount(profileStats?.watchlistCount ?? 0),
      },
      {
        label: 'Genres',
        value: formatCount(favoriteGenres.length),
      },
    ],
    [favoriteGenres.length, profileStats]
  );

  const activityItems = useMemo(
    () =>
      recentReviews.map((review) => ({
        review,
        movie: moviesById[review.movieId],
      })),
    [moviesById, recentReviews]
  );

  const ctaMovie = featuredMovie ?? activityItems.find((item) => item.movie)?.movie ?? null;
  const backdropSource =
    activityItems.find((item) => item.movie?.backdropUrl)?.movie?.backdropUrl ??
    ctaMovie?.backdropUrl;

  function handleOpenMovie(movieId: string): void {
    router.push(`/movies/${movieId}`);
  }

  function handleWriteReview(): void {
    if (!ctaMovie) return;
    router.push({ pathname: '/reviews/new', params: { movieId: ctaMovie.id } });
  }

  function handleRetry(): void {
    setReloadVersion((current) => current + 1);
  }

  return (
    <ThemedView style={styles.screen} {...swipeHandlers}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
          contentContainerStyle={styles.content}>
          {isLoading && !loadError ? (
            <ProfileLoadingSkeleton />
          ) : loadError ? (
            <View style={styles.statusCard}>
              <ThemedText style={styles.statusTitle}>Could not load profile</ThemedText>
              <ThemedText style={styles.statusCopy}>{loadError}</ThemedText>
              <Pressable onPress={handleRetry} style={styles.queueBtn}>
                <ThemedText style={styles.queueBtnText}>Retry</ThemedText>
              </Pressable>
            </View>
          ) : !user ? (
            <View style={styles.statusCard}>
              <ThemedText style={styles.statusTitle}>Profile unavailable</ThemedText>
              <ThemedText style={styles.statusCopy}>Sign in to view your profile.</ThemedText>
            </View>
          ) : (
            <>
              <Animated.View entering={FadeIn.duration(400)} style={styles.hero}>
                {backdropSource ? (
                  <Image
                    source={{ uri: backdropSource }}
                    style={StyleSheet.absoluteFillObject}
                    contentFit="cover"
                    blurRadius={60}
                  />
                ) : null}

                <View style={styles.heroOverlay} />
                <View style={styles.accentBar} />
                <ThemedText style={styles.ghostNum}>01</ThemedText>

                <View style={styles.heroBottom}>
                  <View style={styles.avatarSquare}>
                    <ThemedText style={styles.avatarText}>{account.initials}</ThemedText>
                  </View>
                  <View style={styles.heroNameStack}>
                    <ThemedText style={styles.heroName}>{account.name}</ThemedText>
                    <ThemedText style={styles.heroUsername}>{account.username}</ThemedText>
                    <View style={styles.heroBadge}>
                      <View style={styles.badgeDot} />
                      <ThemedText style={styles.badgeText}>
                        {account.badgeLabel.toUpperCase()}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </Animated.View>

              <View style={styles.body}>
                <Animated.View entering={getEnterAnimation(80)}>
                  <ThemedText style={styles.bio}>{account.bio}</ThemedText>
                </Animated.View>

                <Animated.View entering={getEnterAnimation(120)} style={styles.statsGrid}>
                  <View style={styles.statRow}>
                    <View style={[styles.statCell, styles.statBorderR, styles.statBorderB]}>
                      <ThemedText style={styles.statValue}>{statItems[0].value}</ThemedText>
                      <ThemedText style={styles.statLabel}>{statItems[0].label}</ThemedText>
                    </View>
                    <View style={[styles.statCell, styles.statBorderB]}>
                      <ThemedText style={styles.statValue}>{statItems[1].value}</ThemedText>
                      <ThemedText style={styles.statLabel}>{statItems[1].label}</ThemedText>
                    </View>
                  </View>
                  <View style={styles.statRow}>
                    <View style={[styles.statCell, styles.statBorderR]}>
                      <ThemedText style={styles.statValue}>{statItems[2].value}</ThemedText>
                      <ThemedText style={styles.statLabel}>{statItems[2].label}</ThemedText>
                    </View>
                    <View style={styles.statCell}>
                      <ThemedText style={styles.statValue}>{statItems[3].value}</ThemedText>
                      <ThemedText style={styles.statLabel}>{statItems[3].label}</ThemedText>
                    </View>
                  </View>
                </Animated.View>

                {favoriteGenres.length > 0 ? (
                  <Animated.View entering={getEnterAnimation(160)} style={styles.genreRow}>
                    {favoriteGenres.map((genre) => (
                      <View key={genre} style={styles.genreTag}>
                        <ThemedText style={styles.genreText}>{genre}</ThemedText>
                      </View>
                    ))}
                  </Animated.View>
                ) : null}

                <View style={styles.divider} />

                {ctaMovie ? (
                  <Animated.View entering={getEnterAnimation(200)} style={styles.queueRow}>
                    <View style={styles.queueCopy}>
                      <ThemedText style={styles.queueLabel}>Review queue</ThemedText>
                      <ThemedText style={styles.queueTitle}>{ctaMovie.title}</ThemedText>
                    </View>
                    <Pressable onPress={handleWriteReview} style={styles.queueBtn}>
                      <ThemedText style={styles.queueBtnText}>Write -&gt;</ThemedText>
                    </Pressable>
                  </Animated.View>
                ) : null}

                <View style={styles.divider} />

                <Animated.View entering={getEnterAnimation(250)} style={styles.sectionHeader}>
                  <ThemedText style={styles.sectionLabel}>Activity log</ThemedText>
                  <ThemedText style={styles.sectionCount}>
                    {activityItems.length} entries
                  </ThemedText>
                </Animated.View>

                <View>
                  {activityItems.length > 0 ? (
                    activityItems.map(({ review, movie }, index) => (
                      <Animated.View
                        key={review.id}
                        entering={getEnterAnimation(290 + index * ITEM_STAGGER)}>
                        <Pressable
                          style={styles.activityItem}
                          onPress={() => handleOpenMovie(review.movieId)}>
                          <ThemedText style={styles.activityIcon}>R</ThemedText>
                          <View style={styles.activityInfo}>
                            <ThemedText style={styles.activityTitle}>
                              {movie?.title ?? review.movieId}
                            </ThemedText>
                            <ThemedText style={styles.activityMeta}>
                              Reviewed on {formatReviewDate(review.createdAt)}
                            </ThemedText>
                          </View>
                          <ThemedText style={styles.activityRating}>
                            {review.rating.toFixed(1)}/5
                          </ThemedText>
                        </Pressable>
                      </Animated.View>
                    ))
                  ) : (
                    <View style={styles.emptyState}>
                      <ThemedText style={styles.emptyStateText}>
                        No review activity yet.
                      </ThemedText>
                    </View>
                  )}
                </View>

                <View style={styles.divider} />

                <Animated.View entering={getEnterAnimation(430)} style={styles.sectionHeader}>
                  <ThemedText style={styles.sectionLabel}>Recent reviews</ThemedText>
                  <ThemedText style={styles.sectionCount}>
                    {recentReviews.length} cards
                  </ThemedText>
                </Animated.View>

                <View style={styles.reviewList}>
                  {recentReviews.length > 0 ? (
                    recentReviews.map((review, index) => (
                      <Animated.View
                        key={review.id}
                        entering={getEnterAnimation(470 + index * ITEM_STAGGER)}>
                        <ReviewCard review={review} />
                      </Animated.View>
                    ))
                  ) : (
                    <View style={styles.emptyState}>
                      <ThemedText style={styles.emptyStateText}>
                        Your reviews will appear here after they are saved in Supabase.
                      </ThemedText>
                    </View>
                  )}
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG_CLR,
  },
  safeArea: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 48,
  },
  loadingHero: {
    width: '100%',
    height: 210,
    overflow: 'hidden',
    backgroundColor: BG_CLR,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  loadingHeroBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  loadingBody: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 14,
  },
  hero: {
    width: '100%',
    height: 210,
    overflow: 'hidden',
    backgroundColor: BG_CLR,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7,9,14,0.88)',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: YELLOW,
  },
  ghostNum: {
    position: 'absolute',
    right: -6,
    top: 8,
    fontSize: 110,
    fontWeight: '900',
    color: '#FFFFFF',
    opacity: 0.035,
    lineHeight: 120,
  },
  heroBottom: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  avatarSquare: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#1A1D2A',
    borderWidth: 1,
    borderColor: '#2A2F44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 24,
  },
  heroNameStack: {
    flex: 1,
    flexDirection: 'column',
    gap: 3,
    paddingBottom: 3,
  },
  heroName: {
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 26,
  },
  heroUsername: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    color: DIM_CLR,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: YELLOW,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 12,
    color: YELLOW,
    letterSpacing: 0.8,
  },
  body: {
    paddingHorizontal: 16,
  },
  bio: {
    fontSize: 13,
    lineHeight: 20,
    color: DIM_CLR,
    marginTop: 16,
  },
  statsGrid: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: BORDER_CLR,
  },
  statRow: {
    flexDirection: 'row',
    width: '100%',
  },
  statCell: {
    flex: 1,
    minHeight: 74,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  statBorderR: {
    borderRightWidth: 1,
    borderRightColor: BORDER_CLR,
  },
  statBorderB: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER_CLR,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 28,
    color: YELLOW,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 14,
    color: DIM_CLR,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  genreTag: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: BORDER_CLR,
    borderRadius: 4,
  },
  genreText: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
    color: DIM_CLR,
  },
  divider: {
    height: 1,
    backgroundColor: BORDER_CLR,
    marginTop: 16,
  },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    gap: 12,
  },
  queueCopy: {
    flex: 1,
  },
  queueLabel: {
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 12,
    color: DIM_CLR,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  queueTitle: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
    marginTop: 3,
  },
  queueBtn: {
    backgroundColor: YELLOW,
    borderRadius: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    alignSelf: 'flex-start',
  },
  queueBtnText: {
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 17,
    color: BG_CLR,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 13,
    color: DIM_CLR,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  sectionCount: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 13,
    color: YELLOW,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_CLR,
  },
  activityIcon: {
    fontSize: 12,
    lineHeight: 18,
    width: 22,
    textAlign: 'center',
    color: YELLOW,
    fontWeight: '900',
  },
  activityInfo: {
    flex: 1,
    gap: 3,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
  },
  activityMeta: {
    fontSize: 11,
    lineHeight: 15,
    color: DIM_CLR,
  },
  activityRating: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    color: YELLOW,
  },
  reviewList: {
    gap: 12,
  },
  emptyState: {
    borderWidth: 1,
    borderColor: BORDER_CLR,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  emptyStateText: {
    fontSize: 12,
    lineHeight: 18,
    color: DIM_CLR,
  },
  statusCard: {
    margin: 16,
    borderWidth: 1,
    borderColor: BORDER_CLR,
    padding: 16,
    gap: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 24,
  },
  statusCopy: {
    fontSize: 13,
    lineHeight: 20,
    color: DIM_CLR,
  },
});
