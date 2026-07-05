import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { Eyebrow, Muted, Title } from '@/components/typography';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { challengeKinds, friends, type ChallengeKind } from '@/lib/mock';

export default function UtmanaScreen() {
  const colors = useTheme();
  const [kind, setKind] = useState<ChallengeKind>('most_steps');
  const [selected, setSelected] = useState<Set<string>>(new Set(['erik']));

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

      <Eyebrow>Utmana vem?</Eyebrow>
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
        disabled={count === 0}
        onPress={() =>
          // TODO: skapa utmaningen i Supabase när backend är inkopplad.
          Alert.alert('Snart!', 'Utmaningar kopplas till backend i nästa steg.')
        }
        style={({ pressed }) => [
          styles.cta,
          { backgroundColor: colors.accent, opacity: count === 0 ? 0.4 : pressed ? 0.85 : 1 },
        ]}>
        <Text style={[styles.ctaText, { color: colors.onAccent }]}>{ctaLabel}</Text>
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
