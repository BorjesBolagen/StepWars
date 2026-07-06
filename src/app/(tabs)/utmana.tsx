import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { Eyebrow, Muted, Title } from '@/components/typography';
import { Radius, Spacing } from '@/constants/theme';
import { useChallenges } from '@/hooks/use-challenges';
import { useFriends } from '@/hooks/use-friends';
import { useTheme } from '@/hooks/use-theme';
import { formatSteps } from '@/lib/format';
import { journeys } from '@/lib/journeys';
import { challengeKinds, friends as mockFriends, type ChallengeKind, type Person } from '@/lib/mock';
import { toPerson } from '@/lib/people';

export default function UtmanaScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { live, friends: realFriends } = useFriends();
  const { create } = useChallenges();
  const [kind, setKind] = useState<ChallengeKind>('most_steps');
  const [journeyId, setJourneyId] = useState<string>('mordor');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!live) {
      Alert.alert('Demoläge', 'Logga in för att skapa utmaningar på riktigt.');
      return;
    }
    setBusy(true);
    const { id, error } = await create(kind, [...selected], kind === 'journey' ? journeyId : undefined);
    setBusy(false);
    if (error || !id) {
      Alert.alert('Hoppsan', error ?? 'Kunde inte skapa utmaningen. Försök igen.');
      return;
    }
    setSelected(new Set());
    router.push({ pathname: '/utmaning/[id]', params: { id } });
  };

  const friends: Person[] = live
    ? realFriends.map((friend, index) => toPerson(friend.id, friend.display_name, index))
    : mockFriends;

  const toggleFriend = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const count = selected.size;
  const ctaLabel =
    count === 0
      ? 'Välj minst en vän'
      : count === 1
        ? 'Skicka utmaning till 1 vän'
        : `Skicka utmaning till ${count} vänner`;

  return (
    <Screen>
      <Title>Ny utmaning</Title>

      <Eyebrow>Välj typ</Eyebrow>
      <View style={styles.kinds}>
        {challengeKinds.map((option) => {
          const active = option.kind === kind;
          return (
            <Pressable
              key={option.kind}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              onPress={() => setKind(option.kind)}>
              <Card highlighted={active} style={styles.kindCard}>
                <View
                  style={[
                    styles.radio,
                    { borderColor: active ? colors.accent : colors.border },
                  ]}>
                  {active && <View style={[styles.radioDot, { backgroundColor: colors.accent }]} />}
                </View>
                <View style={styles.kindText}>
                  <Text style={[styles.kindTitle, { color: colors.text }]}>{option.title}</Text>
                  <Muted style={styles.kindDescription}>{option.description}</Muted>
                </View>
              </Card>
            </Pressable>
          );
        })}
      </View>

      {kind === 'journey' && (
        <>
          <Eyebrow>Välj vandring</Eyebrow>
          <View style={styles.kinds}>
            {journeys.map((journey) => {
              const active = journey.id === journeyId;
              return (
                <Pressable
                  key={journey.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  onPress={() => setJourneyId(journey.id)}>
                  <Card highlighted={active} style={styles.journeyCard}>
                    <View style={styles.journeyHead}>
                      <Text style={[styles.kindTitle, { color: colors.text }]}>{journey.title}</Text>
                      <Muted style={styles.journeyFilm}>{journey.film}</Muted>
                    </View>
                    <Muted style={styles.kindDescription}>{journey.description}</Muted>
                    <Muted style={[styles.journeyMeta, { color: colors.accent }]}>
                      {formatSteps(journey.totalSteps)} steg · {journey.milestones.length - 1} delmål
                    </Muted>
                  </Card>
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      <Eyebrow>Utmana vem?</Eyebrow>
      {live && friends.length === 0 && (
        <Card style={styles.noFriends}>
          <Muted style={styles.noFriendsText}>
            Du har inga vänner att utmana ännu.
          </Muted>
          <Link href="/vanner" asChild>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.noFriendsButton,
                { backgroundColor: colors.accent, opacity: pressed ? 0.85 : 1 },
              ]}>
              <Text style={[styles.noFriendsButtonText, { color: colors.onAccent }]}>
                Lägg till vänner
              </Text>
            </Pressable>
          </Link>
        </Card>
      )}
      <View style={styles.friends}>
        {friends.map((friend) => {
          const isSelected = selected.has(friend.id);
          return (
            <Pressable
              key={friend.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
              onPress={() => toggleFriend(friend.id)}
              style={styles.friend}>
              <Avatar person={friend} size={46} selected={isSelected} />
              <Muted style={styles.friendName}>{friend.name.split(' ')[0]}</Muted>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={count === 0 || busy}
        onPress={submit}
        style={({ pressed }) => [
          styles.cta,
          {
            backgroundColor: colors.accent,
            opacity: count === 0 || busy ? 0.4 : pressed ? 0.85 : 1,
          },
        ]}>
        <Text style={[styles.ctaText, { color: colors.onAccent }]}>
          {busy ? 'Skapar utmaningen …' : ctaLabel}
        </Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kinds: {
    gap: Spacing.two,
  },
  kindCard: {
    flexDirection: 'row',
    gap: Spacing.two + 4,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  kindText: {
    flex: 1,
    gap: 2,
  },
  kindTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  kindDescription: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  journeyCard: {
    gap: Spacing.one,
  },
  journeyHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: Spacing.two,
  },
  journeyFilm: {
    fontSize: 11,
  },
  journeyMeta: {
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  noFriends: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
  },
  noFriendsText: {
    fontSize: 13,
  },
  noFriendsButton: {
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  noFriendsButtonText: {
    fontSize: 13,
    fontWeight: '800',
  },
  friends: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  friend: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  friendName: {
    fontSize: 11,
    fontWeight: '600',
  },
  cta: {
    borderRadius: Radius.button,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '800',
  },
});
