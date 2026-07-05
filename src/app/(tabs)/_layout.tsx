import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type IoniconName = keyof typeof Ionicons.glyphMap;

function tabIcon(active: IoniconName, inactive: IoniconName) {
  return ({ color, focused }: { color: ColorValue; focused: boolean }) => (
    <Ionicons name={focused ? active : inactive} size={22} color={color} />
  );
}

export default function TabLayout() {
  const colors = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Idag', tabBarIcon: tabIcon('home', 'home-outline') }}
      />
      <Tabs.Screen
        name="tavla"
        options={{ title: 'Tävla', tabBarIcon: tabIcon('trophy', 'trophy-outline') }}
      />
      <Tabs.Screen
        name="utmana"
        options={{ title: 'Utmana', tabBarIcon: tabIcon('flash', 'flash-outline') }}
      />
      <Tabs.Screen
        name="profil"
        options={{ title: 'Profil', tabBarIcon: tabIcon('person', 'person-outline') }}
      />
    </Tabs>
  );
}
