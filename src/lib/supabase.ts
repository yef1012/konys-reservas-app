import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import type { Database } from '@/types/database';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const isServer = Platform.OS === 'web' && typeof window === 'undefined';

export const configurationError = !url || !/^https:\/\/[^\s]+$/.test(url) || !key?.startsWith('sb_publishable_')
  ? 'Configura EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY con los valores públicos del proyecto y reinicia Expo.'
  : '';

// No se utiliza service_role ni se acepta una clave secreta como clave pública.
export const supabase = configurationError ? null : createClient<Database>(url!, key!, {
  auth: {
    ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
    persistSession: !isServer,
    autoRefreshToken: !isServer,
    detectSessionInUrl: false,
  },
  global: {
    fetch: async (input, init) => {
      const controller = new AbortController();
      const abort = () => controller.abort();
      const timer = setTimeout(abort, 15000);
      init?.signal?.addEventListener('abort', abort, { once: true });
      if (init?.signal?.aborted) abort();
      try { return await fetch(input, { ...init, signal: controller.signal }); }
      finally { clearTimeout(timer); init?.signal?.removeEventListener('abort', abort); }
    },
  },
});

export function requireSupabase() {
  if (!supabase) throw new Error(configurationError);
  return supabase;
}
