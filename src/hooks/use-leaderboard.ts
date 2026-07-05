import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/context/auth';
import { localDateString } from '@/lib/format';
import { leaderboards as mockLeaderboards, me as mockMe, type LeaderboardEntry } from '@/lib/mock';
import { ageGroupOf, toPerson } from '@/lib/people';
import { supabase } from '@/lib/supabase';

export type Scope = 'alla' | 'aldersgrupp' | 'vanner';

function currentWeekStart(): string {
  const now = new Date();
  const monday = new Date(now);
  // getDay(): söndag = 0 — veckan börjar på måndag.
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  return localDateString(monday);
}

/**
 * Veckans topplista. Inloggad läser Alla/åldersgrupp ur vyn
 * leaderboard_weekly (aggregerad, flaggade dagar exkluderade) och Vänner
 * ur vännernas daily_steps (RLS släpper igenom accepterade vänner).
 * Demoläget kör mockdata.
 */
export function useLeaderboard(scope: Scope) {
  const { configured, session, profile } = useAuth();
  const live = configured && session != null;

  const [entries, setEntries] = useState<LeaderboardEntry[]>(mockLeaderboards[scope]);
  const [loading, setLoading] = useState(live);

  const myId = live ? session.user.id : mockMe.id;
  const myAgeGroup = profile ? ageGroupOf(profile.birth_year) : null;

  const load = useCallback(async () => {
    if (!supabase || !session) {
      setEntries(mockLeaderboards[scope]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const uid = session.user.id;
    const weekStart = currentWeekStart();

    if (scope === 'vanner') {
      const { data: friendships } = await supabase
        .from('friendships')
        .select('requester, addressee')
        .eq('status', 'accepted')
        .or(`requester.eq.${uid},addressee.eq.${uid}`);

      const ids = new Set<string>([uid]);
      friendships?.forEach((row) => {
        ids.add(row.requester as string);
        ids.add(row.addressee as string);
      });
      if (ids.size === 1) {
        // Inga vänner ännu — skärmen visar sitt tomma tillstånd.
        setEntries([]);
        setLoading(false);
        return;
      }

      const idList = [...ids];
      const [{ data: stepRows }, { data: profiles }] = await Promise.all([
        supabase
          .from('daily_steps')
          .select('user_id, steps')
          .gte('day', weekStart)
          .eq('flagged', false)
          .in('user_id', idList),
        supabase.from('profiles').select('id, display_name').in('id', idList),
      ]);

      const totals = new Map<string, { total: number; days: number }>();
      stepRows?.forEach((row) => {
        const entry = totals.get(row.user_id as string) ?? { total: 0, days: 0 };
        entry.total += row.steps as number;
        entry.days += 1;
        totals.set(row.user_id as string, entry);
      });

      const result = (profiles ?? [])
        .map((person, index) => {
          const sums = totals.get(person.id as string) ?? { total: 0, days: 0 };
          return {
            person: toPerson(person.id as string, person.display_name as string, index, person.id === uid),
            steps: sums.total,
            avgPerDay: sums.days > 0 ? Math.round(sums.total / sums.days) : 0,
          };
        })
        .sort((a, b) => b.steps - a.steps);
      setEntries(result);
      setLoading(false);
      return;
    }

    let query = supabase
      .from('leaderboard_weekly')
      .select('user_id, display_name, age_group, total_steps, avg_steps_per_day')
      .eq('week_start', weekStart)
      .order('total_steps', { ascending: false })
      .limit(50);
    if (scope === 'aldersgrupp' && myAgeGroup) {
      query = query.eq('age_group', myAgeGroup);
    }
    const { data, error } = await query;
    if (!error && data) {
      setEntries(
        data.map((row, index) => ({
          person: toPerson(row.user_id as string, row.display_name as string, index, row.user_id === uid),
          steps: Number(row.total_steps),
          avgPerDay: Number(row.avg_steps_per_day),
        })),
      );
    }
    setLoading(false);
  }, [scope, session, myAgeGroup]);

  useEffect(() => {
    load();
  }, [load]);

  return { entries, loading, live, myId, myAgeGroup, refresh: load };
}
