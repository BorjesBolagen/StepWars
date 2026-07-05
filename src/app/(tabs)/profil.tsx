import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { Eyebrow, Muted, Num, Title } from '@/components/typography';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatSteps } from '@/lib/format';
import { today } from '@/lib/mock';

export default function ProfilScreen() {
  const colors = useTheme();

  return (
    <Screen>
      <Title>Profil</Title>

      <Card style={styles.profileCard}>
        <Avatar person={{ id: 'me', name: 'Johan', initials: 'JB', hue: 'ledorange' }} size={56} />
        <View style={styles.profileText}>
          <Text style={[styles.name, { color: colors.text }]}>Johan Börjesson</Text>
          <Muted>Åldersgrupp 35–44 år</Muted>
        </View>
      </Card>

      <Eyebrow>Mitt mål</Eyebrow>
      <Card style={styles.row}>
        <Ionicons name="footsteps-outline" size={20} color={colors.accent} />
        <Text style={[styles.rowLabel, { color: colors.text }]}>Dagsmål</Text>
        <Num style={styles.rowValue}>{formatSteps(today.goal)} steg</Num>
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
        <Muted>v0.1 · grundskelett</Muted>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  profileText: {
    gap: 2,
  },
  name: {
    fontSize: 17,
    fontWeight: '800',
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
});
