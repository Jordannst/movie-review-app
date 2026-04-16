import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { type ReactElement } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
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

const GLASS_BG = 'rgba(255,255,255,0.06)';
const GLASS_BORDER = 'rgba(255,255,255,0.10)';
const GLASS_INTENSITY = 22;

const ENTER_DURATION = 320;
const ITEM_STAGGER = 35;

function getEnterAnimation(delay = 0) {
  return FadeInDown.duration(ENTER_DURATION)
    .delay(delay)
    .easing(Easing.out(Easing.cubic))
    .withInitialValues({ opacity: 0, transform: [{ translateY: 12 }] });
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

export default function ProfileScreen(): ReactElement {
  const router = useRouter();
  const textMuted = useThemeColor({}, 'textMuted');
  const accent = useThemeColor({}, 'accent');

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
    <ThemedView style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
          contentContainerStyle={styles.content}>

          {/* ── Cinematic Hero Header ─────────────────────────────── */}
          <Animated.View entering={FadeIn.duration(500)} style={styles.heroHeader}>
            {/* Blurred backdrop from movie */}
            {backdropSource ? (
              <Image
                source={{ uri: backdropSource }}
                style={StyleSheet.absoluteFillObject}
                contentFit="cover"
                blurRadius={48}
              />
            ) : null}

            {/* Rich color overlay */}
            <LinearGradient
              colors={['rgba(45,10,90,0.7)', 'rgba(18,26,61,0.8)', 'rgba(4,29,31,0.75)']}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            {/* Bottom fade to page bg */}
            <LinearGradient
              colors={['transparent', '#0B0D12']}
              locations={[0.55, 1]}
              style={styles.heroBottomFade}
            />

            {/* Avatar — fully inside header, bottom-center */}
            <View style={styles.avatarContainer}>
              {/* Gradient ring */}
              <LinearGradient
                colors={['#a78bfa', '#7c3aed', '#3b82f6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarRing}>
                <View style={styles.avatarInner}>
                  <ThemedText style={styles.avatarText}>{profile.account.initials}</ThemedText>
                </View>
              </LinearGradient>
            </View>
          </Animated.View>

          {/* ── Identity Block ────────────────────────────────────── */}
          <Animated.View entering={getEnterAnimation(80)} style={styles.identityBlock}>
            <BlurView intensity={20} tint="light" style={styles.badgePill}>
              <ThemedText style={[styles.badgeText, { color: accent }]}>
                {profile.account.badgeLabel}
              </ThemedText>
            </BlurView>
            <ThemedText type="title" style={styles.name}>
              {profile.account.name}
            </ThemedText>
            <ThemedText style={[styles.username, { color: accent }]}>
              {profile.account.username}
            </ThemedText>
            <ThemedText style={[styles.bio, { color: textMuted }]}>
              {profile.account.bio}
            </ThemedText>
          </Animated.View>

          {/* ── Stats Strip (horizontal, 1 row) ───────────────────── */}
          <Animated.View entering={getEnterAnimation(140)} style={styles.statsStripWrap}>
            <BlurView intensity={GLASS_INTENSITY} tint="dark" style={styles.statsStrip}>
              {profile.stats.map((stat, i) => (
                <View
                  key={stat.label}
                  style={[styles.statItem, i < profile.stats.length - 1 && styles.statBorder]}>
                  <ThemedText style={styles.statValue}>{stat.value}</ThemedText>
                  <ThemedText style={[styles.statLabel, { color: textMuted }]}>{stat.label}</ThemedText>
                </View>
              ))}
            </BlurView>
          </Animated.View>

          {/* ── Genre Chips ───────────────────────────────────────── */}
          <Animated.View entering={getEnterAnimation(190)} style={styles.chipsRow}>
            {profile.favoriteGenres.map((genre) => (
              <BlurView key={genre} intensity={18} tint="light" style={styles.genreChip}>
                <ThemedText style={styles.genreText}>{genre}</ThemedText>
              </BlurView>
            ))}
          </Animated.View>

          {/* ── CTA Card (elevated position) ──────────────────────── */}
          {ctaMovie ? (
            <Animated.View entering={getEnterAnimation(240)} style={styles.ctaWrap}>
              <LinearGradient
                colors={['rgba(124,58,237,0.18)', 'rgba(59,130,246,0.10)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ctaGradient}>
                <BlurView intensity={GLASS_INTENSITY} tint="dark" style={styles.ctaCard}>
                  <ThemedText style={[styles.sectionLabel, { color: accent }]}>Next up</ThemedText>
                  <ThemedText type="subtitle">{ctaMovie.title}</ThemedText>
                  <ThemedText style={[styles.ctaCopy, { color: textMuted }]}>
                    Keep your review streak going — jump into the flow for {ctaMovie.title}.
                  </ThemedText>

                  <View style={styles.ctaMetaRow}>
                    {[ctaMovie.year.toString(), ctaMovie.genres[0], `${ctaMovie.runtimeMinutes} min`].map(
                      (label) => (
                        <BlurView key={label} intensity={16} tint="light" style={styles.metaChip}>
                          <ThemedText style={styles.metaChipText}>{label}</ThemedText>
                        </BlurView>
                      )
                    )}
                  </View>

                  <PrimaryButton label={`Review ${ctaMovie.title}`} onPress={handleWriteReview} />
                </BlurView>
              </LinearGradient>
            </Animated.View>
          ) : null}

          {/* ── Divider ───────────────────────────────────────────── */}
          <View style={styles.divider} />

          {/* ── Recent Activity ───────────────────────────────────── */}
          <Animated.View entering={getEnterAnimation(300)} style={styles.sectionHeader}>
            <View>
              <ThemedText style={styles.sectionLabel}>Recent activity</ThemedText>
              <ThemedText type="subtitle">What this account has been up to</ThemedText>
            </View>
            <ThemedText style={[styles.sectionCount, { color: textMuted }]}>
              {activityItems.length} updates
            </ThemedText>
          </Animated.View>

          <View style={styles.activityList}>
            {activityItems.map(({ activity, movie }, index) => (
              <Animated.View
                key={activity.id}
                entering={getEnterAnimation(340 + index * ITEM_STAGGER)}>
                <ProfileActivityItem
                  activity={activity}
                  movie={movie}
                  onPress={() => handleOpenMovie(movie.id)}
                />
              </Animated.View>
            ))}
          </View>

          <View style={styles.divider} />

          {/* ── Recent Reviews ────────────────────────────────────── */}
          <Animated.View entering={FadeInUp.duration(280).delay(460)} style={styles.sectionHeader}>
            <View>
              <ThemedText style={styles.sectionLabel}>Recent reviews</ThemedText>
              <ThemedText type="subtitle">Community reads in your lane</ThemedText>
            </View>
            <ThemedText style={[styles.sectionCount, { color: textMuted }]}>
              {recentReviews.length} cards
            </ThemedText>
          </Animated.View>

          <View style={styles.reviewList}>
            {recentReviews.map((review, index) => (
              <Animated.View
                key={review.id}
                entering={getEnterAnimation(500 + index * ITEM_STAGGER)}>
                <ReviewCard review={review} />
              </Animated.View>
            ))}
          </View>
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
  safeArea: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 48,
  },

  // Hero header
  heroHeader: {
    width: '100%',
    height: 188,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 18,
  },
  heroBottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  avatarContainer: {
    zIndex: 2,
  },
  avatarRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    padding: 3,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 10,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 37,
    backgroundColor: '#1a1530',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '800',
  },

  // Identity
  identityBlock: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 5,
  },
  badgePill: {
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: GLASS_BG,
  },
  badgeText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  name: {
    textAlign: 'center',
    lineHeight: 36,
  },
  username: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  bio: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },

  // Stats strip
  statsStripWrap: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GLASS_BORDER,
  },
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: GLASS_BG,
  },
  statItem: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 3,
  },
  statBorder: {
    borderRightWidth: 1,
    borderRightColor: GLASS_BORDER,
  },
  statValue: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Chips
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 16,
  },
  genreChip: {
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: GLASS_BG,
  },
  genreText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },

  // CTA
  ctaWrap: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.35)',
  },
  ctaGradient: {
    borderRadius: 20,
  },
  ctaCard: {
    gap: 12,
    padding: 18,
    backgroundColor: GLASS_BG,
  },
  ctaCopy: {
    fontSize: 14,
    lineHeight: 20,
  },
  ctaMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaChip: {
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: GLASS_BG,
  },
  metaChipText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: GLASS_BORDER,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 4,
  },

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  sectionLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  sectionCount: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },

  activityList: {
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  reviewList: {
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});
