import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { startTransition, useCallback, useMemo, useState, type ReactElement } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

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
const SURFACE_CLR = '#111620';
const SURFACE_2_CLR = '#171D2A';

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
          {Array.from({ length: 4 }).map((_, index) => (
            <View key={index} style={styles.statCard}>
              <ShimmerView color={SHIMMER_CLR} style={{ width: 42, height: 22, borderRadius: 6 }} />
              <ShimmerView color={SHIMMER_CLR} style={{ width: 44, height: 8, borderRadius: 6 }} />
            </View>
          ))}
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
  const { user, isLoading: isAuthLoading, signOut } = useAuth();
  const swipeHandlers = useTabSwipe();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  function handleOpenSettings(): void {
    setIsSettingsOpen(true);
  }

  function handleCloseSettings(): void {
    if (isSigningOut) return;
    setIsSettingsOpen(false);
  }

  function handleEditProfile(): void {
    setIsSettingsOpen(false);
    router.push('/profile/edit');
  }

  function handleLogOutPress(): void {
    Alert.alert(
      'Log out?',
      'You can log back in any time with your email and password.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSigningOut(true);
              await signOut();
              setIsSettingsOpen(false);
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Failed to log out.';
              Alert.alert('Log out failed', message);
            } finally {
              setIsSigningOut(false);
            }
          },
        },
      ]
    );
  }

  const [profileDetails, setProfileDetails] = useState<Profile | null>(null);
  const [profileStats, setProfileStats] = useState<ProfileStats | null>(null);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [moviesById, setMoviesById] = useState<Record<string, Movie>>({});
  const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);

  // Refetch on every focus (incl. first mount + returning from Edit Profile modal),
  // so the UI always reflects the latest data in Supabase.
  useFocusEffect(
    useCallback(() => {
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
    }, [isAuthLoading, reloadVersion, user])
  );

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

  function handleOpenWatchlist(): void {
    router.push('/watchlist' as never);
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

                <Pressable
                  onPress={handleOpenSettings}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Open settings"
                  style={({ pressed }) => [styles.settingsBtn, pressed && styles.settingsBtnPressed]}>
                  <Ionicons name="settings-outline" size={20} color="#F5F7FA" />
                </Pressable>

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

              {/* ── Settings bottom sheet ────────────────────────── */}
              <Modal
                visible={isSettingsOpen}
                transparent
                animationType="none"
                onRequestClose={handleCloseSettings}>
                <Pressable style={styles.sheetBackdrop} onPress={handleCloseSettings}>
                  <Animated.View
                    entering={FadeIn.duration(180)}
                    style={StyleSheet.absoluteFillObject}
                  />
                </Pressable>
                <Animated.View
                  entering={SlideInDown.duration(280).easing(Easing.out(Easing.cubic))}
                  exiting={SlideOutDown.duration(220).easing(Easing.in(Easing.cubic))}
                  style={styles.sheet}>
                  <View style={styles.sheetHandle} />
                  <ThemedText style={styles.sheetTitle}>Settings</ThemedText>

                  <Pressable
                    onPress={handleEditProfile}
                    disabled={isSigningOut}
                    style={({ pressed }) => [styles.sheetItem, pressed && styles.sheetItemPressed]}>
                    <Ionicons name="person-outline" size={20} color="#F5F7FA" />
                    <ThemedText style={styles.sheetItemLabel}>Edit Profile</ThemedText>
                    <Ionicons name="chevron-forward" size={18} color={DIM_CLR} />
                  </Pressable>

                  <Pressable
                    onPress={handleLogOutPress}
                    disabled={isSigningOut}
                    style={({ pressed }) => [styles.sheetItem, pressed && styles.sheetItemPressed]}>
                    <Ionicons name="log-out-outline" size={20} color="#F04452" />
                    <ThemedText style={[styles.sheetItemLabel, styles.sheetItemDanger]}>
                      {isSigningOut ? 'Logging out…' : 'Log out'}
                    </ThemedText>
                    <View style={{ width: 18 }} />
                  </Pressable>

                  <Pressable
                    onPress={handleCloseSettings}
                    disabled={isSigningOut}
                    style={({ pressed }) => [styles.sheetCancel, pressed && styles.sheetItemPressed]}>
                    <ThemedText style={styles.sheetCancelText}>Cancel</ThemedText>
                  </Pressable>
                </Animated.View>
              </Modal>

              <View style={styles.body}>
                <Animated.View entering={getEnterAnimation(80)}>
                  <ThemedText style={styles.bio}>{account.bio}</ThemedText>
                </Animated.View>

                <Animated.View entering={getEnterAnimation(120)} style={styles.statsGrid}>
                  {statItems.map((item) => (
                    <View key={item.label} style={styles.statCard}>
                      <ThemedText style={styles.statValue}>{item.value}</ThemedText>
                      <ThemedText style={styles.statLabel}>{item.label}</ThemedText>
                    </View>
                  ))}
                </Animated.View>

                <Animated.View entering={getEnterAnimation(150)} style={styles.actionGrid}>
                  <Pressable
                    onPress={handleOpenWatchlist}
                    style={({ pressed }) => [
                      styles.actionCard,
                      styles.actionCardPrimary,
                      pressed && styles.cardPressed,
                    ]}>
                    <View style={styles.actionIconPrimary}>
                      <Ionicons name="bookmark" size={18} color={BG_CLR} />
                    </View>
                    <View>
                      <ThemedText style={styles.actionLabelPrimary}>Watchlist</ThemedText>
                      <ThemedText style={styles.actionTitlePrimary}>
                        {profileStats?.watchlistCount ?? 0} films saved
                      </ThemedText>
                    </View>
                  </Pressable>

                  <Pressable
                    onPress={handleWriteReview}
                    disabled={!ctaMovie}
                    style={({ pressed }) => [
                      styles.actionCard,
                      !ctaMovie && styles.actionCardDisabled,
                      pressed && ctaMovie && styles.cardPressed,
                    ]}>
                    <View style={styles.actionIcon}>
                      <Ionicons name="create-outline" size={18} color={YELLOW} />
                    </View>
                    <View>
                      <ThemedText style={styles.actionLabel}>Next review</ThemedText>
                      <ThemedText numberOfLines={2} style={styles.actionTitle}>
                        {ctaMovie?.title ?? 'Pick a movie'}
                      </ThemedText>
                    </View>
                  </Pressable>
                </Animated.View>

                {favoriteGenres.length > 0 ? (
                  <Animated.View entering={getEnterAnimation(190)} style={styles.genreRow}>
                    {favoriteGenres.map((genre) => (
                      <View key={genre} style={styles.genreTag}>
                        <ThemedText style={styles.genreText}>{genre}</ThemedText>
                      </View>
                    ))}
                  </Animated.View>
                ) : null}

                <Animated.View entering={getEnterAnimation(240)} style={styles.sectionHeader}>
                  <ThemedText style={styles.sectionLabel}>Recent activity</ThemedText>
                  <ThemedText style={styles.sectionCount}>
                    {activityItems.length > 0 ? 'See all' : 'No entries'}
                  </ThemedText>
                </Animated.View>

                <View style={styles.activityList}>
                  {activityItems.length > 0 ? (
                    activityItems.map(({ review, movie }, index) => (
                      <Animated.View
                        key={review.id}
                        entering={getEnterAnimation(290 + index * ITEM_STAGGER)}>
                        <Pressable
                          style={({ pressed }) => [
                            styles.activityItem,
                            pressed && styles.cardPressed,
                          ]}
                          onPress={() => handleOpenMovie(review.movieId)}>
                          {movie?.posterUrl ? (
                            <Image
                              source={{ uri: movie.posterUrl }}
                              style={styles.activityPoster}
                              contentFit="cover"
                            />
                          ) : (
                            <View style={styles.activityPosterFallback}>
                              <Ionicons name="film-outline" size={16} color={YELLOW} />
                            </View>
                          )}
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
    height: 228,
    overflow: 'hidden',
    backgroundColor: SURFACE_CLR,
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
    height: 228,
    overflow: 'hidden',
    backgroundColor: BG_CLR,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7,9,14,0.78)',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: YELLOW,
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
    borderRadius: 16,
    backgroundColor: SURFACE_2_CLR,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
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
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    minHeight: 66,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.035)',
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 25,
    color: YELLOW,
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '800',
    lineHeight: 11,
    color: DIM_CLR,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
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
    backgroundColor: SURFACE_2_CLR,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  genreText: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
    color: DIM_CLR,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  actionCard: {
    flex: 1,
    minHeight: 96,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: SURFACE_CLR,
    padding: 12,
    justifyContent: 'space-between',
  },
  actionCardPrimary: {
    backgroundColor: YELLOW,
    borderColor: YELLOW,
  },
  actionCardDisabled: {
    opacity: 0.55,
  },
  cardPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
  actionIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: 'rgba(245,200,66,0.12)',
  },
  actionIconPrimary: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: 'rgba(11,13,18,0.14)',
  },
  actionLabel: {
    fontSize: 9,
    fontWeight: '900',
    lineHeight: 12,
    color: DIM_CLR,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  actionLabelPrimary: {
    fontSize: 9,
    fontWeight: '900',
    lineHeight: 12,
    color: 'rgba(11,13,18,0.64)',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 17,
    marginTop: 3,
  },
  actionTitlePrimary: {
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 17,
    marginTop: 3,
    color: BG_CLR,
  },
  queueBtn: {
    backgroundColor: YELLOW,
    borderRadius: 8,
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
    paddingTop: 18,
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
    padding: 9,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(255,255,255,0.035)',
  },
  activityList: {
    gap: 8,
  },
  activityPoster: {
    width: 34,
    height: 48,
    borderRadius: 8,
    backgroundColor: BORDER_CLR,
  },
  activityPosterFallback: {
    width: 34,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SURFACE_2_CLR,
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
  emptyState: {
    borderWidth: 1,
    borderColor: BORDER_CLR,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.035)',
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

  settingsBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(20,24,40,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  settingsBtnPressed: {
    backgroundColor: 'rgba(20,24,40,0.95)',
    opacity: 0.9,
  },

  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#141828',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: BORDER_CLR,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: DIM_CLR,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_CLR,
  },
  sheetItemPressed: {
    opacity: 0.65,
  },
  sheetItemLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#F5F7FA',
  },
  sheetItemDanger: {
    color: '#F04452',
  },
  sheetCancel: {
    marginTop: 14,
    height: 48,
    borderRadius: 12,
    backgroundColor: BORDER_CLR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCancelText: {
    fontSize: 14,
    fontWeight: '800',
    color: DIM_CLR,
    letterSpacing: 0.3,
  },
});
