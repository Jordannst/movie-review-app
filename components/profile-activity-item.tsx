import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { type ReactElement } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { MotionPressable } from '@/components/motion-pressable';
import { RatingStars } from '@/components/rating-stars';
import { ThemedText } from '@/components/themed-text';
import { Movie } from '@/data/types';
import { useThemeColor } from '@/hooks/use-theme-color';

type ProfileActivity = {
  id: string;
  type: 'reviewed' | 'rated' | 'watchlisted';
  movieId: Movie['id'];
  title: string;
  detail: string;
  timestampLabel: string;
  rating?: number;
};

type ProfileActivityItemProps = {
  activity: ProfileActivity;
  movie: Movie;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

function getActivityMeta(activityType: ProfileActivity['type']): {
  iconName: keyof typeof MaterialIcons.glyphMap;
  label: string;
} {
  if (activityType === 'reviewed') {
    return {
      iconName: 'rate-review',
      label: 'Reviewed',
    };
  }

  if (activityType === 'watchlisted') {
    return {
      iconName: 'bookmark',
      label: 'Watchlist',
    };
  }

  return {
    iconName: 'star',
    label: 'Rated',
  };
}

export function ProfileActivityItem({ activity, movie, onPress, style }: ProfileActivityItemProps): ReactElement {
  const surface = useThemeColor({}, 'surface');
  const surfaceMuted = useThemeColor({}, 'surfaceMuted');
  const border = useThemeColor({}, 'border');
  const textMuted = useThemeColor({}, 'textMuted');
  const accent = useThemeColor({}, 'accent');
  const { iconName, label } = getActivityMeta(activity.type);

  return (
    <MotionPressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      haptic={Boolean(onPress)}
      onPress={onPress}
      pressScale={0.99}
      pressedOpacity={0.96}
      style={[styles.card, { backgroundColor: surface, borderColor: border }, style]}>
      <View style={[styles.iconWrap, { backgroundColor: surfaceMuted, borderColor: border }]}>
        <MaterialIcons color={accent} name={iconName} size={20} />
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.titleGroup}>
            <ThemedText type="defaultSemiBold">{activity.title}</ThemedText>
            <ThemedText style={[styles.movieLabel, { color: textMuted }]}>
              {movie.title} • {movie.year}
            </ThemedText>
          </View>

          <View style={[styles.typeChip, { backgroundColor: surfaceMuted, borderColor: border }]}>
            <ThemedText style={[styles.typeChipText, { color: accent }]}>{label}</ThemedText>
          </View>
        </View>

        <ThemedText style={[styles.detail, { color: textMuted }]}>{activity.detail}</ThemedText>

        <View style={styles.footerRow}>
          <View style={[styles.metaChip, { backgroundColor: surfaceMuted, borderColor: border }]}>
            <ThemedText style={styles.metaChipText}>{activity.timestampLabel}</ThemedText>
          </View>

          {activity.rating !== undefined ? <RatingStars rating={activity.rating} size={14} /> : null}
        </View>
      </View>
    </MotionPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 14,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
  },
  content: {
    flex: 1,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleGroup: {
    flex: 1,
    gap: 2,
  },
  movieLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  typeChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  typeChipText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  detail: {
    fontSize: 14,
    lineHeight: 20,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  metaChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metaChipText: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '600',
  },
});
