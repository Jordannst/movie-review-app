import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { type ReactElement } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ReviewCard } from '@/components/review-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getMovieById } from '@/data/movies';
import { profile, type ProfileActivity } from '@/data/profile';
import { reviews } from '@/data/reviews';
import { type Review } from '@/data/types';
import { useTabSwipe } from '@/hooks/use-tab-swipe';

// ── Brutalist Dark — design tokens ──────────────────────────────
const YELLOW = '#F5C842';
const BORDER_CLR = '#1A1D2A';
const DIM_CLR = '#5A607A';
const BG_CLR = '#0B0D12';

const ENTER_DURATION = 300;
const ITEM_STAGGER = 40;

function getEnterAnimation(delay = 0) {
  return FadeInDown.duration(ENTER_DURATION)
    .delay(delay)
    .easing(Easing.out(Easing.cubic))
    .withInitialValues({ opacity: 0, transform: [{ translateY: 10 }] });
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

function getActivityIcon(type: ProfileActivity['type']): string {
  if (type === 'reviewed') return '📝';
  if (type === 'rated') return '⭐';
  return '＋';
}

export default function ProfileScreen(): ReactElement {
  const router = useRouter();
  const swipeHandlers = useTabSwipe();

  const ctaMovie = getMovieById(profile.ctaMovieId);
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
    .map((id) => reviews.find((r) => r.id === id))
    .filter((r): r is Review => r !== undefined);

  function handleOpenMovie(movieId: string): void {
    router.push(`/movies/${movieId}`);
  }

  function handleWriteReview(): void {
    if (!ctaMovie) return;
    router.push({ pathname: '/reviews/new', params: { movieId: ctaMovie.id } });
  }

  return (
    <ThemedView style={styles.screen} {...swipeHandlers}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
          contentContainerStyle={styles.content}>

          {/* ── Hero ─────────────────────────────────────────────── */}
          <Animated.View entering={FadeIn.duration(400)} style={styles.hero}>
            {/* Blurred backdrop — very dark overlay on top */}
            {backdropSource ? (
              <Image
                source={{ uri: backdropSource }}
                style={StyleSheet.absoluteFillObject}
                contentFit="cover"
                blurRadius={60}
              />
            ) : null}

            {/* Near-black overlay — enough to read text, backdrop is just texture */}
            <View style={styles.heroOverlay} />

            {/* Yellow accent bar — brutalist left edge */}
            <View style={styles.accentBar} />

            {/* Ghost number — large background decoration */}
            <ThemedText style={styles.ghostNum}>01</ThemedText>

            {/* Bottom row: avatar + name stack */}
            <View style={styles.heroBottom}>
              <View style={styles.avatarSquare}>
                <ThemedText style={styles.avatarText}>
                  {profile.account.initials}
                </ThemedText>
              </View>
              <View style={styles.heroNameStack}>
                <ThemedText style={styles.heroName}>
                  {profile.account.name}
                </ThemedText>
                <ThemedText style={styles.heroUsername}>
                  {profile.account.username}
                </ThemedText>
                <View style={styles.heroBadge}>
                  <View style={styles.badgeDot} />
                  <ThemedText style={styles.badgeText}>
                    {profile.account.badgeLabel.toUpperCase()}
                  </ThemedText>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* ── Body ──────────────────────────────────────────────── */}
          <View style={styles.body}>

            {/* Bio — left-aligned, no centering */}
            <Animated.View entering={getEnterAnimation(80)}>
              <ThemedText style={styles.bio}>{profile.account.bio}</ThemedText>
            </Animated.View>

            {/* Stats — 2×2 sharp grid, yellow numbers */}
            <Animated.View entering={getEnterAnimation(120)} style={styles.statsGrid}>
              <View style={styles.statRow}>
                <View style={[styles.statCell, styles.statBorderR, styles.statBorderB]}>
                  <ThemedText style={styles.statValue}>{profile.stats[0]?.value}</ThemedText>
                  <ThemedText style={styles.statLabel}>{profile.stats[0]?.label}</ThemedText>
                </View>
                <View style={[styles.statCell, styles.statBorderB]}>
                  <ThemedText style={styles.statValue}>{profile.stats[1]?.value}</ThemedText>
                  <ThemedText style={styles.statLabel}>{profile.stats[1]?.label}</ThemedText>
                </View>
              </View>
              <View style={styles.statRow}>
                <View style={[styles.statCell, styles.statBorderR]}>
                  <ThemedText style={styles.statValue}>{profile.stats[2]?.value}</ThemedText>
                  <ThemedText style={styles.statLabel}>{profile.stats[2]?.label}</ThemedText>
                </View>
                <View style={styles.statCell}>
                  <ThemedText style={styles.statValue}>{profile.stats[3]?.value}</ThemedText>
                  <ThemedText style={styles.statLabel}>{profile.stats[3]?.label}</ThemedText>
                </View>
              </View>
            </Animated.View>

            {/* Genre tags — flat rectangular, dark bg */}
            <Animated.View entering={getEnterAnimation(160)} style={styles.genreRow}>
              {profile.favoriteGenres.map((genre) => (
                <View key={genre} style={styles.genreTag}>
                  <ThemedText style={styles.genreText}>{genre}</ThemedText>
                </View>
              ))}
            </Animated.View>

            {/* ── Divider ───────────────────────────────────────── */}
            <View style={styles.divider} />

            {/* Queue CTA — title left, yellow button right */}
            {ctaMovie ? (
              <Animated.View entering={getEnterAnimation(200)} style={styles.queueRow}>
                <View>
                  <ThemedText style={styles.queueLabel}>Review queue</ThemedText>
                  <ThemedText style={styles.queueTitle}>{ctaMovie.title}</ThemedText>
                </View>
                <Pressable onPress={handleWriteReview} style={styles.queueBtn}>
                  <ThemedText style={styles.queueBtnText}>Write →</ThemedText>
                </Pressable>
              </Animated.View>
            ) : null}

            {/* ── Divider ───────────────────────────────────────── */}
            <View style={styles.divider} />

            {/* Activity log */}
            <Animated.View entering={getEnterAnimation(250)} style={styles.sectionHeader}>
              <ThemedText style={styles.sectionLabel}>Activity log</ThemedText>
              <ThemedText style={styles.sectionCount}>
                {activityItems.length} entries
              </ThemedText>
            </Animated.View>

            <View>
              {activityItems.map(({ activity, movie }, index) => (
                <Animated.View
                  key={activity.id}
                  entering={getEnterAnimation(290 + index * ITEM_STAGGER)}>
                  <Pressable
                    style={styles.activityItem}
                    onPress={() => handleOpenMovie(movie.id)}>
                    <ThemedText style={styles.activityIcon}>
                      {getActivityIcon(activity.type)}
                    </ThemedText>
                    <View style={styles.activityInfo}>
                      <ThemedText style={styles.activityTitle}>
                        {movie.title}
                      </ThemedText>
                      <ThemedText style={styles.activityMeta}>
                        {activity.title} · {activity.timestampLabel}
                      </ThemedText>
                    </View>
                    {activity.rating ? (
                      <ThemedText style={styles.activityRating}>
                        {activity.rating}★
                      </ThemedText>
                    ) : null}
                  </Pressable>
                </Animated.View>
              ))}
            </View>

            {/* ── Divider ───────────────────────────────────────── */}
            <View style={styles.divider} />

            {/* Recent Reviews */}
            <Animated.View
              entering={getEnterAnimation(430)}
              style={styles.sectionHeader}>
              <ThemedText style={styles.sectionLabel}>Recent reviews</ThemedText>
              <ThemedText style={styles.sectionCount}>
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

          </View>
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

  // ── Hero ──────────────────────────────────────────────────────
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
  // Left accent bar — the defining Brutalist element
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: YELLOW,
  },
  // Ghost number — ambient background decoration, barely visible
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
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  // Square avatar — no gradient ring, just solid dark
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
    flexDirection: 'column',
    gap: 3,
    paddingBottom: 3,
  },
  heroName: {
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 26,
    letterSpacing: -0.4,
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

  // ── Body ──────────────────────────────────────────────────────
  body: {
    paddingHorizontal: 16,
  },
  bio: {
    fontSize: 13,
    lineHeight: 20,
    color: DIM_CLR,
    marginTop: 16,
  },

  // ── Stats grid — 2×2, sharp borders, yellow numbers ──────────
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
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
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
    letterSpacing: -1,
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

  // ── Genre tags — flat, rectangular ───────────────────────────
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

  // ── Divider ───────────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: BORDER_CLR,
    marginTop: 16,
  },

  // ── Queue CTA row ─────────────────────────────────────────────
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
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
  },
  queueBtnText: {
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 17,
    color: BG_CLR,
  },

  // ── Section headers ───────────────────────────────────────────
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

  // ── Activity items ────────────────────────────────────────────
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_CLR,
  },
  activityIcon: {
    fontSize: 14,
    lineHeight: 18,
    width: 22,
    textAlign: 'center',
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

  // ── Reviews ───────────────────────────────────────────────────
  reviewList: {
    gap: 12,
  },
});
