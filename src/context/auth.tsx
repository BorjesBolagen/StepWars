import type { Session } from '@supabase/supabase-js';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';
import { Platform } from 'react-native';

import { isConfigured, supabase, type Profile } from '@/lib/supabase';

type AuthState = {
  /** False = Supabase-nycklar saknas; appen kör demoläge på mockdata. */
  configured: boolean;
  /** True tills den sparade sessionen har lästs in vid appstart. */
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
    birthYear: number,
  ) => Promise<string | null>;
  signOut: () => Promise<void>;
  /** Skickar en återställningskod till e-postadressen. */
  requestPasswordReset: (email: string) => Promise<string | null>;
  /** Verifierar koden ur mejlet och sätter det nya lösenordet. */
  confirmPasswordReset: (
    email: string,
    code: string,
    newPassword: string,
  ) => Promise<string | null>;
  /** Raderar kontot och all dess data permanent (Google Play-krav). */
  deleteAccount: () => Promise<string | null>;
};

const AuthContext = createContext<AuthState | null>(null);

/** Felmeddelanden på vardagssvenska i stället för Supabase-engelska. */
function translateAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) return 'Fel e-post eller lösenord.';
  if (message.includes('already registered')) return 'E-postadressen har redan ett konto.';
  if (message.includes('Password should be')) return 'Lösenordet behöver minst 6 tecken.';
  if (message.includes('valid email')) return 'Det där ser inte ut som en e-postadress.';
  if (message.includes('Email not confirmed'))
    return 'Bekräfta din e-post via länken vi skickade, och logga sedan in.';
  return message;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(isConfigured);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !session) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    supabase
      .from('profiles')
      .select('id, display_name, birth_year, daily_goal')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setProfile(data);
      });
    // Dynamiska importer: nativa moduler ska inte dras in på webben
    // eller vid statisk rendering — de laddas först på en riktig enhet.
    if (Platform.OS !== 'web') {
      import('@/lib/notifications').then(({ registerForPush }) => {
        if (!cancelled) registerForPush(session.user.id);
      });
      import('@/lib/background-sync').then(({ registerBackgroundSync }) => {
        if (!cancelled) registerBackgroundSync();
      });
    }
    return () => {
      cancelled = true;
    };
  }, [session]);

  const signIn: AuthState['signIn'] = async (email, password) => {
    if (!supabase) return 'Supabase är inte konfigurerat.';
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? translateAuthError(error.message) : null;
  };

  const signUp: AuthState['signUp'] = async (email, password, displayName, birthYear) => {
    if (!supabase) return 'Supabase är inte konfigurerat.';
    // Namn och födelseår följer med som metadata — databastriggern
    // handle_new_user (migration 3) skapar profilraden ur den.
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName, birth_year: birthYear } },
    });
    return error ? translateAuthError(error.message) : null;
  };

  const signOut = async () => {
    await supabase?.auth.signOut();
  };

  const requestPasswordReset: AuthState['requestPasswordReset'] = async (email) => {
    if (!supabase) return 'Supabase är inte konfigurerat.';
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return error ? translateAuthError(error.message) : null;
  };

  const confirmPasswordReset: AuthState['confirmPasswordReset'] = async (
    email,
    code,
    newPassword,
  ) => {
    if (!supabase) return 'Supabase är inte konfigurerat.';
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'recovery' });
    if (error) {
      return error.message.includes('expired') || error.message.includes('invalid')
        ? 'Fel eller för gammal kod — begär en ny.'
        : translateAuthError(error.message);
    }
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    return updateError ? translateAuthError(updateError.message) : null;
  };

  const deleteAccount: AuthState['deleteAccount'] = async () => {
    if (!supabase) return 'Supabase är inte konfigurerat.';
    const { error } = await supabase.rpc('delete_account');
    if (error) return error.message;
    await supabase.auth.signOut();
    return null;
  };

  return (
    <AuthContext.Provider
      value={{
        configured: isConfigured,
        loading,
        session,
        profile,
        signIn,
        signUp,
        signOut,
        requestPasswordReset,
        confirmPasswordReset,
        deleteAccount,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const state = useContext(AuthContext);
  if (!state) throw new Error('useAuth måste användas inuti AuthProvider');
  return state;
}
