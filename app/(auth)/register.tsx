import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
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
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { setSessionPersistence, supabase } from '@/lib/supabase';

function validateEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
}

const FORM_BASE_DELAY = 100;
const FIELD_STAGGER = 80;
const ANIM_DURATION = 320;
const EASING = Easing.out(Easing.cubic);

function ShimmerButton({
  onPress,
  loading,
  label,
  delay,
}: {
  onPress: () => void;
  loading: boolean;
  label: string;
  delay: number;
}) {
  const shimmerX = useSharedValue(-1);

  useEffect(() => {
    shimmerX.value = withDelay(
      delay + 400,
      withTiming(2, { duration: 1200, easing: Easing.inOut(Easing.quad) })
    );
  }, [delay, shimmerX]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value * 200 }],
  }));

  return (
    <Animated.View entering={FadeInUp.duration(ANIM_DURATION).delay(delay).easing(EASING)}>
      <Pressable onPress={onPress} disabled={loading}>
        {({ pressed }) => (
          <LinearGradient
            colors={['#F5C451', '#FF8C42']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[s.btn, pressed && s.btnPressed]}
          >
            {loading ? (
              <ActivityIndicator color="#0C0E18" />
            ) : (
              <Text style={s.btnText}>{label}</Text>
            )}
            <Animated.View style={[s.shimmer, shimmerStyle]} />
          </LinearGradient>
        )}
      </Pressable>
    </Animated.View>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  icon: keyof typeof Ionicons.glyphMap;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words';
  error?: string;
  enterDelay: number;
}

function Field({
  label, value, onChangeText, placeholder, icon,
  secureTextEntry, keyboardType = 'default', autoCapitalize = 'none',
  error, enterDelay,
}: FieldProps) {
  const [focused, setFocused] = useState(false);
  const borderColors: [string, string] = focused
    ? ['#F5C451', '#FF8C42']
    : error
      ? ['#F04452', '#F04452']
      : ['rgba(245,196,81,0.2)', 'rgba(255,140,66,0.1)'];

  return (
    <Animated.View
      style={s.fieldWrap}
      entering={FadeInDown.duration(ANIM_DURATION).delay(enterDelay).easing(EASING)}
    >
      <Text style={s.fieldLabel}>{label}</Text>
      <LinearGradient colors={borderColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.fieldBorder}>
        <View style={s.fieldInner}>
          <TextInput
            style={s.input}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#3A4060"
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            autoCorrect={false}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          <Ionicons name={icon} size={18} color={focused ? '#F5C451' : 'rgba(255,255,255,0.2)'} style={s.fieldIcon} />
        </View>
      </LinearGradient>
      {!!error && <Text style={s.fieldError}>{error}</Text>}
    </Animated.View>
  );
}

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ displayName?: string; email?: string; password?: string; confirm?: string; global?: string }>({});

  const validate = () => {
    const next: typeof errors = {};
    if (!displayName.trim()) next.displayName = 'Nama wajib diisi';
    if (!email.trim()) next.email = 'Email wajib diisi';
    else if (!validateEmail(email)) next.email = 'Format email tidak valid';
    if (!password) next.password = 'Password wajib diisi';
    else if (password.length < 8) next.password = 'Minimal 8 karakter';
    if (!confirm) next.confirm = 'Konfirmasi password wajib diisi';
    else if (confirm !== password) next.confirm = 'Password tidak cocok';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    await setSessionPersistence(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { display_name: displayName.trim() } },
    });
    setLoading(false);
    if (error) setErrors({ global: error.message });
  };

  const d0 = FORM_BASE_DELAY;
  const d1 = d0 + FIELD_STAGGER;
  const d2 = d1 + FIELD_STAGGER;
  const d3 = d2 + FIELD_STAGGER;
  const d4 = d3 + 150;
  const d5 = d4 + 200;

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={[s.formInner, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!!errors.global && (
          <View style={s.globalErr}>
            <Text style={s.globalErrText}>{errors.global}</Text>
          </View>
        )}

        <Field label="DISPLAY NAME" value={displayName} onChangeText={setDisplayName} placeholder="Your name" autoCapitalize="words" icon="person-outline" error={errors.displayName} enterDelay={d0} />
        <Field label="EMAIL ADDRESS" value={email} onChangeText={setEmail} placeholder="you@email.com" keyboardType="email-address" icon="mail-outline" error={errors.email} enterDelay={d1} />
        <Field label="PASSWORD" value={password} onChangeText={setPassword} placeholder="Min 8 characters" secureTextEntry icon="lock-closed-outline" error={errors.password} enterDelay={d2} />
        <Field label="CONFIRM PASSWORD" value={confirm} onChangeText={setConfirm} placeholder="Repeat password" secureTextEntry icon="lock-closed-outline" error={errors.confirm} enterDelay={d3} />

        <ShimmerButton onPress={handleRegister} loading={loading} label="CREATE ACCOUNT" delay={d4} />

        <Animated.View
          style={s.footerRow}
          entering={FadeIn.duration(ANIM_DURATION).delay(d5).easing(EASING)}
        >
          <Text style={s.footerText}>Already have an account? </Text>
          <Pressable onPress={() => router.push('/(auth)/login')} hitSlop={12}>
            <Text style={s.footerLink}>LOG IN</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  formInner: { paddingHorizontal: 20, paddingTop: 12 },
  globalErr: { backgroundColor: '#2A1015', borderRadius: 12, padding: 16, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#F04452' },
  globalErrText: { fontSize: 14, color: '#F04452', fontWeight: '500' },

  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: '#8E9BB0', marginBottom: 6, textTransform: 'uppercase' },
  fieldBorder: { borderRadius: 14, padding: 2 },
  fieldInner: { backgroundColor: '#141828', borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingRight: 14 },
  input: { flex: 1, height: 48, fontSize: 15, color: '#fff', paddingHorizontal: 14 },
  fieldIcon: { marginLeft: 4 },
  fieldError: { fontSize: 12, color: '#F04452', marginTop: 6, marginLeft: 4 },

  btn: { height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 8, overflow: 'hidden', shadowColor: '#F5C451', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 18, elevation: 10 },
  btnPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  btnText: { fontSize: 15, fontWeight: '800', color: '#0C0E18', letterSpacing: 0.3 },
  shimmer: { position: 'absolute', top: 0, bottom: 0, width: 60, backgroundColor: 'rgba(255,255,255,0.25)', transform: [{ skewX: '-20deg' }] },

  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  footerText: { fontSize: 13, color: '#5A6682' },
  footerLink: { fontSize: 13, fontWeight: '700', color: '#F5C451' },
});
