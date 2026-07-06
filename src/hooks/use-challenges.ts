import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/context/auth';
import { formatSteps, localDateString } from '@/lib/format';
import { getJourney } from '@/lib/journeys';
import { challenges as mockChallenges, type Challenge, type ChallengeKind } from '@/lib/mock';
import { toPerson } from '@/lib/people';
import { supabase } from '@/lib/supabase';

export type LiveChallenge = Challenge & {
  myStatus: 'invited' | 'accepted';
  finished: boolean;
  winnerId?: string;
};

type ChallengeRow = {
  id: string;
  kind: ChallengeKind;
  title: string;
  goal_steps: number | null;
  journey_id: string | null;
  starts_on: string;
  ends_on: string | null;
  status: string;
  winner: string | null;
};

function tagFor(row: ChallengeRow): string {
  switch (row.kind) {
    case 'first_to_goal':
      return `Först till ${formatSteps(row.goal_steps ?? 0)}`;
    case 'daily_goal_streak':
      return `Dagligt mål ${formatSteps(row.goal_steps ?? 0)}`;
    case 'journey':
      return 'Filmvandring';
    default:
      return 'Flest steg';
  }
}

function daysBetween(fromIso: string, to: Date): number {
  const from = new Date(`${fromIso}T00:00:00`);
  return Math.floor((to.getTime() - from.getTime()) / 86400000);
}

/**
 * Mina utmaningar. Inloggad: läses ur databasen och ställningen räknas på
 * deltagarnas synkade steg inom utmaningens period (dagligt mål räknar
 * klarade dagar i stället för stegsumma). Demoläge: mockutmaningarna.
 */
export function useChallenges() {
  const { configured, session } = useAuth();
  const live = configured && session != null;

  const [challenges, setChallenges] = useState<LiveChallenge[]>(
    mockChallenges.map((challenge) => ({ ...challenge, myStatus: 'accepted', finished: false })),
  );
  const [loading, setLoading] = useState(live);

  const refresh = useCallback(async () => {
    if (!supabase || !session) {
      setLoading(false);
      return;
    }
    const uid = session.user.id;

    const { data: myRows } = await supabase
      .from('challenge_participants')
      .select('challenge_id, status')
      .eq('user_id', uid)
      .in('status', ['invited', 'accepted']);
    if (!myRows || myRows.length === 0) {
      setChallenges([]);
      setLoading(false);
      return;
    }
    const myStatusById = new Map(myRows.map((row) => [row.challenge_id as string, row.status]));
    const challengeIds = [...myStatusById.keys()];

    const [{ data: rows }, { data: participants }] = await Promise.all([
      supabase
        .from('challenges')
        .select('id, kind, title, goal_steps, journey_id, starts_on, ends_on, status, winner')
        .in('id', challengeIds)
        .in('status', ['active', 'finished'])
        .order('created_at', { ascending: false }),
      supabase
        .from('challenge_participants')
        .select('challenge_id, user_id, status, profile:profiles (id, display_name)')
        .in('challenge_id', challengeIds)
        .neq('status', 'declined'),
    ]);
    if (!rows || rows.length === 0) {
      setChallenges([]);
      setLoading(false);
      return;
    }

    const userIds = [...new Set((participants ?? []).map((p) => p.user_id as string))];
    const earliestStart = rows.map((r) => r.starts_on as string).sort()[0];
    const { data: stepRows } = await supabase
      .from('daily_steps')
      .select('user_id, day, steps')
      .in('user_id', userIds)
      .gte('day', earliestStart)
      .eq('flagged', false);

    const today = new Date();
    const result: LiveChallenge[] = (rows as unknown as ChallengeRow[]).map((row) => {
      const members = (participants ?? []).filter((p) => p.challenge_id === row.id);
      const standings = members
        .map((member, index) => {
          const uidOf = member.user_id as string;
          const profile = member.profile as unknown as { display_name: string } | null;
          const daysInRange = (stepRows ?? []).filter(
            (s) =>
              s.user_id === uidOf &&
              (s.day as string) >= row.starts_on &&
              (row.ends_on == null || (s.day as string) <= row.ends_on),
          );
          // Dagligt mål tävlar i klarade dagar, övriga i stegsumma.
          const value =
            row.kind === 'daily_goal_streak'
              ? daysInRange.filter((s) => (s.steps as number) >= (row.goal_steps ?? 0)).length
              : daysInRange.reduce((sum, s) => sum + (s.steps as number), 0);
          return {
            person: toPerson(uidOf, profile?.display_name ?? 'Okänd', index, uidOf === uid),
            steps: value,
          };
        })
        .sort((a, b) => b.steps - a.steps);

      return {
        id: row.id,
        kind: row.kind,
        title: row.title,
        tag: tagFor(row),
        goalSteps: row.goal_steps ?? undefined,
        journeyId: row.journey_id ?? undefined,
        daysElapsed: Math.max(daysBetween(row.starts_on, today) + 1, 1),
        daysLeft:
          row.ends_on != null
            ? Math.max(-daysBetween(row.ends_on, today), 0)
            : undefined,
        standings,
        myStatus: myStatusById.get(row.id) as 'invited' | 'accepted',
        finished: row.status === 'finished',
        winnerId: row.winner ?? undefined,
      };
    });

    setChallenges(result);
    setLoading(false);
  }, [session]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(
    async (
      kind: ChallengeKind,
      friendIds: string[],
      journeyId?: string,
    ): Promise<{ id?: string; error?: string }> => {
      if (!supabase || !session) return { error: 'Logga in för att skapa utmaningar på riktigt.' };

      const startsOn = localDateString();
      let title = 'Flest steg på en vecka';
      let goalSteps: number | null = null;
      let endsOn: string | null = null;

      if (kind === 'most_steps') {
        const end = new Date();
        end.setDate(end.getDate() + 6);
        endsOn = localDateString(end);
      } else if (kind === 'first_to_goal') {
        goalSteps = 100000;
        title = 'Först till 100 000';
      } else if (kind === 'daily_goal_streak') {
        goalSteps = 8000;
        title = 'Dagligt mål 8 000';
        const end = new Date();
        end.setDate(end.getDate() + 13);
        endsOn = localDateString(end);
      } else if (kind === 'journey') {
        const journey = journeyId ? getJourney(journeyId) : undefined;
        if (!journey) return { error: 'Välj en vandring först.' };
        goalSteps = journey.totalSteps;
        title = journey.title;
      }

      const { data: created, error } = await supabase
        .from('challenges')
        .insert({
          creator: session.user.id,
          kind,
          title,
          goal_steps: goalSteps,
          starts_on: startsOn,
          ends_on: endsOn,
          journey_id: kind === 'journey' ? journeyId : null,
        })
        .select('id')
        .single();
      if (error || !created) return { error: error?.message ?? 'Kunde inte skapa utmaningen.' };

      const { error: participantError } = await supabase.from('challenge_participants').insert([
        { challenge_id: created.id, user_id: session.user.id, status: 'accepted' },
        ...friendIds.map((friendId) => ({
          challenge_id: created.id,
          user_id: friendId,
          status: 'invited',
        })),
      ]);
      if (participantError) return { error: participantError.message };

      await refresh();
      return { id: created.id as string };
    },
    [session, refresh],
  );

  const respond = useCallback(
    async (challengeId: string, accept: boolean) => {
      if (!supabase || !session) return;
      await supabase
        .from('challenge_participants')
        .update({ status: accept ? 'accepted' : 'declined', responded_at: new Date().toISOString() })
        .eq('challenge_id', challengeId)
        .eq('user_id', session.user.id);
      await refresh();
    },
    [session, refresh],
  );

  return { live, loading, challenges, refresh, create, respond };
}
