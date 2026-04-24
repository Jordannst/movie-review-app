import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
const AUTH_STORAGE_KEY = 'movie-review-auth-token';
const REMEMBER_SESSION_KEY = 'movie-review-remember-session';

let shouldPersistSession = true;

function canUsePersistentStorage(): boolean {
  return typeof document !== 'undefined' || globalThis.navigator?.product === 'ReactNative';
}

const authStorage = {
  async getItem(key: string) {
    if (!canUsePersistentStorage()) return null;

    if (key === AUTH_STORAGE_KEY) {
      const rememberSession = await AsyncStorage.getItem(REMEMBER_SESSION_KEY);
      if (rememberSession === 'false') return null;
    }
    return AsyncStorage.getItem(key);
  },
  async setItem(key: string, value: string) {
    if (!canUsePersistentStorage()) return;

    if (key === AUTH_STORAGE_KEY && !shouldPersistSession) {
      await AsyncStorage.removeItem(key);
      return;
    }
    await AsyncStorage.setItem(key, value);
  },
  async removeItem(key: string) {
    if (!canUsePersistentStorage()) return;

    await AsyncStorage.removeItem(key);
  },
};

export async function setSessionPersistence(rememberSession: boolean) {
  shouldPersistSession = rememberSession;
  if (!canUsePersistentStorage()) return;

  await AsyncStorage.setItem(REMEMBER_SESSION_KEY, rememberSession ? 'true' : 'false');

  if (!rememberSession) {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[Supabase] Missing env vars.\n' +
    'Pastikan EXPO_PUBLIC_SUPABASE_URL dan EXPO_PUBLIC_SUPABASE_ANON_KEY sudah diisi di file .env'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Simpan session di AsyncStorage agar login tetap aktif setelah app ditutup
    storage: authStorage,
    storageKey: AUTH_STORAGE_KEY,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
