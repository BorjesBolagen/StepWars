import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/context/auth';
import { supabase } from '@/lib/supabase';

export type FriendProfile = { id: string; display_name: string };

type FriendshipRow = {
  requester: string;
  addressee: string;
  status: string;
  requester_profile: FriendProfile | null;
  addressee_profile: FriendProfile | null;
};

/**
 * Vänskaper: accepterade vänner, inkommande och skickade förfrågningar,
 * plus sök bland alla profiler. I demoläge är listorna tomma — skärmarna
 * som visar vänner har egna mock-fallbacks.
 */
export function useFriends() {
  const { configured, session } = useAuth();
  const live = configured && session != null;

  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [incoming, setIncoming] = useState<FriendProfile[]>([]);
  const [outgoing, setOutgoing] = useState<FriendProfile[]>([]);
  const [loading, setLoading] = useState(live);

  const refresh = useCallback(async () => {
    if (!supabase || !session) {
      setLoading(false);
      return;
    }
    const uid = session.user.id;
    const { data, error } = await supabase
      .from('friendships')
      .select(
        'requester, addressee, status, ' +
          'requester_profile:profiles!friendships_requester_fkey (id, display_name), ' +
          'addressee_profile:profiles!friendships_addressee_fkey (id, display_name)',
      )
      .or(`requester.eq.${uid},addressee.eq.${uid}`)
      .in('status', ['pending', 'accepted']);

    if (!error && data) {
      const nextFriends: FriendProfile[] = [];
      const nextIncoming: FriendProfile[] = [];
      const nextOutgoing: FriendProfile[] = [];
      for (const row of data as unknown as FriendshipRow[]) {
        const other = row.requester === uid ? row.addressee_profile : row.requester_profile;
        if (!other) continue;
        if (row.status === 'accepted') nextFriends.push(other);
        else if (row.addressee === uid) nextIncoming.push(other);
        else nextOutgoing.push(other);
      }
      setFriends(nextFriends);
      setIncoming(nextIncoming);
      setOutgoing(nextOutgoing);
    }
    setLoading(false);
  }, [session]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const respond = useCallback(
    async (requesterId: string, accept: boolean) => {
      if (!supabase || !session) return;
      await supabase
        .from('friendships')
        .update({ status: accept ? 'accepted' : 'declined', responded_at: new Date().toISOString() })
        .eq('requester', requesterId)
        .eq('addressee', session.user.id);
      await refresh();
    },
    [session, refresh],
  );

  const sendRequest = useCallback(
    async (profileId: string): Promise<string | null> => {
      if (!supabase || !session) return 'Inte inloggad.';
      // Har personen redan frågat dig? Då är ett "lägg till" ett ja.
      if (incoming.some((p) => p.id === profileId)) {
        await respond(profileId, true);
        return null;
      }
      const { error } = await supabase
        .from('friendships')
        .insert({ requester: session.user.id, addressee: profileId });
      if (error) {
        if (error.code === '23505') return 'Det finns redan en förfrågan mellan er.';
        return error.message;
      }
      await refresh();
      return null;
    },
    [session, incoming, respond, refresh],
  );

  const search = useCallback(
    async (query: string): Promise<FriendProfile[]> => {
      if (!supabase || !session || query.trim().length < 2) return [];
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name')
        .ilike('display_name', `%${query.trim()}%`)
        .neq('id', session.user.id)
        .limit(10);
      return (data ?? []) as FriendProfile[];
    },
    [session],
  );

  return { live, loading, friends, incoming, outgoing, refresh, sendRequest, respond, search };
}
