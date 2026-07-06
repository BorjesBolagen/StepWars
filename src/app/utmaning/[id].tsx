import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/card';
import { ProgressBar } from '@/components/progress-bar';
import { Screen } from '@/components/screen';
import { Eyebrow, Muted, Num, Title } from '@/components/typography';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useChallenges } from '@/hooks/use-challenges';
import { useSteps } from '@/hooks/use-steps';
import { useTheme } from '@/hooks/use-theme';
import { formatSteps } from '@/lib/format';
import { getJourney, journeyPosition } from '@/lib/journeys';
import { supabase } from '@/lib/supabase';

export default function UtmaningScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const { live, loading, challenges, respond } = useChallenges();
  const { steps: todaySteps } = useSteps();

  const myId = live && session ? session.user.id : 'me';
  const challenge = challenges.find((c) => c.id === id);

  if (loading && !challenge) {
    return (
      <Screen>
        <ActivityIndicator color={colors.accent} style={styles.loading} />
      </Screen>
    );
  }
  if (!challenge) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Utmaning' }} />
        <Card style={styles.notFound}>
          <Muted>Utmaningen hittades inte — den kan ha avslutats.</Muted>
        </Card>
      </Screen>
    );
  }

  const isStreak = challenge.kind === 'daily_goal_streak';
  const formatValue = (value: number) =>
    isStreak ? `${value} ${value === 1 ? 'dag' : 'dagar'}` : formatSteps(value);

  const sorted = [...challenge.standings].sort((a, b) => b.steps - a.steps);
  const mine = challenge.standings.find((s) => s.person.id === myId);
  const rivals = challenge.standings.filter((s) => s.person.id !== myId);
  const bestRival =
    rivals.length > 0
      ? rivals.reduce((best, s) => (s.steps > best.steps ? s : best), rivals[0])
      : null;
  const lead = bestRival ? (mine?.steps ?? 0) - bestRival.steps : 0;
  const rivalFirstName = bestRival?.person.name.split(' ')[0] ?? '';

  const goal = challenge.goalSteps;
  const avgPerDay = mine ? Math.round(mine.steps / Math.max(challenge.daysElapsed, 1)) : 0;
  const daysToGoal =
    !isStreak && goal && mine && avgPerDay > 0
      ? Math.ceil((goal - mine.steps) / avgPerDay)
      : null;

  const journey = challenge.journeyId ? getJourney(challenge.journeyId) : undefined;
  const position = journey && mine ? journeyPosition(journey, mine.steps) : undefined;

  const invited = challenge.myStatus === 'invited' && !challenge.finished;
  const winnerStanding = challenge.finished
    ? challenge.standings.find((s) => s.person.id === challenge.winnerId)
    : undefined;

  const answer = async (accept: boolean) => {
    await respond(challenge.id, accept);
    if (!accept) router.back();
  };

  const sendNudge = async () => {
    if (!live || !session || !supabase || !bestRival) {
      Alert.alert('Demoläge', 'Logga in för att peppa på riktigt.');
      return;
    }
    const { error } = await supabase.from('nudges').insert({
      challenge_id: challenge.id,
      from_user: session.user.id,
      to_user: bestRival.person.id,
    });
    Alert.alert(
      error ? 'Hoppsan' : 'Skickat! 📣',
      error ? error.message : `Peppen är på väg till ${rivalFirstName}.`,
    );
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: challenge.title }} />
      <View>
        <Eyebrow>
          {challenge.tag} · dag {challenge.daysElapsed}
        </Eyebrow>
        <Title>{challenge.title}</Title>
      </View>

      {invited && (
        <Card style={styles.inviteCard} highlighted>
          <Text style={[styles.inviteTitle, { color: colors.text }]}>Du är utmanad!</Text>
          <Muted style={styles.inviteText}>Antar du utmaningen?</Muted>
          <View style={styles.inviteButtons}>
            <Pressable
              accessibilityRole="button"
              onPress={() => answer(true)}
              style={({ pressed }) => [
                styles.inviteButton,
                { backgroundColor: colors.accent, opacity: pressed ? 0.85 : 1 },
              ]}>
              <Text style={[styles.inviteButtonText, { color: colors.onAccent }]}>Anta utmaningen</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => answer(false)}
              style={({ pressed }) => [
                styles.inviteButton,
                { borderWidth: 1, borderColor: colors.border, opacity: pressed ? 0.6 : 1 },
              ]}>
              <Text style={[styles.inviteButtonText, { color: colors.textSecondary }]}>Tacka nej</Text>
            </Pressable>
          </View>
        </Card>
      )}

      {challenge.finished ? (
        <View style={[styles.leadBanner, { backgroundColor: colors.accent }]}>
          <Text style={[styles.leadText, { color: colors.onAccent }]}>
            {winnerStanding
              ? winnerStanding.person.name === 'Du'
                ? '🏆 Du vann!'
                : `🏆 ${winnerStanding.person.name.split(' ')[0]} vann`
              : 'Utmaningen är avgjord'}
          </Text>
          <Text style={[styles.leadSub, { color: colors.onAccent }]}>
            {winnerStanding?.person.name === 'Du'
              ? 'Snyggt gånget — dags att utmana igen?'
              : 'Revansch? Skapa en ny utmaning i Utmana-fliken.'}
          </Text>
        </View>
      ) : (
        bestRival && (
          <View style={[styles.leadBanner, { backgroundColor: colors.primary }]}>
            <Text style={[styles.leadText, { color: colors.onPrimary }]}>
              {lead >= 0
                ? `Du leder med ${formatValue(lead)}`
                : `${rivalFirstName} leder med ${formatValue(-lead)}`}
            </Text>
            <Text style={[styles.leadSub, { color: colors.onPrimary }]}>
              {lead >= 0
                ? `${rivalFirstName} behöver en långpromenad ikväll för att komma ikapp`
                : 'En kvällspromenad kan vända läget'}
            </Text>
          </View>
        )
      )}

      <View style={styles.lanes}>
        {sorted.map((standing) => {
          const isMe = standing.person.id === myId;
          const max = isStreak
            ? Math.max(challenge.daysElapsed, 1)
            : (goal ?? Math.max(sorted[0].steps, 1));
          return (
            <Card key={standing.person.id} style={styles.lane}>
              <View style={styles.laneTop}>
                <Text style={[styles.laneName, { color: colors.text }]}>
                  {isMe ? 'Du' : standing.person.name.split(' ')[0]}
                </Text>
                <Num style={{ color: isMe ? colors.accent : colors.primary, fontSize: 15 }}>
                  {formatValue(standing.steps)}
                </Num>
              </View>
              <ProgressBar
                progress={max > 0 ? standing.steps / max : 0}
                tone={isMe ? 'accent' : 'primary'}
              />
            </Card>
          );
        })}
      </View>

      {!isStreak && (
        <Muted style={styles.dayLog}>Idag: Du +{formatSteps(todaySteps)}</Muted>
      )}

      {journey && position && mine && (
        <>
          <Eyebrow>Delmål · {journey.film}</Eyebrow>
          <Card style={styles.milestones}>
            {journey.milestones.map((milestone) => {
              const isReached = milestone.steps <= mine.steps;
              const isNext = position.next?.name === milestone.name;
              return (
                <View key={milestone.name} style={styles.milestoneRow}>
                  <Ionicons
                    name={isReached ? 'checkmark-circle' : isNext ? 'walk' : 'ellipse-outline'}
                    size={18}
                    color={isReached ? colors.accent : isNext ? colors.primary : colors.border}
                  />
                  <Text
                    style={[
                      styles.milestoneName,
                      { color: isReached || isNext ? colors.text : colors.textSecondary },
                      isNext && styles.milestoneNext,
                    ]}>
                    {milestone.name}
                  </Text>
                  <Num
                    style={[
                      styles.milestoneSteps,
                      { color: isReached ? colors.accent : colors.textSecondary },
                    ]}>
                    {formatSteps(milestone.steps)}
                  </Num>
                </View>
              );
            })}
            {position.next && (
              <Muted style={styles.milestoneNote}>
                {formatSteps(position.next.steps - mine.steps)} steg kvar till {position.next.name}
              </Muted>
            )}
          </Card>
        </>
      )}

      {goal != null && !isStreak && (
        <Card style={styles.goalCard}>
          <View style={styles.laneTop}>
            <Text style={[styles.laneName, { color: colors.text }]}>Målgång</Text>
            <View style={[styles.tag, { backgroundColor: colors.accentSoft }]}>
              <Num style={[styles.tagText, { color: colors.accent }]}>{formatSteps(goal)} steg</Num>
            </View>
          </View>
          {daysToGoal != null && daysToGoal > 0 && (
            <Muted>
              I din takt ({formatSteps(avgPerDay)}/dag) är du framme om ca {daysToGoal}{' '}
              {daysToGoal === 1 ? 'dag' : 'dagar'}
            </Muted>
          )}
        </Card>
      )}

      {isStreak && goal != null && (
        <Card style={styles.goalCard}>
          <View style={styles.laneTop}>
            <Text style={[styles.laneName, { color: colors.text }]}>Regeln</Text>
            <View style={[styles.tag, { backgroundColor: colors.accentSoft }]}>
              <Num style={[styles.tagText, { color: colors.accent }]}>
                {formatSteps(goal)} steg/dag
              </Num>
            </View>
          </View>
          <Muted>Flest klarade dagar när tiden är slut vinner.</Muted>
        </Card>
      )}

      {!invited && !challenge.finished && bestRival && (
        <Pressable
          accessibilityRole="button"
          onPress={sendNudge}
          style={({ pressed }) => [
            styles.cta,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}>
          <Text style={[styles.ctaText, { color: colors.onPrimary }]}>
            Skicka en pepp till {rivalFirstName}
          </Text>
        </Pressable>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: {
    marginTop: Spacing.five,
  },
  notFound: {
    alignItems: 'center',
    paddingVertical: Spacing.four,
  },
  inviteCard: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  inviteTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  inviteText: {
    fontSize: 13,
  },
  inviteButtons: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  inviteButton: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  inviteButtonText: {
    fontSize: 13,
    fontWeight: '800',
  },
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
  milestones: {
    gap: Spacing.two + 2,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
  },
  milestoneName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  milestoneNext: {
    fontWeight: '800',
  },
  milestoneSteps: {
    fontSize: 12,
    fontWeight: '600',
  },
  milestoneNote: {
    fontSize: 12,
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
