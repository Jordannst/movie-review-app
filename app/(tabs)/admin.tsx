import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { type ReactElement, useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdminGuard } from '@/components/admin/admin-guard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';

const BG = '#0B0D12';
const SURFACE = '#141828';
const SURFACE_2 = '#1A1F2E';
const BORDER = '#1E2234';
const DIM = '#5A607A';
const TEXT_PRIMARY = '#F5F7FA';
const TEXT_MUTED = '#8E9BB0';
const YELLOW = '#F5C451';

export default function AdminHubScreen(): ReactElement {
  return (
    <AdminGuard>
      <Hub />
    </AdminGuard>
  );
}

type Stats = {
  movieCount: number;
  reviewCount: number;
  featuredCount: number;
};

function Hub(): ReactElement {
  const router = useRouter();
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);

  // Refetch counts every time the screen gains focus
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void loadStats().then((s) => {
        if (!cancelled) setStats(s);
      });
      return () => {
        cancelled = true;
      };
    }, [])
  );

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>

          {/* HERO */}
          <Animated.View entering={FadeInDown.duration(280).easing(Easing.out(Easing.cubic))}>
            <View style={styles.heroRow}>
              <ThemedText style={styles.eyebrow}>ADMIN</ThemedText>
              <View style={styles.roleBadge}>
                <Ionicons name="shield-checkmark" size={11} color={YELLOW} />
                <ThemedText style={styles.roleBadgeText}>Admin</ThemedText>
              </View>
            </View>
            <ThemedText style={styles.title}>Control Panel</ThemedText>
            <ThemedText style={styles.subtitle}>
              {profile?.name ? `Welcome back, ${profile.name.split(' ')[0]}.` : 'Welcome back.'}{' '}
              Manage the catalog and moderate the community.
            </ThemedText>
          </Animated.View>

          {/* STATS ROW */}
          <Animated.View
            entering={FadeInDown.duration(280).delay(80).easing(Easing.out(Easing.cubic))}
            style={styles.statsRow}>
            <StatCard icon="film-outline" label="Movies" value={stats?.movieCount} />
            <StatCard icon="chatbubbles-outline" label="Reviews" value={stats?.reviewCount} />
            <StatCard icon="star" label="Featured" value={stats?.featuredCount} accent />
          </Animated.View>

          {/* QUICK ACTIONS */}
          <Animated.View
            entering={FadeInDown.duration(280).delay(160).easing(Easing.out(Easing.cubic))}>
            <ThemedText style={styles.sectionLabel}>QUICK ACTIONS</ThemedText>

            <ActionCard
              icon="film"
              title="Manage Movies"
              desc="Add, edit, delete, mark featured."
              onPress={() => router.push('/admin/movies' as never)}
            />
            <ActionCard
              icon="chatbubble-ellipses"
              title="Moderate Reviews"
              desc="Review and remove inappropriate content."
              onPress={() => router.push('/admin/reviews' as never)}
            />
          </Animated.View>

          {/* INFO FOOTER */}
          <Animated.View
            entering={FadeInDown.duration(280).delay(240).easing(Easing.out(Easing.cubic))}
            style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={16} color={DIM} />
            <ThemedText style={styles.infoText}>
              All admin actions are logged via Supabase RLS. Only users with{' '}
              <ThemedText style={styles.infoTextBold}>role=&apos;admin&apos;</ThemedText> can
              modify the catalog.
            </ThemedText>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

// ── Sub-components ─────────────────────────────────────────────

type StatCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number | undefined;
  accent?: boolean;
};

function StatCard({ icon, label, value, accent }: StatCardProps): ReactElement {
  const showLoading = value === undefined;
  return (
    <View style={[styles.statCard, accent && styles.statCardAccent]}>
      <View style={[styles.statIconWrap, accent && styles.statIconWrapAccent]}>
        <Ionicons name={icon} size={16} color={accent ? YELLOW : TEXT_MUTED} />
      </View>
      <ThemedText style={styles.statValue}>
        {showLoading ? '—' : value.toLocaleString()}
      </ThemedText>
      <ThemedText style={styles.statLabel}>{label}</ThemedText>
    </View>
  );
}

type ActionCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
  onPress: () => void;
};

function ActionCard({ icon, title, desc, onPress }: ActionCardProps): ReactElement {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [
      styles.actionCard,
      pressed && styles.actionCardPressed,
    ]}>
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={22} color={YELLOW} />
      </View>
      <View style={styles.actionTextWrap}>
        <ThemedText style={styles.actionTitle}>{title}</ThemedText>
        <ThemedText style={styles.actionDesc}>{desc}</ThemedText>
      </View>
      <Ionicons name="chevron-forward" size={20} color={DIM} />
    </Pressable>
  );
}

// ── Data ───────────────────────────────────────────────────────

async function loadStats(): Promise<Stats> {
  // Three parallel HEAD count queries — minimal payload (count only, no rows)
  const [moviesRes, reviewsRes, featuredRes] = await Promise.all([
    supabase.from('movies').select('*', { count: 'exact', head: true }),
    supabase.from('reviews').select('*', { count: 'exact', head: true }),
    supabase.from('movies').select('*', { count: 'exact', head: true }).eq('is_featured', true),
  ]);

  return {
    movieCount: moviesRes.count ?? 0,
    reviewCount: reviewsRes.count ?? 0,
    featuredCount: featuredRes.count ?? 0,
  };
}

// ── Styles ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  flex: { flex: 1 },
  content: { padding: 20, paddingBottom: 120, gap: 20 },

  // Hero
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
    color: YELLOW,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(245,196,81,0.4)',
    backgroundColor: 'rgba(245,196,81,0.1)',
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    color: YELLOW,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginTop: 4,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: TEXT_MUTED,
    marginTop: 6,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE,
    gap: 10,
  },
  statCardAccent: {
    borderColor: 'rgba(245,196,81,0.3)',
    backgroundColor: 'rgba(245,196,81,0.06)',
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: SURFACE_2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconWrapAccent: {
    backgroundColor: 'rgba(245,196,81,0.12)',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: TEXT_MUTED,
    textTransform: 'uppercase',
  },

  // Quick actions
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 4,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE,
    marginBottom: 10,
  },
  actionCardPressed: {
    backgroundColor: SURFACE_2,
    borderColor: 'rgba(245,196,81,0.4)',
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245,196,81,0.35)',
    backgroundColor: 'rgba(245,196,81,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextWrap: { flex: 1 },
  actionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    letterSpacing: 0.1,
  },
  actionDesc: {
    fontSize: 12,
    color: DIM,
    marginTop: 2,
  },

  // Info card
  infoCard: {
    flexDirection: 'row',
    gap: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE,
    marginTop: 4,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    color: DIM,
  },
  infoTextBold: {
    fontSize: 11,
    fontWeight: '700',
    color: YELLOW,
  },
});
