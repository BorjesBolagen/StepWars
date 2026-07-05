import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { Eyebrow, Muted, Num, Title } from '@/components/typography';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/hooks/use-theme';
import { formatSteps } from '@/lib/format';
import { today } from '@/lib/mock';

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function ageGroupOf(birthYear: number): string {
  const age = new Date().getFullYear() - birthYear;
  if (age < 18) return 'Under 18';
  if (age < 25) return '18–24';
  if (age < 35) return '25–34';
  if (age < 45) return '35–44';
  if (age < 55) return '45–54';
  if (age < 65) return '55–64';
  return '65+';
}

export default function ProfilScreen() {
  const colors = useTheme();
  const { configured, session, profile, signOut } = useAuth();

  const name = profile?.display_name ?? 'Johan Börjesson';
  const ageGroup = profile ? ageGroupOf(profile.birth_year) : '35–44 år';
  const dailyGoal = profile?.daily_goal ?? today.goal;

  return (
    <Screen>
      <Title>Profil</Title>

      {!configured && (
        <Card style={styles.demoBanner} highlighted>
          <Text style={[styles.demoTitle, { color: colors.accent }]}>Demoläge</Text>
          <Muted style={styles.demoText}>
            Appen visar exempeldata. Lägg in Supabase-nycklarna i .env för att logga in på riktigt.
          </Muted>
        </Card>
      )}

      <Card style={styles.profileCard}>
        <Avatar
          person={{ id: 'me', name, initials: initialsOf(name), hue: 'ledorange' }}
          size={56}
        />
        <View style={styles.profileText}>
          <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
          <Muted>Åldersgrupp {ageGroup}</Muted>
          {session?.user.email && <Muted style={styles.email}>{session.user.email}</Muted>}
        </View>
      </Card>

      <Eyebrow>Mitt mål</Eyebrow>
      <Card style={styles.row}>
        <Ionicons name="footsteps-outline" size={20} color={colors.accent} />
        <Text style={[styles.rowLabel, { color: colors.text }]}>Dagsmål</Text>
        <Num style={styles.rowValue}>{formatSteps(dailyGoal)} steg</Num>
      </Card>

      <Eyebrow>Datakällor</Eyebrow>
      <Card style={styles.row}>
        <Ionicons name="heart-outline" size={20} color={colors.primary} />
        <Text style={[styles.rowLabel, { color: colors.text }]}>Apple Hälsa / Health Connect</Text>
        <Muted>Kopplas snart</Muted>
      </Card>

      <Eyebrow>Om</Eyebrow>
      <Card style={styles.row}>
        <Ionicons name="leaf-outline" size={20} color={colors.primary} />
        <Text style={[styles.rowLabel, { color: colors.text }]}>Stega</Text>
        <Muted>v0.1</Muted>
      </Card>

      {session && (
        <Pressable
          accessibilityRole="button"
          onPress={signOut}
          style={({ pressed }) => [
            styles.signOut,
            { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
          ]}>
          <Text style={[styles.signOutText, { color: colors.accent }]}>Logga ut</Text>
        </Pressable>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  demoBanner: {
    gap: 2,
  },
  demoTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  demoText: {
    fontSize: 12,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  profileText: {
    gap: 2,
    flexShrink: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '800',
  },
  email: {
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 4,
  },
  rowLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  rowValue: {
    fontSize: 14,
  },
  signOut: {
    borderWidth: 1,
    borderRadius: Radius.button,
    paddingVertical: Spacing.two + 4,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
