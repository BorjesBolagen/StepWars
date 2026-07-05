import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/context/auth';
import { localDateString } from '@/lib/format';
import { leaderboards as mockLeaderboards, me as mockMe, type LeaderboardEntry } from '@/lib/mock';
import { supabase } from '@/lib/supabase';

export type Scope = 'alla' | 'aldersgrupp' | 'vanner';

function currentWeekStart(): string {
  const now = new Date();
  const monday = new Date(now);
  // getDay(): söndag = 0 — veckan börjar på måndag.
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  return localDateString(monday);
}

function ageGroupOf(birthYear: number): string {
  const age = new Date().getFullYear() - birthYear;
  if (age < 18) return 'Under 18';
  if (age < 25) return '18–24';
  if (age < 35) return '25–34';
  if (age < 45) return '35–44';
  if (age < 55) return '45–54';
  if (age < 65) return '55–64';
  return '65+';
}

const HUES = ['gran', 'mossa'] as const;

/**
 * Veckans topplista. Inloggad läser vyn leaderboard_weekly (aggregerad,
 * flaggade dagar exkluderade); demoläget kör mockdata. Vänner-läget är
 * tomt tills vänsystemet byggs — vyn signalerar det via `isEmpty`.
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
    if (scope === 'vanner') {
      // Vänsystemet är inte byggt ännu — visa tomt tillstånd i stället
      // för att låtsas ha data.
      setEntries([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let query = supabase
      .from('leaderboard_weekly')
      .select('user_id, display_name, age_group, total_steps, avg_steps_per_day')
      .eq('week_start', currentWeekStart())
      .order('total_steps', { ascending: false })
      .limit(50);
    if (scope === 'aldersgrupp' && myAgeGroup) {
      query = query.eq('age_group', myAgeGroup);
    }
    const { data, error } = await query;
    if (!error && data) {
      setEntries(
        data.map((row, index) => ({
          person: {
            id: row.user_id as string,
            name: row.user_id === session.user.id ? 'Du' : (row.display_name as string),
            initials: (row.display_name as string)
              .split(/\s+/)
              .map((part: string) => part[0])
              .filter(Boolean)
              .slice(0, 2)
              .join('')
              .toUpperCase(),
            hue: row.user_id === session.user.id ? 'ledorange' : HUES[index % HUES.length],
          },
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
