import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
const AUTH_STORAGE_KEY = 'movie-review-auth-token';
const REMEMBER_SESSION_KEY = 'movie-review-remember-session';

let shouldPersistSession = true;
let ephemeralAuthSession: string | null = null;

function canUsePersistentStorage(): boolean {
  return typeof document !== 'undefined' || globalThis.navigator?.product === 'ReactNative';
}

const authStorage = {
  async getItem(key: string) {
    if (!canUsePersistentStorage()) {
      return key === AUTH_STORAGE_KEY ? ephemeralAuthSession : null;
    }

    if (key === AUTH_STORAGE_KEY) {
      const rememberSession = await AsyncStorage.getItem(REMEMBER_SESSION_KEY);
      if (rememberSession === 'false') return ephemeralAuthSession;
    }
    return AsyncStorage.getItem(key);
  },
  async setItem(key: string, value: string) {
    if (!canUsePersistentStorage()) {
      if (key === AUTH_STORAGE_KEY) {
        ephemeralAuthSession = value;
      }
      return;
    }

    if (key === AUTH_STORAGE_KEY && !shouldPersistSession) {
      ephemeralAuthSession = value;
      await AsyncStorage.removeItem(key);
      return;
    }
    if (key === AUTH_STORAGE_KEY) {
      ephemeralAuthSession = null;
    }
    await AsyncStorage.setItem(key, value);
  },
  async removeItem(key: string) {
    if (key === AUTH_STORAGE_KEY) {
      ephemeralAuthSession = null;
    }

    if (!canUsePersistentStorage()) return;

    await AsyncStorage.removeItem(key);
  },
};

export async function setSessionPersistence(rememberSession: boolean) {
  shouldPersistSession = rememberSession;
  if (!canUsePersistentStorage()) return;

  await AsyncStorage.setItem(REMEMBER_SESSION_KEY, rememberSession ? 'true' : 'false');

  if (!rememberSession) {
    ephemeralAuthSession = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  } else if (ephemeralAuthSession) {
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, ephemeralAuthSession);
    ephemeralAuthSession = null;
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
