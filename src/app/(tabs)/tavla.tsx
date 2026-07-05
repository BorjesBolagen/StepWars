import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { Segmented } from '@/components/segmented';
import { Eyebrow, Muted, Num, Title } from '@/components/typography';
import { Spacing } from '@/constants/theme';
import { useLeaderboard, type Scope } from '@/hooks/use-leaderboard';
import { useTheme } from '@/hooks/use-theme';
import { formatSteps } from '@/lib/format';

type Period = 'idag' | 'vecka' | 'manad';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'idag', label: 'Idag' },
  { value: 'vecka', label: 'Vecka' },
  { value: 'manad', label: 'Månad' },
];

function weekLabel(): string {
  const now = new Date();
  // ISO 8601-veckonummer (svensk standard).
  const target = new Date(now);
  target.setDate(now.getDate() + 3 - ((now.getDay() + 6) % 7));
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const week =
    1 +
    Math.round(
      ((target.getTime() - firstThursday.getTime()) / 86400000 -
        3 +
        ((firstThursday.getDay() + 6) % 7)) /
        7,
    );
  const daysLeft = 7 - ((now.getDay() + 6) % 7);
  return `Vecka ${week} · ${daysLeft === 7 ? 'sista dagen' : `${daysLeft} dagar kvar`}`;
}

export default function TavlaScreen() {
  const colors = useTheme();
  const [scope, setScope] = useState<Scope>('vanner');
  const [period, setPeriod] = useState<Period>('vecka');
  const { entries, loading, live, myId, myAgeGroup } = useLeaderboard(scope);

  const scopes: { value: Scope; label: string }[] = [
    { value: 'alla', label: 'Alla' },
    {
      value: 'aldersgrupp',
      label: myAgeGroup ? (myAgeGroup === 'Under 18' || myAgeGroup === '65+' ? myAgeGroup : `${myAgeGroup} år`) : '35–44 år',
    },
    { value: 'vanner', label: 'Vänner' },
  ];

  const myIndex = entries.findIndex((entry) => entry.person.id === myId);
  const gapToFirst = myIndex > 0 ? entries[0].steps - entries[myIndex].steps : 0;

  const medalColor = (rank: number) =>
    rank === 1 ? colors.gold : rank === 2 ? colors.silver : rank === 3 ? colors.bronze : colors.textSecondary;

  return (
    <Screen>
      <Title>Tävla</Title>
      <Segmented options={scopes} value={scope} onChange={setScope} />

      <View style={styles.chips}>
        {PERIODS.map((p) => {
          const active = p.value === period;
          // I skarpt läge finns bara veckodata ännu — övriga perioder
          // aktiveras när daglig/månadsaggregering byggs.
          const disabled = live && p.value !== 'vecka';
          return (
            <Pressable
              key={p.value}
              accessibilityRole="button"
              accessibilityState={{ selected: active, disabled }}
              disabled={disabled}
              onPress={() => setPeriod(p.value)}
              style={[
                styles.chip,
                { borderColor: colors.border, opacity: disabled ? 0.4 : 1 },
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

      <Eyebrow>{weekLabel()}</Eyebrow>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loading} />
      ) : entries.length === 0 ? (
        <Card style={styles.empty}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {scope === 'vanner' ? 'Inga vänner ännu' : 'Inga steg registrerade ännu'}
          </Text>
          <Muted style={styles.emptyText}>
            {scope === 'vanner'
              ? 'Utmana någon via Utmana-fliken så dyker de upp här.'
              : 'Öppna appen på telefonen så synkas dina steg — topplistan fylls på allteftersom.'}
          </Muted>
        </Card>
      ) : (
        <View style={styles.list}>
          {entries.map((entry, index) => {
            const rank = index + 1;
            const isMe = entry.person.id === myId;
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
      )}

      {!loading && gapToFirst > 0 && (
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
  loading: {
    marginTop: Spacing.four,
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.four,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 280,
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
