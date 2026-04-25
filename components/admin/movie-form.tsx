import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { type ReactElement, type ReactNode, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    TextInput,
    View,
} from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { type MovieInput } from '@/services/admin-movies';

// Design tokens — match app/profile/edit.tsx aesthetic
const BG = '#0B0D12';
const SURFACE = '#141828';
const SURFACE_2 = '#1A1F2E';
const BORDER = '#1E2234';
const DIM = '#5A607A';
const TEXT_PRIMARY = '#F5F7FA';
const TEXT_MUTED = '#8E9BB0';
const YELLOW = '#F5C451';
const DANGER = '#F04452';

const ALL_GENRES = [
  'Sci-Fi', 'Action', 'Drama', 'Thriller', 'Crime',
  'Animation', 'Romance', 'Comedy', 'Horror', 'Fantasy',
  'Documentary', 'Mystery',
] as const;

const SYNOPSIS_MAX = 600;

type MovieFormProps = {
  initial?: Partial<MovieInput>;
  submitLabel: string;
  lockId?: boolean; // true when editing — prevent changing slug
  onSubmit: (input: MovieInput) => Promise<void>;
  onCancel: () => void;
};

export function MovieForm({
  initial,
  submitLabel,
  lockId,
  onSubmit,
  onCancel,
}: MovieFormProps): ReactElement {
  const insets = useSafeAreaInsets();

  const [id, setId] = useState(initial?.id ?? '');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [tagline, setTagline] = useState(initial?.tagline ?? '');
  const [year, setYear] = useState(String(initial?.year ?? new Date().getFullYear()));
  const [runtime, setRuntime] = useState(
    initial?.runtimeMinutes ? String(initial.runtimeMinutes) : ''
  );
  const [director, setDirector] = useState(initial?.director ?? '');
  const [synopsis, setSynopsis] = useState(initial?.synopsis ?? '');
  const [posterUrl, setPosterUrl] = useState(initial?.posterUrl ?? '');
  const [backdropUrl, setBackdropUrl] = useState(initial?.backdropUrl ?? '');
  const [genres, setGenres] = useState<string[]>(initial?.genres ?? []);
  const [isFeatured, setIsFeatured] = useState<boolean>(initial?.isFeatured ?? false);

  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const [backdropFailed, setBackdropFailed] = useState(false);

  // Reset image-load error when URL changes (user pastes a new one)
  useEffect(() => { setPosterFailed(false); }, [posterUrl]);
  useEffect(() => { setBackdropFailed(false); }, [backdropUrl]);

  const errors = useMemo(
    () => validate({ id, title, year, runtime, posterUrl, backdropUrl }),
    [id, title, year, runtime, posterUrl, backdropUrl]
  );

  const canSubmit = Object.values(errors).every((e) => !e) && !submitting;

  function toggleGenre(g: string) {
    setGenres((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  }

  async function handleSubmit() {
    setTouched(true);
    if (!canSubmit) {
      Alert.alert('Fix the highlighted fields before saving.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        id: id.trim(),
        title: title.trim(),
        tagline: tagline.trim(),
        year: Number(year),
        runtimeMinutes: Number(runtime),
        director: director.trim(),
        synopsis: synopsis.trim(),
        posterUrl: posterUrl.trim(),
        backdropUrl: backdropUrl.trim(),
        genres,
        isFeatured,
      });
    } catch (err) {
      Alert.alert('Save failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  }

  // Show error only after first submit attempt OR when user finishes typing
  const showError = (e: string | null) => (touched ? e : null);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top + 60}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* SECTION 1 — BASICS */}
        <Animated.View entering={FadeInDown.duration(280).delay(40).easing(Easing.out(Easing.cubic))}>
          <SectionEyebrow icon="information-circle-outline" label="Basics" />

          <Field label="Slug / ID" hint="lowercase + hyphens, e.g. the-dark-knight" error={showError(errors.id)}>
            <FormInput
              value={id}
              onChangeText={setId}
              editable={!lockId}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="the-dark-knight"
              error={!!showError(errors.id)}
              locked={lockId}
            />
          </Field>

          <Field label="Title" error={showError(errors.title)}>
            <FormInput
              value={title}
              onChangeText={setTitle}
              placeholder="The Dark Knight"
              error={!!showError(errors.title)}
            />
          </Field>

          <Field label="Tagline">
            <FormInput
              value={tagline}
              onChangeText={setTagline}
              placeholder="Why so serious?"
            />
          </Field>

          <View style={styles.row}>
            <View style={styles.half}>
              <Field label="Year" error={showError(errors.year)}>
                <FormInput
                  value={year}
                  onChangeText={setYear}
                  keyboardType="number-pad"
                  placeholder="2008"
                  error={!!showError(errors.year)}
                />
              </Field>
            </View>
            <View style={styles.half}>
              <Field label="Runtime (min)" error={showError(errors.runtime)}>
                <FormInput
                  value={runtime}
                  onChangeText={setRuntime}
                  keyboardType="number-pad"
                  placeholder="152"
                  error={!!showError(errors.runtime)}
                />
              </Field>
            </View>
          </View>

          <Field label="Director">
            <FormInput
              value={director}
              onChangeText={setDirector}
              placeholder="Christopher Nolan"
              autoCapitalize="words"
            />
          </Field>

          <Field label="Synopsis" counter={`${synopsis.length}/${SYNOPSIS_MAX}`}>
            <FormInput
              value={synopsis}
              onChangeText={setSynopsis}
              placeholder="Plot summary..."
              multiline
              maxLength={SYNOPSIS_MAX}
            />
          </Field>
        </Animated.View>

        {/* SECTION 2 — MEDIA */}
        <Animated.View entering={FadeInDown.duration(280).delay(120).easing(Easing.out(Easing.cubic))}>
          <SectionEyebrow icon="image-outline" label="Media" />

          <Field label="Poster URL" hint="Portrait image (e.g. TMDB /w500/...)" error={showError(errors.posterUrl)}>
            <FormInput
              value={posterUrl}
              onChangeText={setPosterUrl}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="https://image.tmdb.org/t/p/w500/…"
              error={!!showError(errors.posterUrl)}
            />
          </Field>

          {posterUrl && /^https?:\/\//.test(posterUrl) && !posterFailed ? (
            <View style={styles.posterPreview}>
              <Image
                source={{ uri: posterUrl }}
                style={styles.posterImg}
                contentFit="cover"
                transition={180}
                onError={() => setPosterFailed(true)}
              />
            </View>
          ) : posterUrl && posterFailed ? (
            <View style={[styles.posterPreview, styles.previewFailed]}>
              <Ionicons name="alert-circle-outline" size={20} color={DANGER} />
              <ThemedText style={styles.previewFailedText}>Failed to load poster</ThemedText>
            </View>
          ) : null}

          <Field label="Backdrop URL" hint="Wide hero image (16:9)" error={showError(errors.backdropUrl)}>
            <FormInput
              value={backdropUrl}
              onChangeText={setBackdropUrl}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="https://image.tmdb.org/t/p/original/…"
              error={!!showError(errors.backdropUrl)}
            />
          </Field>

          {backdropUrl && /^https?:\/\//.test(backdropUrl) && !backdropFailed ? (
            <View style={styles.backdropPreview}>
              <Image
                source={{ uri: backdropUrl }}
                style={styles.backdropImg}
                contentFit="cover"
                transition={180}
                onError={() => setBackdropFailed(true)}
              />
            </View>
          ) : backdropUrl && backdropFailed ? (
            <View style={[styles.backdropPreview, styles.previewFailed]}>
              <Ionicons name="alert-circle-outline" size={20} color={DANGER} />
              <ThemedText style={styles.previewFailedText}>Failed to load backdrop</ThemedText>
            </View>
          ) : null}
        </Animated.View>

        {/* SECTION 3 — CATEGORIZATION */}
        <Animated.View entering={FadeInDown.duration(280).delay(200).easing(Easing.out(Easing.cubic))}>
          <SectionEyebrow icon="pricetags-outline" label="Categorization" />

          <Field
            label="Genres"
            counter={genres.length > 0 ? `${genres.length} selected` : undefined}>
            <View style={styles.chipsRow}>
              {ALL_GENRES.map((g) => {
                const active = genres.includes(g);
                return (
                  <Pressable
                    key={g}
                    onPress={() => toggleGenre(g)}
                    style={[styles.chip, active && styles.chipActive]}>
                    <ThemedText style={[styles.chipText, active && styles.chipTextActive]}>
                      {g}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </Field>
        </Animated.View>

        {/* SECTION 4 — SETTINGS */}
        <Animated.View entering={FadeInDown.duration(280).delay(280).easing(Easing.out(Easing.cubic))}>
          <SectionEyebrow icon="settings-outline" label="Settings" />

          <Pressable
            onPress={() => setIsFeatured((v) => !v)}
            style={[styles.featureCard, isFeatured && styles.featureCardActive]}>
            <View style={[styles.featureIcon, isFeatured && styles.featureIconActive]}>
              <Ionicons
                name={isFeatured ? 'star' : 'star-outline'}
                size={20}
                color={isFeatured ? YELLOW : DIM}
              />
            </View>
            <View style={styles.featureTextWrap}>
              <ThemedText style={styles.featureTitle}>Featured Tonight</ThemedText>
              <ThemedText style={styles.featureDesc}>
                Highlight this movie in the home carousel
              </ThemedText>
            </View>
            <Switch
              value={isFeatured}
              onValueChange={setIsFeatured}
              trackColor={{ false: BORDER, true: 'rgba(245,196,81,0.4)' }}
              thumbColor={isFeatured ? YELLOW : '#9CA3AF'}
              ios_backgroundColor={BORDER}
            />
          </Pressable>
        </Animated.View>
      </ScrollView>

      {/* STICKY SAVE BAR */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.footerActions}>
          <View style={styles.footerHalf}>
            <PrimaryButton
              label="Cancel"
              variant="secondary"
              onPress={onCancel}
              disabled={submitting}
            />
          </View>
          <View style={styles.footerHalf}>
            <PrimaryButton
              label={submitting ? 'Saving…' : submitLabel}
              onPress={handleSubmit}
              disabled={submitting}
            />
          </View>
        </View>
        {submitting ? <ActivityIndicator color={YELLOW} style={styles.spinner} /> : null}
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Sub-components ─────────────────────────────────────────────

function SectionEyebrow({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}): ReactElement {
  return (
    <View style={styles.sectionEyebrow}>
      <Ionicons name={icon} size={14} color={YELLOW} />
      <ThemedText style={styles.sectionEyebrowText}>{label}</ThemedText>
    </View>
  );
}

type FieldProps = {
  label: string;
  hint?: string;
  error?: string | null;
  counter?: string;
  children: ReactNode;
};

function Field({ label, hint, error, counter, children }: FieldProps): ReactElement {
  return (
    <View style={styles.fieldWrap}>
      <View style={styles.fieldLabelRow}>
        <ThemedText style={styles.fieldLabel}>{label}</ThemedText>
        {counter ? <ThemedText style={styles.counter}>{counter}</ThemedText> : null}
      </View>
      {hint ? <ThemedText style={styles.hint}>{hint}</ThemedText> : null}
      {children}
      {error ? <ThemedText style={styles.errText}>{error}</ThemedText> : null}
    </View>
  );
}

type FormInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'number-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words';
  autoCorrect?: boolean;
  editable?: boolean;
  maxLength?: number;
  error?: boolean;
  locked?: boolean;
};

function FormInput({
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoCorrect = true,
  editable = true,
  maxLength,
  error,
  locked,
}: FormInputProps): ReactElement {
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.inputWrap,
        multiline && styles.inputWrapMulti,
        focused && styles.inputWrapFocus,
        error && styles.inputWrapError,
        locked && styles.inputWrapLocked,
      ]}>
      <TextInput
        style={[styles.input, multiline && styles.inputMulti]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#3A4060"
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        editable={editable}
        maxLength={maxLength}
        textAlignVertical={multiline ? 'top' : 'center'}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

type ValidationInput = {
  id: string;
  title: string;
  year: string;
  runtime: string;
  posterUrl: string;
  backdropUrl: string;
};

function validate(values: ValidationInput): Record<keyof ValidationInput, string | null> {
  const errors: Record<keyof ValidationInput, string | null> = {
    id: null,
    title: null,
    year: null,
    runtime: null,
    posterUrl: null,
    backdropUrl: null,
  };
  if (!/^[a-z0-9][a-z0-9-]{1,60}$/.test(values.id)) {
    errors.id = 'Use lowercase letters, digits, and hyphens only.';
  }
  if (values.title.trim().length < 1) errors.title = 'Title is required.';
  const y = Number(values.year);
  if (!Number.isFinite(y) || y < 1900 || y > 2100) {
    errors.year = 'Year must be between 1900 and 2100.';
  }
  const r = Number(values.runtime);
  if (!Number.isFinite(r) || r < 1 || r > 999) {
    errors.runtime = 'Runtime in minutes (1–999).';
  }
  if (!/^https?:\/\//.test(values.posterUrl)) errors.posterUrl = 'Must be an absolute URL.';
  if (!/^https?:\/\//.test(values.backdropUrl)) errors.backdropUrl = 'Must be an absolute URL.';
  return errors;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 16, gap: 4 },

  // Section eyebrow
  sectionEyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  sectionEyebrowText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: YELLOW,
  },

  // Field
  fieldWrap: { marginBottom: 18 },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: TEXT_MUTED,
    textTransform: 'uppercase',
  },
  labelHint: {
    fontSize: 11,
    fontWeight: '600',
    color: DIM,
    textTransform: 'none',
    letterSpacing: 0,
  },
  counter: { fontSize: 11, fontWeight: '600', color: DIM },
  hint: { fontSize: 11, color: DIM, marginBottom: 6 },
  errText: { fontSize: 12, color: DANGER, marginTop: 6, marginLeft: 2 },

  // Input
  inputWrap: {
    backgroundColor: SURFACE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 14,
  },
  inputWrapMulti: { paddingVertical: 8 },
  inputWrapFocus: { borderColor: YELLOW },
  inputWrapError: { borderColor: DANGER },
  inputWrapLocked: { opacity: 0.55 },
  input: {
    height: 48,
    fontSize: 15,
    color: TEXT_PRIMARY,
  },
  inputMulti: { height: 130, paddingTop: 4, textAlignVertical: 'top' },

  // Two-column row
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },

  // Image previews
  posterPreview: {
    marginTop: -6,
    marginBottom: 18,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER,
    alignSelf: 'flex-start',
    backgroundColor: SURFACE_2,
  },
  posterImg: { width: 120, height: 180 },
  previewFailed: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  previewFailedText: { fontSize: 12, color: DANGER, fontWeight: '600' },
  backdropPreview: {
    marginTop: -6,
    marginBottom: 18,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE_2,
    aspectRatio: 16 / 9,
  },
  backdropImg: { width: '100%', height: '100%' },

  // Chips
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, marginBottom: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE,
  },
  chipActive: {
    backgroundColor: 'rgba(245,196,81,0.14)',
    borderColor: YELLOW,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: DIM,
    letterSpacing: 0.2,
  },
  chipTextActive: { color: YELLOW },

  // Featured premium card
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE,
    marginBottom: 8,
  },
  featureCardActive: {
    borderColor: YELLOW,
    backgroundColor: 'rgba(245,196,81,0.08)',
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE_2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIconActive: {
    borderColor: 'rgba(245,196,81,0.55)',
    backgroundColor: 'rgba(245,196,81,0.12)',
  },
  featureTextWrap: { flex: 1 },
  featureTitle: { fontSize: 14, fontWeight: '800', letterSpacing: 0.2 },
  featureDesc: { fontSize: 12, color: DIM, marginTop: 2 },

  // Sticky footer
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: BG,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  footerActions: { flexDirection: 'row', gap: 10 },
  footerHalf: { flex: 1 },
  spinner: { marginTop: 8 },
});
