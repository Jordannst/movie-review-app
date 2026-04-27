import { Platform } from 'react-native';

const accentLight = '#B45309';
const accentDark = '#F5C451';

export const Colors = {
  light: {
    text: '#111827',
    textMuted: '#6B7280',
    background: '#F5F5F7',
    surface: '#FFFFFF',
    surfaceMuted: '#E5E7EB',
    tint: accentLight,
    accent: accentLight,
    icon: '#6B7280',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: accentLight,
    border: '#D1D5DB',
    danger: '#DC2626',
  },
  dark: {
    text: '#F5F7FA',
    textMuted: '#98A2B3',
    background: '#0B0D12',
    surface: '#141923',
    surfaceMuted: '#1C2230',
    tint: accentDark,
    accent: accentDark,
    icon: '#98A2B3',
    tabIconDefault: '#667085',
    tabIconSelected: accentDark,
    border: '#2A3142',
    danger: '#F04452',
  },
} as const;

export type ThemeName = keyof typeof Colors;
export type ThemeColorName = keyof typeof Colors.light;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
