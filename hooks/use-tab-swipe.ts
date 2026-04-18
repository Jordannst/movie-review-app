import { useRef } from 'react';
import { PanResponder } from 'react-native';
import { usePathname, useRouter } from 'expo-router';

const SWIPE_THRESHOLD = 60;   // minimum px horizontal to qualify as a swipe
const VERTICAL_LIMIT = 50;    // if vertical move exceeds this, ignore (user is scrolling)

/**
 * Returns PanResponder handlers that enable horizontal swipe navigation
 * between the Home and Profile tabs.
 *
 * Usage: spread `...swipeHandlers` on the root View of a tab screen.
 */
export function useTabSwipe() {
  const router = useRouter();
  const pathname = usePathname();

  const panResponder = useRef(
    PanResponder.create({
      // Only become the responder if the move is clearly more horizontal than vertical
      onMoveShouldSetPanResponder: (_, { dx, dy }) =>
        Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 2,

      onPanResponderRelease: (_, { dx, dy }) => {
        // Ignore if vertical movement is too large (user was scrolling)
        if (Math.abs(dy) > VERTICAL_LIMIT) return;

        if (dx < -SWIPE_THRESHOLD) {
          // ← Swipe LEFT: advance to next tab (Home → Profile)
          if (pathname === '/') router.navigate('/profile');
        } else if (dx > SWIPE_THRESHOLD) {
          // → Swipe RIGHT: go back to previous tab (Profile → Home)
          if (pathname === '/profile') router.navigate('/');
        }
      },
    })
  ).current;

  return panResponder.panHandlers;
}
