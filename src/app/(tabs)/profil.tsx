import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { Eyebrow, Muted, Num, Title } from '@/components/typography';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useFriends } from '@/hooks/use-friends';
import { useTheme } from '@/hooks/use-theme';
import { formatSteps } from '@/lib/format';
import { today } from '@/lib/mock';
import { ageGroupLabel, ageGroupOf, initialsOf } from '@/lib/people';

export default function ProfilScreen() {
  const colors = useTheme();
  const { configured, session, profile, signOut, deleteAccount } = useAuth();
  const { live, friends, incoming } = useFriends();

  const confirmDelete = () => {
    Alert.alert(
      'Radera kontot?',
      'Ditt konto, dina steg, vänskaper och utmaningar raderas permanent. Det går inte att ångra.',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Radera permanent',
          style: 'destructive',
          onPress: async () => {
            const message = await deleteAccount();
            if (message) Alert.alert('Hoppsan', message);
          },
        },
      ],
    );
  };

  const name = profile?.display_name ?? 'Johan Börjesson';
  const ageGroup = profile ? ageGroupLabel(ageGroupOf(profile.birth_year)) : '35–44 år';
  const dailyGoal = profile?.daily_goal ?? today.goal;
  const friendSummary = !live
    ? '4 vänner'
    : incoming.length > 0
      ? `${incoming.length} ny förfrågan`
      : `${friends.length} ${friends.length === 1 ? 'vän' : 'vänner'}`;

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

      <Eyebrow>Vänner</Eyebrow>
      <Link href="/vanner" asChild>
        <Pressable accessibilityRole="button">
          <Card style={styles.row}>
            <Ionicons name="people-outline" size={20} color={colors.accent} />
            <Text style={[styles.rowLabel, { color: colors.text }]}>Mina vänner</Text>
            <Muted style={incoming.length > 0 ? { color: colors.accent, fontWeight: '700' } : undefined}>
              {friendSummary}
            </Muted>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </Card>
        </Pressable>
      </Link>

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
      <Link href="/integritet" asChild>
        <Pressable accessibilityRole="button">
          <Card style={styles.row}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
            <Text style={[styles.rowLabel, { color: colors.text }]}>Integritetspolicy</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </Card>
        </Pressable>
      </Link>

      {session && (
        <>
          <Pressable
            accessibilityRole="button"
            onPress={signOut}
            style={({ pressed }) => [
              styles.signOut,
              { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
            ]}>
            <Text style={[styles.signOutText, { color: colors.accent }]}>Logga ut</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={confirmDelete}>
            <Muted style={styles.deleteAccount}>Radera kontot och all data</Muted>
          </Pressable>
        </>
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
  deleteAccount: {
    textAlign: 'center',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
});
