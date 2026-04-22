import { Redirect, Tabs } from 'expo-router';
import { type ReactElement } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { FloatingTabBar } from '@/components/floating-tab-bar';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout(): ReactElement {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== 'light';
  const bgColor = isDark ? Colors.dark.background : Colors.light.background;

  const { session, isLoading } = useAuth();

  // Still loading session from AsyncStorage — show blank screen
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0B0D12', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#F5C451" />
      </View>
    );
  }

  // Not authenticated → redirect to login
  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'dark'].accent,
        headerShown: false,
        sceneStyle: { backgroundColor: bgColor },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={22} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={22} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
