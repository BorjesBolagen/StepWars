import { Pedometer } from 'expo-sensors';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { useAuth } from '@/context/auth';
import { localDateString } from '@/lib/format';
import { today as mockToday } from '@/lib/mock';
import { supabase } from '@/lib/supabase';

/**
 * Dagens steg. Läser telefonens stegräknare (CoreMotion på iOS via Expos
 * pedometer — fungerar i Expo Go) och synkar de senaste sju dagarna till
 * Supabase så topplistorna får data. Faller tillbaka på mockvärdet när
 * stegräknare saknas (web, simulator) eller behörighet nekas.
 *
 * TODO: byt källa till HealthKit/Health Connect i utvecklingsbygget —
 * pedometern når bara telefonens egna steg, inte klockor/andra appar.
 */
export function useSteps() {
  const { session } = useAuth();
  const [steps, setSteps] = useState(mockToday.steps);
  const [isLive, setIsLive] = useState(false);

  const refresh = useCallback(async () => {
    if (Platform.OS === 'web') return;
    try {
      if (!(await Pedometer.isAvailableAsync())) return;
      const permission = await Pedometer.requestPermissionsAsync();
      if (!permission.granted) return;

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const result = await Pedometer.getStepCountAsync(startOfDay, new Date());
      setSteps(result.steps);
      setIsLive(true);

      if (supabase && session) {
        // Synka dagens och de sex föregående dagarnas steg — historiken
        // gör att veckotopplistan blir rätt även för nya användare.
        const rows = [{ day: localDateString(), steps: result.steps }];
        for (let daysAgo = 1; daysAgo <= 6; daysAgo++) {
          const dayStart = new Date(startOfDay);
          dayStart.setDate(dayStart.getDate() - daysAgo);
          const dayEnd = new Date(dayStart);
          dayEnd.setHours(23, 59, 59, 999);
          try {
            const past = await Pedometer.getStepCountAsync(dayStart, dayEnd);
            rows.push({ day: localDateString(dayStart), steps: past.steps });
          } catch {
            break; // historik saknas längre bak — ta det vi fick
          }
        }
        await supabase.from('daily_steps').upsert(
          rows.map((row) => ({
            user_id: session.user.id,
            day: row.day,
            steps: row.steps,
            source: 'pedometer',
          })),
        );
      }
    } catch {
      // getStepCountAsync saknas på Android — mockvärdet står kvar tills
      // Health Connect kopplas in i utvecklingsbygget.
    }
  }, [session]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { steps, isLive, refresh };
}
