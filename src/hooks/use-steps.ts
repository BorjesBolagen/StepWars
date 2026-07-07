import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { useAuth } from '@/context/auth';
import { today as mockToday } from '@/lib/mock';
import { readDeviceSteps, uploadSteps } from '@/lib/step-sync';

/**
 * Dagens steg + synk. Läser telefonens hälsodata (Health Connect på
 * Android, stegräknaren på iOS), synkar senaste sju dagarna till Supabase
 * och faller tillbaka på mockvärdet där ingen källa finns (web, simulator,
 * Expo Go på Android, nekad behörighet). Bakgrundssynken i
 * lib/background-sync håller datat färskt mellan appöppningar.
 */
export function useSteps() {
  const { session } = useAuth();
  const [steps, setSteps] = useState(mockToday.steps);
  const [isLive, setIsLive] = useState(false);

  const refresh = useCallback(async () => {
    if (Platform.OS === 'web') return;
    const reading = await readDeviceSteps();
    if (!reading || reading.rows.length === 0) return;

    setSteps(reading.rows[0].steps);
    setIsLive(true);

    if (session) {
      await uploadSteps(session.user.id, reading.rows, reading.source);
    }
  }, [session]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { steps, isLive, refresh };
}
