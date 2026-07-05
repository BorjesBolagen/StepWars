import type { Session } from '@supabase/supabase-js';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';

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

  return (
    <AuthContext.Provider
      value={{ configured: isConfigured, loading, session, profile, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const state = useContext(AuthContext);
  if (!state) throw new Error('useAuth måste användas inuti AuthProvider');
  return state;
}
