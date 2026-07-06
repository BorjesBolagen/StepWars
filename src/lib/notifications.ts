import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

/**
 * Registrerar enhetens Expo-pushtoken i push_tokens så att databasens
 * triggers kan skicka notiser (utmanad, vänförfrågan, pepp, vinst).
 *
 * Allt är beskyddat med try/catch: i Expo Go på Android stöds inte
 * fjärrpush längre (kräver utvecklingsbygge) — då gör funktionen
 * ingenting och appen fungerar som vanligt.
 */
export async function registerForPush(userId: string): Promise<void> {
  if (Platform.OS === 'web' || !supabase) return;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Stega',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const projectId: string | undefined =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const token = (
      await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)
    ).data;

    await supabase.from('push_tokens').upsert({
      user_id: userId,
      token,
      updated_at: new Date().toISOString(),
    });
  } catch {
    // Push stöds inte i den här miljön — tyst nej tack.
  }
}
