import { Stack, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/card';
import { ProgressBar } from '@/components/progress-bar';
import { Screen } from '@/components/screen';
import { Eyebrow, Muted, Num, Title } from '@/components/typography';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatSteps } from '@/lib/format';
import { challenges, me, today } from '@/lib/mock';

export default function UtmaningScreen() {
  const colors = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const challenge = challenges.find((c) => c.id === id) ?? challenges[0];

  const sorted = [...challenge.standings].sort((a, b) => b.steps - a.steps);
  const mine = challenge.standings.find((s) => s.person.id === me.id);
  const rivals = challenge.standings.filter((s) => s.person.id !== me.id);
  const bestRival = rivals.reduce((best, s) => (s.steps > best.steps ? s : best), rivals[0]);
  const lead = (mine?.steps ?? 0) - bestRival.steps;

  const goal = challenge.goalSteps;
  const avgPerDay = mine ? Math.round(mine.steps / Math.max(challenge.daysElapsed, 1)) : 0;
  const daysToGoal =
    goal && mine && avgPerDay > 0 ? Math.ceil((goal - mine.steps) / avgPerDay) : null;

  return (
    <Screen>
      <Stack.Screen options={{ title: challenge.title }} />
      <View>
        <Eyebrow>
          {challenge.tag} · dag {challenge.daysElapsed}
        </Eyebrow>
        <Title>{challenge.title}</Title>
      </View>

      <View style={[styles.leadBanner, { backgroundColor: colors.primary }]}>
        <Text style={[styles.leadText, { color: colors.onPrimary }]}>
          {lead >= 0
            ? `Du leder med ${formatSteps(lead)} steg`
            : `${bestRival.person.name.split(' ')[0]} leder med ${formatSteps(-lead)} steg`}
        </Text>
        <Text style={[styles.leadSub, { color: colors.onPrimary }]}>
          {lead >= 0
            ? `${bestRival.person.name.split(' ')[0]} behöver en långpromenad ikväll för att komma ikapp`
            : 'En kvällspromenad kan vända läget'}
        </Text>
      </View>

      <View style={styles.lanes}>
        {sorted.map((standing) => {
          const isMe = standing.person.id === me.id;
          const max = goal ?? sorted[0].steps;
          return (
            <Card key={standing.person.id} style={styles.lane}>
              <View style={styles.laneTop}>
                <Text style={[styles.laneName, { color: colors.text }]}>
                  {isMe ? 'Du' : standing.person.name.split(' ')[0]}
                </Text>
                <Num style={{ color: isMe ? colors.accent : colors.primary, fontSize: 15 }}>
                  {formatSteps(standing.steps)}
                </Num>
              </View>
              <ProgressBar progress={standing.steps / max} tone={isMe ? 'accent' : 'primary'} />
            </Card>
          );
        })}
      </View>

      <Muted style={styles.dayLog}>
        Idag: Du +{formatSteps(today.steps)}
        {rivals.length === 1 ? ` · ${bestRival.person.name.split(' ')[0]} +${formatSteps(7902)}` : ''}
      </Muted>

      {goal != null && (
        <Card style={styles.goalCard}>
          <View style={styles.laneTop}>
            <Text style={[styles.laneName, { color: colors.text }]}>Målgång</Text>
            <View style={[styles.tag, { backgroundColor: colors.accentSoft }]}>
              <Num style={[styles.tagText, { color: colors.accent }]}>{formatSteps(goal)} steg</Num>
            </View>
          </View>
          {daysToGoal != null && (
            <Muted>
              I din takt ({formatSteps(avgPerDay)}/dag) är du framme om ca {daysToGoal} dagar
            </Muted>
          )}
        </Card>
      )}

      <Pressable
        accessibilityRole="button"
        onPress={() =>
          // TODO: skicka pushnotis via backend när notiser är byggda.
          Alert.alert('Snart!', 'Peppen skickas via pushnotiser när backend är inkopplad.')
        }
        style={({ pressed }) => [
          styles.cta,
          { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
        ]}>
        <Text style={[styles.ctaText, { color: colors.onPrimary }]}>
          Skicka en pepp till {bestRival.person.name.split(' ')[0]}
        </Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  leadBanner: {
    borderRadius: Radius.card,
    padding: Spacing.three,
    alignItems: 'center',
    gap: 2,
  },
  leadText: {
    fontSize: 15,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  leadSub: {
    fontSize: 12,
    opacity: 0.8,
    textAlign: 'center',
  },
  lanes: {
    gap: Spacing.two,
  },
  lane: {
    gap: Spacing.two,
  },
  laneTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  laneName: {
    fontSize: 14,
    fontWeight: '700',
  },
  dayLog: {
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  goalCard: {
    gap: Spacing.two,
  },
  tag: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 11,
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
});
