import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase-klient. Kräver att miljövariablerna nedan är satta (se .env.example).
 * Skärmarna kör än så länge på mockdata (src/lib/mock.ts) — klienten kopplas in
 * när inloggning och stegsynk byggs.
 *
 * TODO innan auth aktiveras: lägg till @react-native-async-storage/async-storage
 * och skicka in den som storage i auth-optionen så sessionen överlever omstart.
 */

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error(
      'Supabase är inte konfigurerat. Kopiera .env.example till .env och fyll i EXPO_PUBLIC_SUPABASE_URL och EXPO_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }
  client ??= createClient(url, anonKey);
  return client;
}
