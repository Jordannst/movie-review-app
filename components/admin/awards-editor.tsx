import { Ionicons } from '@expo/vector-icons';
import { type ReactElement, useState } from 'react';
import { Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { type AwardInput } from '@/services/awards';

const SURFACE = '#141828';
const SURFACE_2 = '#1A1F2E';
const BORDER = '#1E2234';
const DIM = '#5A607A';
const TEXT_PRIMARY = '#F5F7FA';
const TEXT_MUTED = '#8E9BB0';
const YELLOW = '#F5C451';
const DANGER = '#F04452';

type AwardsEditorProps = {
  value: AwardInput[];
  onChange: (next: AwardInput[]) => void;
};

function emptyAward(): AwardInput {
  return {
    awardName: '',
    organization: '',
    year: new Date().getFullYear(),
    category: '',
    isWinner: true,
  };
}

export function AwardsEditor({ value, onChange }: AwardsEditorProps): ReactElement {
  function update(idx: number, patch: Partial<AwardInput>) {
    onChange(value.map((a, i) => (i === idx ? { ...a, ...patch } : a)));
  }
  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }
  function add() {
    onChange([...value, emptyAward()]);
  }

  return (
    <View style={styles.wrap}>
      {value.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="trophy-outline" size={20} color={DIM} />
          <ThemedText style={styles.emptyText}>No awards yet.</ThemedText>
          <ThemedText style={styles.emptyHint}>
            Add an award below if this film won or was nominated for one.
          </ThemedText>
        </View>
      ) : (
        <View style={styles.list}>
          {value.map((a, idx) => (
            <View key={idx} style={styles.card}>
              <View style={styles.cardHeader}>
                <ThemedText style={styles.cardIndex}>#{idx + 1}</ThemedText>
                <Pressable
                  hitSlop={10}
                  onPress={() => remove(idx)}
                  accessibilityLabel="Remove award"
                  style={styles.removeBtn}>
                  <Ionicons name="close" size={16} color={DANGER} />
                </Pressable>
              </View>

              <Field label="Award Name" hint="e.g. Best Picture">
                <Input
                  value={a.awardName}
                  onChangeText={(t) => update(idx, { awardName: t })}
                  placeholder="Best Picture"
                  autoCapitalize="words"
                />
              </Field>

              <Field label="Organization" hint="e.g. Academy Awards, Cannes, BAFTA">
                <Input
                  value={a.organization}
                  onChangeText={(t) => update(idx, { organization: t })}
                  placeholder="Academy Awards"
                  autoCapitalize="words"
                />
              </Field>

              <View style={styles.row}>
                <View style={styles.half}>
                  <Field label="Year">
                    <Input
                      value={String(a.year)}
                      onChangeText={(t) => {
                        const n = Number(t);
                        update(idx, { year: Number.isFinite(n) ? n : a.year });
                      }}
                      keyboardType="number-pad"
                      placeholder="2024"
                    />
                  </Field>
                </View>
                <View style={styles.winnerCol}>
                  <ThemedText style={styles.fieldLabel}>Status</ThemedText>
                  <Pressable
                    onPress={() => update(idx, { isWinner: !a.isWinner })}
                    style={[styles.statusToggle, a.isWinner && styles.statusToggleWon]}>
                    <View style={styles.statusToggleTextWrap}>
                      <Ionicons
                        name={a.isWinner ? 'trophy' : 'ribbon-outline'}
                        size={14}
                        color={a.isWinner ? YELLOW : DIM}
                      />
                      <ThemedText
                        style={[styles.statusToggleText, { color: a.isWinner ? YELLOW : DIM }]}>
                        {a.isWinner ? 'Won' : 'Nominated'}
                      </ThemedText>
                    </View>
                    <Switch
                      value={a.isWinner}
                      onValueChange={(v) => update(idx, { isWinner: v })}
                      trackColor={{ false: BORDER, true: 'rgba(245,196,81,0.4)' }}
                      thumbColor={a.isWinner ? YELLOW : '#9CA3AF'}
                      ios_backgroundColor={BORDER}
                    />
                  </Pressable>
                </View>
              </View>

              <Field label="Category (optional)" hint="e.g. Drama, Heath Ledger">
                <Input
                  value={a.category ?? ''}
                  onChangeText={(t) => update(idx, { category: t })}
                  placeholder="Drama"
                  autoCapitalize="words"
                />
              </Field>
            </View>
          ))}
        </View>
      )}

      <Pressable onPress={add} style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}>
        <Ionicons name="add" size={18} color={YELLOW} />
        <ThemedText style={styles.addBtnText}>Add Award</ThemedText>
      </Pressable>
    </View>
  );
}

// ── Sub-pieces (mirroring movie-form.tsx field/input visuals) ────

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactElement;
}): ReactElement {
  return (
    <View style={styles.fieldWrap}>
      <ThemedText style={styles.fieldLabel}>{label}</ThemedText>
      {hint ? <ThemedText style={styles.hint}>{hint}</ThemedText> : null}
      {children}
    </View>
  );
}

type InputProps = {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words';
};

function Input({
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
}: InputProps): ReactElement {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.inputWrap, focused && styles.inputWrapFocus]}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#3A4060"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12, marginBottom: 8 },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 24,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: 'dashed',
    backgroundColor: SURFACE,
  },
  emptyText: { fontSize: 13, fontWeight: '700', color: TEXT_MUTED, marginTop: 4 },
  emptyHint: { fontSize: 11, color: DIM, textAlign: 'center', maxWidth: 280, lineHeight: 16 },

  // List + cards
  list: { gap: 12 },
  card: {
    gap: 8,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardIndex: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: YELLOW,
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(240,68,82,0.35)',
    backgroundColor: 'rgba(240,68,82,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Field
  fieldWrap: { gap: 4 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: TEXT_MUTED,
    textTransform: 'uppercase',
  },
  hint: { fontSize: 11, color: DIM },

  // Input
  inputWrap: {
    backgroundColor: SURFACE_2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
  },
  inputWrapFocus: { borderColor: YELLOW },
  input: { height: 44, fontSize: 14, color: TEXT_PRIMARY },

  // Two-col row (Year + Status)
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  half: { flex: 1 },
  winnerCol: { flex: 1.3, gap: 4 },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE_2,
    height: 44,
  },
  statusToggleWon: {
    borderColor: 'rgba(245,196,81,0.45)',
    backgroundColor: 'rgba(245,196,81,0.08)',
  },
  statusToggleTextWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusToggleText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },

  // Add button
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245,196,81,0.35)',
    backgroundColor: 'rgba(245,196,81,0.08)',
  },
  addBtnPressed: {
    backgroundColor: 'rgba(245,196,81,0.14)',
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: YELLOW,
    letterSpacing: 0.3,
  },
});
