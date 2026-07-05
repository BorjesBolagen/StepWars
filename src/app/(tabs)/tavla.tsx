import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { Segmented } from '@/components/segmented';
import { Eyebrow, Muted, Num, Title } from '@/components/typography';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatSteps } from '@/lib/format';
import { leaderboards, me } from '@/lib/mock';

type Scope = 'alla' | 'aldersgrupp' | 'vanner';
type Period = 'idag' | 'vecka' | 'manad';

const SCOPES: { value: Scope; label: string }[] = [
  { value: 'alla', label: 'Alla' },
  { value: 'aldersgrupp', label: '35–44 år' },
  { value: 'vanner', label: 'Vänner' },
];

const PERIODS: { value: Period; label: string }[] = [
  { value: 'idag', label: 'Idag' },
  { value: 'vecka', label: 'Vecka' },
  { value: 'manad', label: 'Månad' },
];

export default function TavlaScreen() {
  const colors = useTheme();
  const [scope, setScope] = useState<Scope>('vanner');
  const [period, setPeriod] = useState<Period>('vecka');

  const entries = leaderboards[scope];
  const myIndex = entries.findIndex((entry) => entry.person.id === me.id);
  const gapToFirst = myIndex > 0 ? entries[0].steps - entries[myIndex].steps : 0;

  const medalColor = (rank: number) =>
    rank === 1 ? colors.gold : rank === 2 ? colors.silver : rank === 3 ? colors.bronze : colors.textSecondary;

  return (
    <Screen>
      <Title>Tävla</Title>
      <Segmented options={SCOPES} value={scope} onChange={setScope} />

      <View style={styles.chips}>
        {PERIODS.map((p) => {
          const active = p.value === period;
          return (
            <Pressable
              key={p.value}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setPeriod(p.value)}
              style={[
                styles.chip,
                { borderColor: colors.border },
                active && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}>
              <Text
                style={[
                  styles.chipText,
                  { color: active ? colors.onPrimary : colors.textSecondary },
                ]}>
                {p.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Eyebrow>Vecka 27 · 3 dagar kvar</Eyebrow>

      <View style={styles.list}>
        {entries.map((entry, index) => {
          const rank = index + 1;
          const isMe = entry.person.id === me.id;
          return (
            <Card key={entry.person.id} highlighted={isMe} style={styles.row}>
              <Num style={[styles.rank, { color: medalColor(rank) }]}>{rank}</Num>
              <Avatar person={entry.person} />
              <View style={styles.who}>
                <Text style={[styles.name, { color: colors.text }]}>{entry.person.name}</Text>
                <Muted style={styles.avg}>{formatSteps(entry.avgPerDay)} / dag i snitt</Muted>
              </View>
              <Num style={styles.steps}>{formatSteps(entry.steps)}</Num>
            </Card>
          );
        })}
      </View>

      {gapToFirst > 0 && (
        <Muted style={styles.note}>
          Du är <Text style={{ color: colors.accent, fontWeight: '800' }}>{formatSteps(gapToFirst)} steg</Text>{' '}
          från förstaplatsen
        </Muted>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  list: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
    paddingVertical: Spacing.two + 2,
  },
  rank: {
    width: 22,
    textAlign: 'center',
    fontSize: 15,
  },
  who: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
  },
  avg: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  steps: {
    fontSize: 15,
  },
  note: {
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
});
