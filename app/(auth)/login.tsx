import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';

// ─── helpers ────────────────────────────────────────────────────────────────

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// ─── sub-components (stable refs, no inline objects) ────────────────────────

function HeroSection() {
  return (
    <LinearGradient
      colors={['#1A1D2A', '#0F111A', '#0B0D12']}
      locations={[0, 0.55, 1]}
      style={styles.hero}
    >
      {/* Gold ambient glow */}
      <View style={styles.heroGlow} />

      {/* Film-grain dots pattern */}
      <View style={styles.heroPattern} />

      <View style={styles.heroContent}>
        <View style={styles.heroBadgeRow}>
          <View style={styles.heroBadgeDot} />
          <Text style={styles.heroBadgeText}>TRACK · REVIEW · DISCOVER</Text>
        </View>
        <Text style={styles.heroLogo}>MovieReview</Text>
        <Text style={styles.heroTagline}>
          Track every film.{'\n'}Build your streak.{'\n'}Share your taste.
        </Text>
      </View>
    </LinearGradient>
  );
}

interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences';
  error?: string;
}

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error,
}: InputFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          focused && styles.inputFocused,
          !!error && styles.inputError,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#5A607A"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {!!error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

// ─── main screen ────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; global?: string }>({});

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!email.trim()) next.email = 'Email wajib diisi';
    else if (!validateEmail(email)) next.email = 'Format email tidak valid';
    if (!password) next.password = 'Password wajib diisi';
    else if (password.length < 6) next.password = 'Password minimal 6 karakter';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSignIn = async () => {
    if (!validate()) return;
    setIsLoading(true);
    setErrors({});
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setIsLoading(false);
    if (error) {
      setErrors({ global: error.message });
    }
    // Navigation handled by auth guard in root layout
  };

  const goToRegister = () => router.push('/(auth)/register');

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <HeroSection />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.formScroll, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.formHeading}>Sign in</Text>

          {!!errors.global && (
            <View style={styles.globalError}>
              <Text style={styles.globalErrorText}>{errors.global}</Text>
            </View>
          )}

          <InputField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@email.com"
            keyboardType="email-address"
            error={errors.email}
          />
          <InputField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            error={errors.password}
          />

          <Pressable style={styles.forgotBtn} hitSlop={8}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
            onPress={handleSignIn}
            disabled={isLoading}
          >
            {isLoading
              ? <ActivityIndicator color="#0B0D12" />
              : <Text style={styles.primaryBtnText}>Sign in →</Text>
            }
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable style={({ pressed }) => [styles.ghostBtn, pressed && styles.ghostBtnPressed]}>
            <Text style={styles.googleG}>G</Text>
            <Text style={styles.ghostBtnText}>Continue with Google</Text>
          </Pressable>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>New here? </Text>
            <Pressable onPress={goToRegister} hitSlop={8}>
              <Text style={styles.footerLink}>Create account</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0B0D12',
  },
  flex: {
    flex: 1,
  },

  // Hero
  hero: {
    height: 220,
    overflow: 'hidden',
    position: 'relative',
  },
  heroGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#F5C451',
    opacity: 0.07,
  },
  heroPattern: {
    position: 'absolute',
    inset: 0,
    opacity: 0.04,
  },
  heroContent: {
    position: 'absolute',
    bottom: 24,
    left: 24,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  heroBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F5C451',
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.8,
    color: '#F5C451',
  },
  heroLogo: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    color: '#F5F7FA',
    marginBottom: 4,
  },
  heroTagline: {
    fontSize: 13,
    color: '#5A607A',
    lineHeight: 20,
  },

  // Form
  formScroll: {
    padding: 24,
  },
  formHeading: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: '#F5F7FA',
    marginBottom: 20,
  },

  // Global error
  globalError: {
    backgroundColor: '#2A1015',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#F04452',
  },
  globalErrorText: {
    fontSize: 13,
    color: '#F04452',
  },

  // Field
  fieldWrapper: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#5A607A',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A3142',
    backgroundColor: '#141923',
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#F5F7FA',
  },
  inputFocused: {
    borderColor: '#F5C451',
    backgroundColor: '#141923',
  },
  inputError: {
    borderColor: '#F04452',
  },
  fieldError: {
    fontSize: 11,
    color: '#F04452',
    marginTop: 4,
  },

  // Forgot
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: -4,
  },
  forgotText: {
    fontSize: 12,
    color: '#5A607A',
  },

  // Primary button
  primaryBtn: {
    height: 50,
    backgroundColor: '#F5C451',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnPressed: {
    backgroundColor: '#D9A83A',
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0B0D12',
    letterSpacing: 0.2,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#2A3142',
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#3A4060',
  },

  // Ghost button
  ghostBtn: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A3142',
    backgroundColor: '#141923',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ghostBtnPressed: {
    backgroundColor: '#1C2230',
  },
  googleG: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F5F7FA',
  },
  ghostBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#98A2B3',
  },

  // Footer
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 13,
    color: '#5A607A',
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F5C451',
  },
});
