import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { Colors } from '@/constants/theme';
import { AuthProvider } from '@/context/auth';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const colors = dark ? Colors.dark : Colors.light;

  const navTheme = {
    ...(dark ? DarkTheme : DefaultTheme),
    colors: {
      ...(dark ? DarkTheme : DefaultTheme).colors,
      primary: colors.accent,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <AuthProvider>
      <ThemeProvider value={navTheme}>
        <StatusBar style={dark ? 'light' : 'dark'} />
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="vanner" options={{ title: 'Vänner', headerBackTitle: 'Tillbaka' }} />
          <Stack.Screen name="utmaning/[id]" options={{ title: 'Utmaning', headerBackTitle: 'Tillbaka' }} />
        </Stack>
      </ThemeProvider>
    </AuthProvider>
  );
}
