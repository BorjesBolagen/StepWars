import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { syncStepsInBackground } from '@/lib/step-sync';

const TASK_NAME = 'stega-steg-synk';

// Tasken måste definieras vid modul-laddning så att den finns registrerad
// när operativsystemet väcker appen i bakgrunden.
TaskManager.defineTask(TASK_NAME, async () => {
  try {
    const synced = await syncStepsInBackground();
    return synced
      ? BackgroundTask.BackgroundTaskResult.Success
      : BackgroundTask.BackgroundTaskResult.Failed;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

/**
 * Registrerar periodisk stegsynk (~var 6:e timme; operativsystemet styr
 * exakt när). Kräver utvecklings-/produktionsbygge — i Expo Go och på
 * web gör anropet ingenting.
 */
export async function registerBackgroundSync(): Promise<void> {
  try {
    const status = await BackgroundTask.getStatusAsync();
    if (status !== BackgroundTask.BackgroundTaskStatus.Available) return;
    await BackgroundTask.registerTaskAsync(TASK_NAME, {
      minimumInterval: 60 * 6, // minuter
    });
  } catch {
    // Stöds inte i den här miljön — synk sker när appen öppnas i stället.
  }
}
