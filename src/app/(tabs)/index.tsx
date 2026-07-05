import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/card';
import { ProgressBar } from '@/components/progress-bar';
import { ProgressRing } from '@/components/progress-ring';
import { Screen } from '@/components/screen';
import { Eyebrow, Muted, Num, Title } from '@/components/typography';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useSteps } from '@/hooks/use-steps';
import { useTheme } from '@/hooks/use-theme';
import { formatKm, formatSteps } from '@/lib/format';
import { getJourney, journeyPosition } from '@/lib/journeys';
import { challenges, me, today } from '@/lib/mock';

const WEEKDAYS = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'];
const MONTHS = [
  'januari', 'februari', 'mars', 'april', 'maj', 'juni',
  'juli', 'augusti', 'september', 'oktober', 'november', 'december',
];

function todayLabel(): string {
  const now = new Date();
  return `${WEEKDAYS[now.getDay()]} ${now.getDate()} ${MONTHS[now.getMonth()]}`;
}

function challengeSummary(
  challenge: (typeof challenges)[number],
  mySteps: number,
  lead: number,
  myRank: number,
): string {
  if (challenge.kind === 'journey' && challenge.journeyId) {
    const journey = getJourney(challenge.journeyId);
    if (journey) {
      const { next, done } = journeyPosition(journey, mySteps);
      return done
        ? 'Framme! Du har gått hela vägen'
        : `Nästa delmål: ${next!.name} · ${formatSteps(next!.steps - mySteps)} steg kvar`;
    }
  }
  if (challenge.kind === 'first_to_goal') {
    return lead >= 0
      ? `Du leder med ${formatSteps(lead)} steg`
      : `Du ligger ${formatSteps(-lead)} steg efter`;
  }
  const daysLeft = challenge.daysLeft != null ? ` · ${challenge.daysLeft} dagar kvar` : '';
  return `${myRank}:a av ${challenge.standings.length}${daysLeft}`;
}

export default function IdagScreen() {
  const colors = useTheme();
  const { profile } = useAuth();
  const { steps } = useSteps();

  const firstName = profile?.display_name.split(/\s+/)[0] ?? 'Johan';
  const goal = profile?.daily_goal ?? today.goal;
  const progress = steps / goal;
  // ~0,75 m per steg — grov men rimlig skattning tills hälsodata ger exakt distans.
  const distanceKm = steps * 0.00075;

  return (
    <Screen>
      <View>
        <Eyebrow>{todayLabel()}</Eyebrow>
        <Title>Hej {firstName}</Title>
      </View>

      <View style={styles.ringWrap}>
        <ProgressRing progress={progress}>
          <Num style={styles.ringSteps}>{formatSteps(steps)}</Num>
          <Muted>
            av {formatSteps(goal)} steg · {Math.round(progress * 100)} %
          </Muted>
        </ProgressRing>
      </View>

      <View style={styles.statRow}>
        <Card style={styles.stat}>
          <Num style={styles.statValue}>{formatKm(distanceKm)}</Num>
          <Muted style={styles.statLabel}>km</Muted>
        </Card>
        <Card style={styles.stat}>
          <Num style={styles.statValue}>{today.activeMinutes}</Num>
          <Muted style={styles.statLabel}>min aktiv</Muted>
        </Card>
        <Card style={styles.stat}>
          <Num style={[styles.statValue, { color: colors.accent }]}>{today.streakDays}</Num>
          <Muted style={styles.statLabel}>dagar i rad</Muted>
        </Card>
      </View>

      <Eyebrow>Dina utmaningar</Eyebrow>
      {challenges.map((challenge) => {
        const mine = challenge.standings.find((s) => s.person.id === me.id);
        const leaderSteps = Math.max(...challenge.standings.map((s) => s.steps));
        const myRank = challenge.standings.findIndex((s) => s.person.id === me.id) + 1;
        const lead = mine ? mine.steps - Math.max(...challenge.standings.filter((s) => s.person.id !== me.id).map((s) => s.steps)) : 0;

        return (
          <Link key={challenge.id} href={{ pathname: '/utmaning/[id]', params: { id: challenge.id } }} asChild>
            <Pressable accessibilityRole="button">
              <Card style={styles.challengeCard}>
                <View style={styles.challengeHead}>
                  <Text style={[styles.challengeName, { color: colors.text }]}>{challenge.title}</Text>
                  <View style={[styles.tag, { backgroundColor: colors.accentSoft }]}>
                    <Text style={[styles.tagText, { color: colors.accent }]}>{challenge.tag}</Text>
                  </View>
                </View>
                <ProgressBar
                  progress={
                    challenge.goalSteps
                      ? (mine?.steps ?? 0) / challenge.goalSteps
                      : (mine?.steps ?? 0) / leaderSteps
                  }
                  tone={challenge.kind === 'first_to_goal' ? 'accent' : 'primary'}
                />
                <Muted>{challengeSummary(challenge, mine?.steps ?? 0, lead, myRank)}</Muted>
              </Card>
            </Pressable>
          </Link>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  ringWrap: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  ringSteps: {
    fontSize: 34,
    letterSpacing: -0.5,
  },
  statRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.one,
  },
  statValue: {
    fontSize: 17,
  },
  statLabel: {
    fontSize: 11,
  },
  challengeCard: {
    gap: Spacing.two,
  },
  challengeHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  challengeName: {
    fontSize: 15,
    fontWeight: '700',
    flexShrink: 1,
  },
  tag: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
