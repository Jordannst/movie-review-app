import Ionicons from '@expo/vector-icons/Ionicons';
import { type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Award } from '@/data/types';
import { useThemeColor } from '@/hooks/use-theme-color';

type AwardsListProps = { awards: Award[] };

const YELLOW = '#F5C451';
const DIM = '#5A607A';

export function AwardsList({ awards }: AwardsListProps): ReactElement | null {
  const accent = useThemeColor({}, 'accent');
  const textMuted = useThemeColor({}, 'textMuted');

  if (!awards || awards.length === 0) return null;

  const winners = awards.filter((a) => a.isWinner).length;
  const noms = awards.length - winners;

  const summaryParts: string[] = [];
  if (winners > 0) summaryParts.push(`${winners} won`);
  if (noms > 0) summaryParts.push(`${noms} nominated`);
  const summary = summaryParts.join(' · ');

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <ThemedText style={[styles.sectionLabel, { color: accent }]}>Awards</ThemedText>
        <ThemedText style={[styles.summary, { color: textMuted }]}>{summary}</ThemedText>
      </View>

      <View style={styles.list}>
        {awards.map((a) => (
          <View key={a.id} style={styles.row}>
            <View style={[styles.statusChip, a.isWinner ? styles.statusChipWon : styles.statusChipNom]}>
              <Ionicons
                name={a.isWinner ? 'trophy' : 'ribbon-outline'}
                size={10}
                color={a.isWinner ? YELLOW : DIM}
              />
              <ThemedText
                style={[styles.statusText, { color: a.isWinner ? YELLOW : DIM }]}>
                {a.isWinner ? 'Won' : 'Nom.'}
              </ThemedText>
            </View>
            <View style={styles.bodyCol}>
              <ThemedText style={styles.awardName} numberOfLines={2}>
                {a.awardName}
                {a.category ? (
                  <ThemedText style={[styles.category, { color: textMuted }]}> · {a.category}</ThemedText>
                ) : null}
              </ThemedText>
              <ThemedText style={[styles.org, { color: textMuted }]} numberOfLines={1}>
                {a.organization} · {a.year}
              </ThemedText>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10, paddingHorizontal: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  summary: { fontSize: 12, fontWeight: '700' },

  list: { gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    minWidth: 56,
    justifyContent: 'center',
  },
  statusChipWon: {
    borderWidth: 1,
    borderColor: 'rgba(245,196,81,0.45)',
    backgroundColor: 'rgba(245,196,81,0.12)',
  },
  statusChipNom: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  statusText: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  bodyCol: { flex: 1, gap: 2 },
  awardName: { fontSize: 14, lineHeight: 19, fontWeight: '700' },
  category: { fontSize: 13, fontWeight: '600' },
  org: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
});
