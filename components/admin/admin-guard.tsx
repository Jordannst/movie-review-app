import { type ReactElement, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useAdminGuard } from '@/hooks/use-admin-guard';
import { useColorScheme } from '@/hooks/use-color-scheme';

/** Render `children` only when the current user is confirmed admin. */
export function AdminGuard({ children }: { children: ReactNode }): ReactElement | null {
  const { isAdmin, isLoading } = useAdminGuard();
  const colorScheme = useColorScheme();
  const accent = Colors[colorScheme ?? 'dark'].accent;

  if (isLoading || !isAdmin) {
    return (
      <View style={styles.fallback}>
        <ActivityIndicator color={accent} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B0D12',
  },
});
