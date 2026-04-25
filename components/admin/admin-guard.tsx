import { type ReactElement, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useAdminGuard } from '@/hooks/use-admin-guard';
import { useColorScheme } from '@/hooks/use-color-scheme';

/** Render `children` only when the current user is confirmed admin. */
export function AdminGuard({ children }: { children: ReactNode }): ReactElement {
  const { isAdmin, isLoading } = useAdminGuard();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'dark'];

  if (isLoading || !isAdmin) {
    return (
      <View style={[styles.fallback, { backgroundColor: palette.background }]}>
        <ActivityIndicator color={palette.accent} />
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
  },
});
