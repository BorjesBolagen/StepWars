import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type Props = {
  /** 0–1 */
  progress: number;
  /** 'accent' = din bana (ledorange), 'primary' = motståndarens (gran). */
  tone?: 'accent' | 'primary';
};

export function ProgressBar({ progress, tone = 'accent' }: Props) {
  const colors = useTheme();
  const clamped = Math.min(Math.max(progress, 0), 1);
  return (
    <View style={[styles.track, { backgroundColor: colors.track }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${clamped * 100}%`,
            backgroundColor: tone === 'accent' ? colors.accent : colors.primary,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
});
