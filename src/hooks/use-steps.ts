import { Pedometer } from 'expo-sensors';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { useAuth } from '@/context/auth';
import { localDateString } from '@/lib/format';
import { today as mockToday } from '@/lib/mock';
import { supabase } from '@/lib/supabase';

type DayRow = { day: string; steps: number };
type StepSource = 'pedometer' | 'health_connect';

function startOfDaysAgo(daysAgo: number): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

/** iOS: telefonens stegräknare (CoreMotion) — fungerar även i Expo Go. */
async function readPedometerSteps(): Promise<DayRow[] | null> {
  try {
    if (!(await Pedometer.isAvailableAsync())) return null;
    const permission = await Pedometer.requestPermissionsAsync();
    if (!permission.granted) return null;

    const rows: DayRow[] = [];
    for (let daysAgo = 0; daysAgo <= 6; daysAgo++) {
      const dayStart = startOfDaysAgo(daysAgo);
      const dayEnd = daysAgo === 0 ? new Date() : new Date(dayStart.getTime() + 86399999);
      try {
        const result = await Pedometer.getStepCountAsync(dayStart, dayEnd);
        rows.push({ day: localDateString(dayStart), steps: result.steps });
      } catch {
        break; // historik saknas längre bak — ta det vi fick
      }
    }
    return rows.length > 0 ? rows : null;
  } catch {
    return null;
  }
}

/**
 * Android: Health Connect — samlar steg från alla appar och klockor.
 * Kräver ett utvecklingsbygge (EAS); i Expo Go saknas den nativa modulen
 * och funktionen svarar null så att mockvärdet står kvar.
 */
async function readHealthConnectSteps(): Promise<DayRow[] | null> {
  try {
    const hc = await import('react-native-health-connect');
    const available = await hc.initialize();
    if (!available) return null;

    const granted = await hc.requestPermission([{ accessType: 'read', recordType: 'Steps' }]);
    if (!granted || granted.length === 0) return null;

    const rows: DayRow[] = [];
    for (let daysAgo = 0; daysAgo <= 6; daysAgo++) {
      const dayStart = startOfDaysAgo(daysAgo);
      const dayEnd = daysAgo === 0 ? new Date() : new Date(dayStart.getTime() + 86399999);
      const result = await hc.aggregateRecord({
        recordType: 'Steps',
        timeRangeFilter: {
          operator: 'between',
          startTime: dayStart.toISOString(),
          endTime: dayEnd.toISOString(),
        },
      });
      rows.push({ day: localDateString(dayStart), steps: result.COUNT_TOTAL ?? 0 });
    }
    return rows;
  } catch {
    return null;
  }
}

/**
 * Dagens steg + synk. Läser telefonens hälsodata (Health Connect på
 * Android, stegräknaren på iOS), synkar senaste sju dagarna till Supabase
 * och faller tillbaka på mockvärdet där ingen källa finns (web, simulator,
 * Expo Go på Android, nekad behörighet).
 */
export function useSteps() {
  const { session } = useAuth();
  const [steps, setSteps] = useState(mockToday.steps);
  const [isLive, setIsLive] = useState(false);

  const refresh = useCallback(async () => {
    if (Platform.OS === 'web') return;

    let rows: DayRow[] | null = null;
    let source: StepSource = 'pedometer';
    if (Platform.OS === 'android') {
      rows = await readHealthConnectSteps();
      source = 'health_connect';
    } else {
      rows = await readPedometerSteps();
    }
    if (!rows || rows.length === 0) return;

    setSteps(rows[0].steps);
    setIsLive(true);

    if (supabase && session) {
      await supabase.from('daily_steps').upsert(
        rows.map((row) => ({
          user_id: session.user.id,
          day: row.day,
          steps: row.steps,
          source,
        })),
      );
    }
  }, [session]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { steps, isLive, refresh };
}
