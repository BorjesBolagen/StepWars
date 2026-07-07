import { Pedometer } from 'expo-sensors';
import { Platform } from 'react-native';

import { localDateString } from '@/lib/format';
import { supabase } from '@/lib/supabase';

export type DayRow = { day: string; steps: number };
export type StepSource = 'pedometer' | 'health_connect';

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
 * och funktionen svarar null.
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

/** Läser senaste sju dagarnas steg från plattformens källa. */
export async function readDeviceSteps(): Promise<{ rows: DayRow[]; source: StepSource } | null> {
  if (Platform.OS === 'web') return null;
  if (Platform.OS === 'android') {
    const rows = await readHealthConnectSteps();
    return rows ? { rows, source: 'health_connect' } : null;
  }
  const rows = await readPedometerSteps();
  return rows ? { rows, source: 'pedometer' } : null;
}

/** Skriver upp dagarna i daily_steps för en användare. */
export async function uploadSteps(
  userId: string,
  rows: DayRow[],
  source: StepSource,
): Promise<void> {
  if (!supabase) return;
  await supabase.from('daily_steps').upsert(
    rows.map((row) => ({ user_id: userId, day: row.day, steps: row.steps, source })),
  );
}

/**
 * Hela synken i ett anrop — används av bakgrundstasken där ingen
 * React-kontext finns. Sessionen läses ur AsyncStorage via klienten.
 */
export async function syncStepsInBackground(): Promise<boolean> {
  if (!supabase) return false;
  const { data } = await supabase.auth.getSession();
  if (!data.session) return false;
  const reading = await readDeviceSteps();
  if (!reading) return false;
  await uploadSteps(data.session.user.id, reading.rows, reading.source);
  return true;
}
