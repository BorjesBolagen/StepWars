import { Redirect } from 'expo-router';
import { useState } from 'react';
import {
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

import { Card } from '@/components/card';
import { Muted } from '@/components/typography';
import { Fonts, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/hooks/use-theme';

type Mode = 'signin' | 'signup' | 'reset';

export default function LoginScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { configured, session, signIn, signUp, requestPasswordReset, confirmPasswordReset } =
    useAuth();

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [resetCodeSent, setResetCodeSent] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Demoläge utan nycklar, och färdig inloggning, går direkt till apparna.
  if (!configured || session) {
    return <Redirect href="/" />;
  }

  const submit = async () => {
    setError(null);
    setNotice(null);

    if (mode === 'reset') {
      if (!resetCodeSent) {
        setBusy(true);
        const message = await requestPasswordReset(email.trim());
        setBusy(false);
        if (message) {
          setError(message);
        } else {
          setResetCodeSent(true);
          setNotice('Kod skickad! Kolla din e-post och skriv in koden nedan.');
        }
        return;
      }
      if (password.length < 6) {
        setError('Välj ett nytt lösenord med minst 6 tecken.');
        return;
      }
      setBusy(true);
      const message = await confirmPasswordReset(email.trim(), resetCode.trim(), password);
      setBusy(false);
      if (message) setError(message);
      // Lyckad verifiering loggar in — Redirect ovanför tar över.
      return;
    }

    if (mode === 'signup') {
      const year = Number(birthYear);
      if (!displayName.trim()) {
        setError('Skriv ditt namn — det syns i topplistorna.');
        return;
      }
      const currentYear = new Date().getFullYear();
      if (!Number.isInteger(year) || year < 1900 || year > currentYear) {
        setError('Ange födelseår med fyra siffror, t.ex. 1985.');
        return;
      }
      setBusy(true);
      const message = await signUp(email.trim(), password, displayName.trim(), year);
      setBusy(false);
      if (message) {
        setError(message);
      } else {
        setNotice('Konto skapat! Kolla din e-post om en bekräftelselänk behövs, annars är du inloggad.');
      }
      return;
    }

    setBusy(true);
    const message = await signIn(email.trim(), password);
    setBusy(false);
    if (message) setError(message);
  };

  const field = [
    styles.input,
    { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
  ];

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + Spacing.six, paddingBottom: Spacing.five },
        ]}>
        <View style={styles.inner}>
          <View style={styles.brand}>
            <Text style={[styles.logo, { color: colors.primary }]}>
              Stega<Text style={{ color: colors.accent }}>.</Text>
            </Text>
            <Muted>Tävla med dina steg</Muted>
          </View>

          <Card style={styles.form}>
            <Text style={[styles.formTitle, { color: colors.text }]}>
              {mode === 'signin' ? 'Logga in' : mode === 'signup' ? 'Skapa konto' : 'Nytt lösenord'}
            </Text>

            {mode === 'signup' && (
              <>
                <TextInput
                  style={field}
                  placeholder="Namn (syns i topplistorna)"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="words"
                  value={displayName}
                  onChangeText={setDisplayName}
                />
                <TextInput
                  style={field}
                  placeholder="Födelseår, t.ex. 1985"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="number-pad"
                  maxLength={4}
                  value={birthYear}
                  onChangeText={setBirthYear}
                />
              </>
            )}

            <TextInput
              style={field}
              placeholder="E-post"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              editable={!(mode === 'reset' && resetCodeSent)}
              value={email}
              onChangeText={setEmail}
            />
            {mode === 'reset' && resetCodeSent && (
              <TextInput
                style={field}
                placeholder="Kod från mejlet"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                value={resetCode}
                onChangeText={setResetCode}
              />
            )}
            {(mode !== 'reset' || resetCodeSent) && (
              <TextInput
                style={field}
                placeholder={mode === 'reset' ? 'Nytt lösenord' : 'Lösenord'}
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            )}

            {error && <Text style={[styles.message, { color: colors.accent }]}>{error}</Text>}
            {notice && <Text style={[styles.message, { color: colors.primary }]}>{notice}</Text>}

            <Pressable
              accessibilityRole="button"
              disabled={busy || !email || (mode !== 'reset' && !password)}
              onPress={submit}
              style={({ pressed }) => [
                styles.cta,
                {
                  backgroundColor: colors.accent,
                  opacity:
                    busy || !email || (mode !== 'reset' && !password) ? 0.5 : pressed ? 0.85 : 1,
                },
              ]}>
              <Text style={[styles.ctaText, { color: colors.onAccent }]}>
                {busy
                  ? 'Ett ögonblick …'
                  : mode === 'signin'
                    ? 'Logga in'
                    : mode === 'signup'
                      ? 'Skapa konto'
                      : resetCodeSent
                        ? 'Byt lösenord'
                        : 'Skicka kod'}
              </Text>
            </Pressable>

            {mode === 'signin' && (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setMode('reset');
                  setResetCodeSent(false);
                  setResetCode('');
                  setPassword('');
                  setError(null);
                  setNotice(null);
                }}>
                <Muted style={styles.switchMode}>Glömt lösenordet?</Muted>
              </Pressable>
            )}

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setResetCodeSent(false);
                setResetCode('');
                setError(null);
                setNotice(null);
              }}>
              <Muted style={styles.switchMode}>
                {mode === 'signin'
                  ? 'Ny här? Skapa ett konto'
                  : mode === 'signup'
                    ? 'Har du redan ett konto? Logga in'
                    : 'Tillbaka till inloggningen'}
              </Muted>
            </Pressable>
          </Card>

          <Muted style={styles.footnote}>
            Ditt födelseår används bara för att placera dig i rätt åldersgrupp.
          </Muted>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.three,
  },
  inner: {
    width: '100%',
    maxWidth: Math.min(MaxContentWidth, 440),
    alignSelf: 'center',
    gap: Spacing.four,
  },
  brand: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  logo: {
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: -1,
    fontFamily: Fonts?.rounded,
  },
  form: {
    gap: Spacing.two + 2,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
    fontSize: 15,
  },
  message: {
    fontSize: 13,
    fontWeight: '600',
  },
  cta: {
    borderRadius: Radius.button,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '800',
  },
  switchMode: {
    textAlign: 'center',
    fontWeight: '700',
  },
  footnote: {
    textAlign: 'center',
    fontSize: 12,
  },
});
