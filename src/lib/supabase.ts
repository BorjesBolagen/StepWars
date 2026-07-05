import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase-klient. Utan miljövariablerna nedan (se .env.example) kör appen
 * i demoläge på mockdata — då är `supabase` null och inloggningen hoppas över.
 * Anon-nyckeln är publik per design; åtkomstkontrollen bor i RLS-policyerna
 * i supabase/migrations/.
 */

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Vid statisk webbrendering (expo export) finns inget window — då får
// sessionslagringen svara tomt i stället för att krascha renderingen.
const storage = {
  getItem: (key: string) =>
    typeof window === 'undefined' ? Promise.resolve(null) : AsyncStorage.getItem(key),
  setItem: (key: string, value: string) =>
    typeof window === 'undefined' ? Promise.resolve() : AsyncStorage.setItem(key, value),
  removeItem: (key: string) =>
    typeof window === 'undefined' ? Promise.resolve() : AsyncStorage.removeItem(key),
};

export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          storage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;

/** True när riktiga Supabase-nycklar finns; false = demoläge på mockdata. */
export const isConfigured = supabase !== null;

export type Profile = {
  id: string;
  display_name: string;
  birth_year: number;
  daily_goal: number;
};
