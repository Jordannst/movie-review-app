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

const SECTION_ENTER_DURATION = 280;
const ITEM_STAGGER = 45;

function getEnterAnimation(delay = 0) {
  return FadeInDown.duration(SECTION_ENTER_DURATION)
    .delay(delay)
    .easing(Easing.out(Easing.quad))
    .withInitialValues({
      opacity: 0,
      transform: [{ translateY: 10 }],
    });
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

export default function ProfileScreen(): ReactElement {
  const router = useRouter();
  const background = useThemeColor({}, 'background');
  const surface = useThemeColor({}, 'surface');
  const surfaceMuted = useThemeColor({}, 'surfaceMuted');
  const border = useThemeColor({}, 'border');
  const textMuted = useThemeColor({}, 'textMuted');
  const accent = useThemeColor({}, 'accent');
  const ctaMovie = getMovieById(profile.ctaMovieId);
  const activityItems = profile.recentActivity
    .map((activity) => {
      const movie = getMovieById(activity.movieId);

      if (!movie) {
        return undefined;
      }

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
    if (!ctaMovie) {
      return;
    }

    router.push({
      pathname: '/reviews/new',
      params: { movieId: ctaMovie.id },
    });
  }

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          style={{ backgroundColor: background }}>
          <Animated.View entering={getEnterAnimation(0)} style={[styles.heroCard, { backgroundColor: surface, borderColor: border }]}>
            <View style={styles.heroTopRow}>
              <View style={[styles.avatar, { backgroundColor: surfaceMuted, borderColor: border }]}>
                <ThemedText style={styles.avatarText}>{profile.account.initials}</ThemedText>
              </View>

              <View style={styles.accountMeta}>
                <View style={[styles.badge, { backgroundColor: surfaceMuted, borderColor: border }]}>
                  <ThemedText style={[styles.badgeText, { color: accent }]}>{profile.account.badgeLabel}</ThemedText>
                </View>
                <ThemedText style={[styles.joinedLabel, { color: textMuted }]}>{profile.account.joinedLabel}</ThemedText>
              </View>
            </View>

            <View style={styles.accountCopy}>
              <ThemedText type="title" style={styles.name}>
                {profile.account.name}
              </ThemedText>
              <ThemedText style={[styles.username, { color: accent }]}>{profile.account.username}</ThemedText>
              <ThemedText style={[styles.bio, { color: textMuted }]}>{profile.account.bio}</ThemedText>
            </View>
          </Animated.View>

          <Animated.View entering={getEnterAnimation(70)} style={styles.sectionHeader}>
            <View>
              <ThemedText style={styles.sectionLabel}>Snapshot</ThemedText>
              <ThemedText type="subtitle">Account overview</ThemedText>
            </View>
            <ThemedText style={[styles.sectionMeta, { color: textMuted }]}>4 stats</ThemedText>
          </Animated.View>

          <View style={styles.statsGrid}>
            {profile.stats.map((stat, index) => (
              <Animated.View
                key={stat.label}
                entering={getEnterAnimation(110 + index * ITEM_STAGGER)}
                style={[styles.statCard, { backgroundColor: surface, borderColor: border }]}>
                <ThemedText style={styles.statValue}>{stat.value}</ThemedText>
                <ThemedText type="defaultSemiBold">{stat.label}</ThemedText>
                <ThemedText style={[styles.statNote, { color: textMuted }]}>{stat.note}</ThemedText>
              </Animated.View>
            ))}
          </View>

          <Animated.View entering={getEnterAnimation(190)} style={styles.section}>
            <ThemedText style={styles.sectionLabel}>Taste profile</ThemedText>
            <ThemedText type="subtitle">Favorite genres</ThemedText>
            <View style={styles.genreRow}>
              {profile.favoriteGenres.map((genre) => (
                <View key={genre} style={[styles.genreChip, { backgroundColor: surface, borderColor: border }]}>
                  <ThemedText style={styles.genreText}>{genre}</ThemedText>
                </View>
              ))}
            </View>
          </Animated.View>

          <Animated.View entering={getEnterAnimation(240)} style={styles.sectionHeader}>
            <View>
              <ThemedText style={styles.sectionLabel}>Recent activity</ThemedText>
              <ThemedText type="subtitle">What this account has been up to</ThemedText>
            </View>
            <ThemedText style={[styles.sectionMeta, { color: textMuted }]}>{activityItems.length} updates</ThemedText>
          </Animated.View>

          <View style={styles.activityList}>
            {activityItems.map(({ activity, movie }, index) => (
              <Animated.View key={activity.id} entering={getEnterAnimation(290 + index * ITEM_STAGGER)}>
                <ProfileActivityItem activity={activity} movie={movie} onPress={() => handleOpenMovie(movie.id)} />
              </Animated.View>
            ))}
          </View>

          <Animated.View entering={getEnterAnimation(420)} style={styles.sectionHeader}>
            <View>
              <ThemedText style={styles.sectionLabel}>Recent reviews</ThemedText>
              <ThemedText type="subtitle">Community reads in your lane</ThemedText>
            </View>
            <ThemedText style={[styles.sectionMeta, { color: textMuted }]}>{recentReviews.length} cards</ThemedText>
          </Animated.View>

          <View style={styles.reviewList}>
            {recentReviews.map((review, index) => (
              <Animated.View key={review.id} entering={getEnterAnimation(470 + index * ITEM_STAGGER)}>
                <ReviewCard review={review} />
              </Animated.View>
            ))}
          </View>

          {ctaMovie ? (
            <Animated.View
              entering={getEnterAnimation(620)}
              style={[styles.ctaCard, { backgroundColor: surface, borderColor: border }]}>
              <ThemedText style={styles.sectionLabel}>Next up</ThemedText>
              <ThemedText type="subtitle">Write your next dummy review</ThemedText>
              <ThemedText style={[styles.ctaCopy, { color: textMuted }]}>
                Jump straight into the existing review flow for {ctaMovie.title} and keep the demo streak going.
              </ThemedText>

              <View style={styles.ctaMetaRow}>
                <View style={[styles.metaChip, { backgroundColor: surfaceMuted, borderColor: border }]}>
                  <ThemedText style={styles.metaChipText}>{ctaMovie.year}</ThemedText>
                </View>
                <View style={[styles.metaChip, { backgroundColor: surfaceMuted, borderColor: border }]}>
                  <ThemedText style={styles.metaChipText}>{ctaMovie.genres[0]}</ThemedText>
                </View>
                <View style={[styles.metaChip, { backgroundColor: surfaceMuted, borderColor: border }]}>
                  <ThemedText style={styles.metaChipText}>{ctaMovie.runtimeMinutes} min</ThemedText>
                </View>
              </View>

              <PrimaryButton label={`Review ${ctaMovie.title}`} onPress={handleWriteReview} />
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
  },
  safeArea: {
    flex: 1,
  },
  content: {
    gap: 20,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  heroCard: {
    gap: 18,
    borderRadius: 28,
    borderWidth: 1,
    padding: 20,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 78,
    height: 78,
    borderRadius: 24,
    borderWidth: 1,
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
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
  statCard: {
    width: '48%',
    gap: 6,
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
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
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
  ctaCard: {
    gap: 14,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
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
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metaChipText: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '700',
  },
});
