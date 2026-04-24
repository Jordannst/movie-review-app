import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { type ReactElement, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View
} from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/auth-context';
import { getCurrentUserProfile, updateProfile } from '@/services/profile';

const BG = '#0B0D12';
const SURFACE = '#141828';
const BORDER = '#1E2234';
const DIM = '#5A607A';
const YELLOW = '#F5C451';
const DANGER = '#F04452';

const GENRE_OPTIONS = [
  'Sci-Fi', 'Action', 'Drama', 'Thriller', 'Crime',
  'Animation', 'Romance', 'Comedy', 'Horror', 'Fantasy',
  'Documentary', 'Mystery',
] as const;

const BADGE_SUGGESTIONS = ['Member', 'Cinephile', 'Critic', 'Collector', 'Binge Watcher'] as const;

const BIO_MAX = 160;
const NAME_MAX = 40;
const USERNAME_MAX = 20;
const BADGE_MAX = 24;

type FieldErrors = {
  name?: string;
  username?: string;
  bio?: string;
  badgeLabel?: string;
  global?: string;
};

export default function EditProfileScreen(): ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [badgeLabel, setBadgeLabel] = useState('Member');
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([]);

  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const profile = await getCurrentUserProfile();
        if (!active) return;

        if (profile) {
          setName(profile.name ?? '');
          setUsername(profile.username ?? '');
          setBio(profile.bio ?? '');
          setBadgeLabel(profile.badgeLabel?.trim() || 'Member');
          setFavoriteGenres(profile.favoriteGenres ?? []);
        } else {
          const metaName =
            (user?.user_metadata?.name as string | undefined) ??
            (user?.user_metadata?.full_name as string | undefined) ??
            (user?.user_metadata?.display_name as string | undefined) ??
            user?.email?.split('@')[0] ??
            '';
          setName(metaName);
        }
      } catch (error) {
        if (!active) return;
        setErrors({ global: error instanceof Error ? error.message : 'Gagal memuat profil.' });
      } finally {
        if (active) setInitialLoading(false);
      }
    }

    void loadProfile();
    return () => {
      active = false;
    };
  }, [user?.email, user?.user_metadata]);

  function toggleGenre(genre: string) {
    setFavoriteGenres((current) =>
      current.includes(genre) ? current.filter((g) => g !== genre) : [...current, genre]
    );
  }

  function validate(): boolean {
    const next: FieldErrors = {};

    if (!name.trim()) next.name = 'Nama wajib diisi';
    else if (name.trim().length > NAME_MAX) next.name = `Maks ${NAME_MAX} karakter`;

    const usernameClean = username.trim().replace(/^@/, '');
    if (usernameClean.length > 0) {
      if (!/^[a-zA-Z0-9_]+$/.test(usernameClean)) {
        next.username = 'Hanya huruf, angka, dan _';
      } else if (usernameClean.length > USERNAME_MAX) {
        next.username = `Maks ${USERNAME_MAX} karakter`;
      }
    }

    if (bio.length > BIO_MAX) next.bio = `Maks ${BIO_MAX} karakter`;
    if (badgeLabel.trim().length > BADGE_MAX) next.badgeLabel = `Maks ${BADGE_MAX} karakter`;

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSave() {
    if (!user) {
      setErrors({ global: 'Sesi berakhir. Silakan login ulang.' });
      return;
    }
    if (!validate()) return;

    setSaving(true);
    setErrors({});

    try {
      const updated = await updateProfile(
        user.id,
        { name, username, bio, badgeLabel, favoriteGenres },
        user.email
      );

      // Sync local state with what DB returned, so user sees confirmation
      // (e.g. trimmed name, normalized username)
      setName(updated.name);
      setUsername(updated.username ?? '');
      setBio(updated.bio);
      setBadgeLabel(updated.badgeLabel);
      setFavoriteGenres(updated.favoriteGenres);

      Alert.alert(
        'Profile updated',
        'Perubahan profil kamu sudah tersimpan.',
        [{ text: 'OK', onPress: () => router.back() }],
        { cancelable: false }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menyimpan profil.';
      if (message.toLowerCase().includes('username')) {
        setErrors({ username: message });
      } else {
        setErrors({ global: message });
      }
      Alert.alert('Gagal menyimpan', message);
    } finally {
      setSaving(false);
    }
  }

  if (initialLoading) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator color={YELLOW} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={22} color="#F5F7FA" />
          </Pressable>
          <ThemedText style={styles.headerTitle}>Edit Profile</ThemedText>
          <View style={styles.headerBtn} />
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={insets.top + 60}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {!!errors.global && (
              <Animated.View entering={FadeIn.duration(220)} style={styles.globalErr}>
                <ThemedText style={styles.globalErrText}>{errors.global}</ThemedText>
              </Animated.View>
            )}

            <Animated.View entering={FadeInDown.duration(280).delay(40).easing(Easing.out(Easing.cubic))}>
              <Field
                label="Name"
                value={name}
                onChangeText={setName}
                placeholder="Your display name"
                maxLength={NAME_MAX}
                error={errors.name}
                autoCapitalize="words"
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(280).delay(80).easing(Easing.out(Easing.cubic))}>
              <Field
                label="Username"
                value={username}
                onChangeText={setUsername}
                placeholder="unique_handle"
                maxLength={USERNAME_MAX + 1}
                error={errors.username}
                prefix="@"
                autoCapitalize="none"
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(280).delay(120).easing(Easing.out(Easing.cubic))}>
              <Field
                label="Bio"
                value={bio}
                onChangeText={setBio}
                placeholder="Tell the community about your taste in films..."
                multiline
                maxLength={BIO_MAX}
                counter={`${bio.length}/${BIO_MAX}`}
                error={errors.bio}
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(280).delay(160).easing(Easing.out(Easing.cubic))}>
              <ThemedText style={styles.fieldLabel}>Badge</ThemedText>
              <View style={styles.chipsRow}>
                {BADGE_SUGGESTIONS.map((suggestion) => {
                  const isActive = badgeLabel.trim().toLowerCase() === suggestion.toLowerCase();
                  return (
                    <Pressable
                      key={suggestion}
                      onPress={() => setBadgeLabel(suggestion)}
                      style={[styles.chip, isActive && styles.chipActive]}
                    >
                      <ThemedText style={[styles.chipText, isActive && styles.chipTextActive]}>
                        {suggestion}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
              <View style={[styles.inputWrap, !!errors.badgeLabel && styles.inputWrapError]}>
                <TextInput
                  style={styles.input}
                  value={badgeLabel}
                  onChangeText={setBadgeLabel}
                  placeholder="Or type a custom badge"
                  placeholderTextColor="#3A4060"
                  maxLength={BADGE_MAX}
                />
              </View>
              {!!errors.badgeLabel && (
                <ThemedText style={styles.errText}>{errors.badgeLabel}</ThemedText>
              )}
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(280).delay(200).easing(Easing.out(Easing.cubic))}>
              <ThemedText style={styles.fieldLabel}>
                Favorite Genres{' '}
                <ThemedText style={styles.labelHint}>({favoriteGenres.length} selected)</ThemedText>
              </ThemedText>
              <View style={styles.chipsRow}>
                {GENRE_OPTIONS.map((genre) => {
                  const isActive = favoriteGenres.includes(genre);
                  return (
                    <Pressable
                      key={genre}
                      onPress={() => toggleGenre(genre)}
                      style={[styles.chip, isActive && styles.chipActive]}
                    >
                      <ThemedText style={[styles.chipText, isActive && styles.chipTextActive]}>
                        {genre}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
            <PrimaryButton
              label={saving ? 'Saving...' : 'Save Changes'}
              onPress={handleSave}
              disabled={saving}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  multiline?: boolean;
  maxLength?: number;
  error?: string;
  prefix?: string;
  counter?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words';
};

function Field({
  label, value, onChangeText, placeholder, multiline, maxLength,
  error, prefix, counter, autoCapitalize = 'sentences',
}: FieldProps): ReactElement {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.fieldWrap}>
      <View style={styles.fieldLabelRow}>
        <ThemedText style={styles.fieldLabel}>{label}</ThemedText>
        {counter ? <ThemedText style={styles.counter}>{counter}</ThemedText> : null}
      </View>
      <View
        style={[
          styles.inputWrap,
          multiline && styles.inputWrapMulti,
          focused && styles.inputWrapFocus,
          !!error && styles.inputWrapError,
        ]}
      >
        {prefix ? <ThemedText style={styles.prefix}>{prefix}</ThemedText> : null}
        <TextInput
          style={[styles.input, multiline && styles.inputMulti, !!prefix && styles.inputWithPrefix]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#3A4060"
          multiline={multiline}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
      {!!error && <ThemedText style={styles.errText}>{error}</ThemedText>}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: BG },
  safe: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 4,
  },

  globalErr: {
    backgroundColor: '#2A1015',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: DANGER,
  },
  globalErrText: { fontSize: 13, color: DANGER, fontWeight: '600' },

  fieldWrap: { marginBottom: 18 },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#8E9BB0',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  labelHint: {
    fontSize: 11,
    fontWeight: '600',
    color: DIM,
    textTransform: 'none',
    letterSpacing: 0,
  },
  counter: {
    fontSize: 11,
    fontWeight: '600',
    color: DIM,
  },

  inputWrap: {
    backgroundColor: SURFACE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  inputWrapMulti: {
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  inputWrapFocus: {
    borderColor: YELLOW,
  },
  inputWrapError: {
    borderColor: DANGER,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: '#F5F7FA',
  },
  inputMulti: {
    height: 120,
    paddingTop: 4,
  },
  inputWithPrefix: {
    paddingLeft: 2,
  },
  prefix: {
    fontSize: 15,
    color: DIM,
    marginRight: 2,
  },
  errText: {
    fontSize: 12,
    color: DANGER,
    marginTop: 6,
    marginLeft: 2,
  },

  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    paddingHorizontal: 12,
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
  chipTextActive: {
    color: YELLOW,
  },

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
});
