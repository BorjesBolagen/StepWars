import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { Eyebrow, Muted } from '@/components/typography';
import { Spacing } from '@/constants/theme';
import { useFriends, type FriendProfile } from '@/hooks/use-friends';
import { useTheme } from '@/hooks/use-theme';
import { friends as mockFriends } from '@/lib/mock';
import { toPerson } from '@/lib/people';

export default function VannerScreen() {
  const colors = useTheme();
  const { live, friends, incoming, outgoing, sendRequest, respond, search } = useFriends();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FriendProfile[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const runSearch = async (text: string) => {
    setQuery(text);
    setMessage(null);
    setResults(await search(text));
  };

  const add = async (profile: FriendProfile) => {
    const error = await sendRequest(profile.id);
    setMessage(error ?? `Förfrågan skickad till ${profile.display_name.split(/\s+/)[0]}!`);
    setResults(results.filter((r) => r.id !== profile.id));
  };

  const knownIds = new Set([
    ...friends.map((f) => f.id),
    ...incoming.map((f) => f.id),
    ...outgoing.map((f) => f.id),
  ]);
  const newResults = results.filter((r) => !knownIds.has(r.id) || incoming.some((p) => p.id === r.id));

  if (!live) {
    return (
      <Screen>
        <Card style={styles.empty}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Demoläge</Text>
          <Muted style={styles.emptyText}>
            Logga in för att söka efter vänner på riktigt. Så här ser vänlistan ut:
          </Muted>
        </Card>
        <Eyebrow>Dina vänner</Eyebrow>
        {mockFriends.map((friend) => (
          <Card key={friend.id} style={styles.row}>
            <Avatar person={friend} size={38} />
            <Text style={[styles.name, { color: colors.text }]}>{friend.name}</Text>
          </Card>
        ))}
      </Screen>
    );
  }

  return (
    <Screen>
      <Eyebrow>Hitta vänner</Eyebrow>
      <TextInput
        style={[
          styles.search,
          { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
        ]}
        placeholder="Sök på namn …"
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="words"
        value={query}
        onChangeText={runSearch}
      />
      {message && <Muted style={[styles.message, { color: colors.accent }]}>{message}</Muted>}
      {newResults.map((result, index) => (
        <Card key={result.id} style={styles.row}>
          <Avatar person={toPerson(result.id, result.display_name, index)} size={38} />
          <Text style={[styles.name, { color: colors.text }]}>{result.display_name}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => add(result)}
            style={({ pressed }) => [
              styles.smallButton,
              { backgroundColor: colors.accent, opacity: pressed ? 0.8 : 1 },
            ]}>
            <Text style={[styles.smallButtonText, { color: colors.onAccent }]}>Lägg till</Text>
          </Pressable>
        </Card>
      ))}
      {query.trim().length >= 2 && newResults.length === 0 && (
        <Muted style={styles.message}>Ingen träff — be din vän skapa ett konto först.</Muted>
      )}

      {incoming.length > 0 && (
        <>
          <Eyebrow>Förfrågningar till dig</Eyebrow>
          {incoming.map((person, index) => (
            <Card key={person.id} style={styles.row} highlighted>
              <Avatar person={toPerson(person.id, person.display_name, index)} size={38} />
              <Text style={[styles.name, { color: colors.text }]}>{person.display_name}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Acceptera ${person.display_name}`}
                onPress={() => respond(person.id, true)}
                style={({ pressed }) => [
                  styles.iconButton,
                  { backgroundColor: colors.accent, opacity: pressed ? 0.8 : 1 },
                ]}>
                <Ionicons name="checkmark" size={18} color={colors.onAccent} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Tacka nej till ${person.display_name}`}
                onPress={() => respond(person.id, false)}
                style={({ pressed }) => [
                  styles.iconButton,
                  { borderWidth: 1, borderColor: colors.border, opacity: pressed ? 0.6 : 1 },
                ]}>
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </Pressable>
            </Card>
          ))}
        </>
      )}

      <Eyebrow>Dina vänner</Eyebrow>
      {friends.length === 0 ? (
        <Card style={styles.empty}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Inga vänner ännu</Text>
          <Muted style={styles.emptyText}>
            Sök på namn här ovanför — alla med ett Stega-konto går att hitta.
          </Muted>
        </Card>
      ) : (
        friends.map((person, index) => (
          <Card key={person.id} style={styles.row}>
            <Avatar person={toPerson(person.id, person.display_name, index)} size={38} />
            <Text style={[styles.name, { color: colors.text }]}>{person.display_name}</Text>
          </Card>
        ))
      )}

      {outgoing.length > 0 && (
        <>
          <Eyebrow>Skickade förfrågningar</Eyebrow>
          {outgoing.map((person, index) => (
            <Card key={person.id} style={styles.row}>
              <Avatar person={toPerson(person.id, person.display_name, index)} size={38} />
              <Text style={[styles.name, { color: colors.textSecondary }]}>
                {person.display_name}
              </Text>
              <Muted style={styles.pending}>Väntar på svar</Muted>
            </Card>
          ))}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
    fontSize: 15,
  },
  message: {
    fontSize: 13,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 4,
    paddingVertical: Spacing.two + 2,
  },
  name: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  smallButton: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  smallButtonText: {
    fontSize: 12,
    fontWeight: '800',
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pending: {
    fontSize: 12,
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
});
