import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { useAuth } from '@/contexts/auth-context';

/**
 * Redirects the user away from admin-only screens when they are not an admin.
 * Returns `isAdmin` so callers can also gate rendering.
 */
export function useAdminGuard(): { isAdmin: boolean; isLoading: boolean } {
  const { isAdmin, isLoading, session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!session) {
      router.replace('/(auth)/login');
      return;
    }
    if (!isAdmin) {
      router.replace('/(tabs)');
    }
  }, [isAdmin, isLoading, session, router]);

  return { isAdmin, isLoading };
}
