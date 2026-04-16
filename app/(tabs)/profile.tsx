import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { type ReactElement } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { ProfileActivityItem } from '@/components/profile-activity-item';
import { ReviewCard } from '@/components/review-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getMovieById } from '@/data/movies';
import { profile } from '@/data/profile';
import { reviews } from '@/data/reviews';
import { Review } from '@/data/types';
import { useThemeColor } from '@/hooks/use-theme-color';

// Glass style constants — used throughout the screen for consistency
const GLASS_BG = 'rgba(255,255,255,0.06)';
const GLASS_BORDER = 'rgba(255,255,255,0.12)';
const GLASS_INTENSITY = 25;

const SECTION_ENTER_DURATION = 320;
const ITEM_STAGGER = 35;

function getEnterAnimation(delay = 0) {
  return FadeInDown.duration(SECTION_ENTER_DURATION)
    .delay(delay)
    .easing(Easing.out(Easing.cubic))
    .withInitialValues({
      opacity: 0,
      transform: [{ translateY: 14 }],
    });
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

export default function ProfileScreen(): ReactElement {
  const router = useRouter();
  const textMuted = useThemeColor({}, 'textMuted');
  const accent = useThemeColor({}, 'accent');
  const ctaMovie = getMovieById(profile.ctaMovieId);

  // Use backdrop from ctaMovie or the first recent activity movie as ambient background
  const backdropSource =
    ctaMovie?.backdropUrl ??
    getMovieById(profile.recentActivity[0]?.movieId)?.backdropUrl;

  const activityItems = profile.recentActivity
    .map((activity) => {
      const movie = getMovieById(activity.movieId);
      if (!movie) return undefined;
      return { activity, movie };
    })
    .filter(isDefined);
  const recentReviews = profile.recentReviewIds
    .map((reviewId) => reviews.find((review) => review.id === reviewId))
    .filter((review): review is Review => review !== undefined);

  function handleOpenMovie(movieId: string): void {
    router.push(`/movies/${movieId}`);
  }

  function handleWriteReview(): void {
    if (!ctaMovie) return;
    router.push({
      pathname: '/reviews/new',
      params: { movieId: ctaMovie.id },
    });
  }

  return (
    <ThemedView style={styles.screen}>
      {/* Cinematic ambient backdrop — blurred heavily so it acts as a tinted canvas */}
      {backdropSource ? (
        <>
          <Image
            source={{ uri: backdropSource }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            blurRadius={55}
          />
          <LinearGradient
            colors={['rgba(11,13,18,0.55)', 'rgba(11,13,18,0.88)', '#0B0D12']}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFillObject}
          />
        </>
      ) : null}

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          style={styles.scroll}>

          {/* Hero card */}
          <Animated.View entering={getEnterAnimation(0)} style={styles.heroCardWrap}>
            <BlurView intensity={GLASS_INTENSITY} tint="dark" style={styles.heroCard}>
              <View style={styles.heroTopRow}>
                <BlurView intensity={30} tint="light" style={styles.avatar}>
                  <ThemedText style={styles.avatarText}>{profile.account.initials}</ThemedText>
                </BlurView>

                <View style={styles.accountMeta}>
                  <BlurView intensity={20} tint="light" style={styles.badge}>
                    <ThemedText style={[styles.badgeText, { color: accent }]}>
                      {profile.account.badgeLabel}
                    </ThemedText>
                  </BlurView>
                  <ThemedText style={[styles.joinedLabel, { color: textMuted }]}>
                    {profile.account.joinedLabel}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.accountCopy}>
                <ThemedText type="title" style={styles.name}>
                  {profile.account.name}
                </ThemedText>
                <ThemedText style={[styles.username, { color: accent }]}>
                  {profile.account.username}
                </ThemedText>
                <ThemedText style={[styles.bio, { color: textMuted }]}>
                  {profile.account.bio}
                </ThemedText>
              </View>
            </BlurView>
          </Animated.View>

          {/* Section header: Snapshot */}
          <Animated.View entering={getEnterAnimation(70)} style={styles.sectionHeader}>
            <View>
              <ThemedText style={styles.sectionLabel}>Snapshot</ThemedText>
              <ThemedText type="subtitle">Account overview</ThemedText>
            </View>
            <ThemedText style={[styles.sectionMeta, { color: textMuted }]}>4 stats</ThemedText>
          </Animated.View>

          {/* Stats grid */}
          <View style={styles.statsGrid}>
            {profile.stats.map((stat, index) => (
              <Animated.View
                key={stat.label}
                entering={getEnterAnimation(110 + index * ITEM_STAGGER)}
                style={styles.statCardWrap}>
                <BlurView intensity={GLASS_INTENSITY} tint="dark" style={styles.statCard}>
                  <ThemedText style={styles.statValue}>{stat.value}</ThemedText>
                  <ThemedText type="defaultSemiBold">{stat.label}</ThemedText>
                  <ThemedText style={[styles.statNote, { color: textMuted }]}>{stat.note}</ThemedText>
                </BlurView>
              </Animated.View>
            ))}
          </View>

          {/* Taste profile — genre chips */}
          <Animated.View entering={getEnterAnimation(190)} style={styles.section}>
            <ThemedText style={styles.sectionLabel}>Taste profile</ThemedText>
            <ThemedText type="subtitle">Favorite genres</ThemedText>
            <View style={styles.genreRow}>
              {profile.favoriteGenres.map((genre) => (
                <BlurView
                  key={genre}
                  intensity={20}
                  tint="light"
                  style={styles.genreChip}>
                  <ThemedText style={styles.genreText}>{genre}</ThemedText>
                </BlurView>
              ))}
            </View>
          </Animated.View>

          {/* Recent activity */}
          <Animated.View entering={getEnterAnimation(240)} style={styles.sectionHeader}>
            <View>
              <ThemedText style={styles.sectionLabel}>Recent activity</ThemedText>
              <ThemedText type="subtitle">What this account has been up to</ThemedText>
            </View>
            <ThemedText style={[styles.sectionMeta, { color: textMuted }]}>
              {activityItems.length} updates
            </ThemedText>
          </Animated.View>

          <View style={styles.activityList}>
            {activityItems.map(({ activity, movie }, index) => (
              <Animated.View
                key={activity.id}
                entering={getEnterAnimation(290 + index * ITEM_STAGGER)}>
                <ProfileActivityItem
                  activity={activity}
                  movie={movie}
                  onPress={() => handleOpenMovie(movie.id)}
                />
              </Animated.View>
            ))}
          </View>

          {/* Recent reviews */}
          <Animated.View entering={getEnterAnimation(420)} style={styles.sectionHeader}>
            <View>
              <ThemedText style={styles.sectionLabel}>Recent reviews</ThemedText>
              <ThemedText type="subtitle">Community reads in your lane</ThemedText>
            </View>
            <ThemedText style={[styles.sectionMeta, { color: textMuted }]}>
              {recentReviews.length} cards
            </ThemedText>
          </Animated.View>

          <View style={styles.reviewList}>
            {recentReviews.map((review, index) => (
              <Animated.View
                key={review.id}
                entering={getEnterAnimation(470 + index * ITEM_STAGGER)}>
                <ReviewCard review={review} />
              </Animated.View>
            ))}
          </View>

          {/* CTA card */}
          {ctaMovie ? (
            <Animated.View
              entering={getEnterAnimation(580)}
              style={styles.ctaCardWrap}>
              <BlurView intensity={GLASS_INTENSITY} tint="dark" style={styles.ctaCard}>
                <ThemedText style={styles.sectionLabel}>Next up</ThemedText>
                <ThemedText type="subtitle">Write your next dummy review</ThemedText>
                <ThemedText style={[styles.ctaCopy, { color: textMuted }]}>
                  Jump straight into the existing review flow for {ctaMovie.title} and keep the demo
                  streak going.
                </ThemedText>

                <View style={styles.ctaMetaRow}>
                  <BlurView intensity={18} tint="light" style={styles.metaChip}>
                    <ThemedText style={styles.metaChipText}>{ctaMovie.year}</ThemedText>
                  </BlurView>
                  <BlurView intensity={18} tint="light" style={styles.metaChip}>
                    <ThemedText style={styles.metaChipText}>{ctaMovie.genres[0]}</ThemedText>
                  </BlurView>
                  <BlurView intensity={18} tint="light" style={styles.metaChip}>
                    <ThemedText style={styles.metaChipText}>{ctaMovie.runtimeMinutes} min</ThemedText>
                  </BlurView>
                </View>

                <PrimaryButton label={`Review ${ctaMovie.title}`} onPress={handleWriteReview} />
              </BlurView>
            </Animated.View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0B0D12',
  },
  scroll: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    gap: 20,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  // Hero card wrapper needed so BlurView gets proper border-radius clip
  heroCardWrap: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GLASS_BORDER,
  },
  heroCard: {
    gap: 18,
    padding: 20,
    backgroundColor: GLASS_BG,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  // Avatar wrapper — BlurView needs overflow:hidden to clip border-radius
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 78,
    height: 78,
    borderRadius: 39,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  avatarText: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
  },
  accountMeta: {
    alignItems: 'flex-end',
    gap: 10,
  },
  badge: {
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: GLASS_BG,
  },
  badgeText: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  joinedLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  accountCopy: {
    gap: 8,
  },
  name: {
    lineHeight: 36,
  },
  username: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  bio: {
    fontSize: 15,
    lineHeight: 22,
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  sectionMeta: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCardWrap: {
    width: '48%',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GLASS_BORDER,
  },
  statCard: {
    gap: 6,
    padding: 16,
    backgroundColor: GLASS_BG,
  },
  statValue: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
  },
  statNote: {
    fontSize: 13,
    lineHeight: 18,
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  genreChip: {
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: GLASS_BG,
  },
  genreText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  activityList: {
    gap: 12,
  },
  reviewList: {
    gap: 14,
  },
  ctaCardWrap: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GLASS_BORDER,
  },
  ctaCard: {
    gap: 14,
    padding: 18,
    backgroundColor: GLASS_BG,
  },
  ctaCopy: {
    fontSize: 15,
    lineHeight: 22,
  },
  ctaMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metaChip: {
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: GLASS_BG,
  },
  metaChipText: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '700',
  },
});
