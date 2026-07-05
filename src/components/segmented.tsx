import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

/** Segmentväljare — byter t.ex. tävlingsläge (Alla / Åldersgrupp / Vänner). */
export function Segmented<T extends string>({ options, value, onChange }: Props<T>) {
  const colors = useTheme();
  return (
    <View style={[styles.track, { backgroundColor: colors.segment }]}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.value)}
            style={[styles.segment, active && [styles.activeSegment, { backgroundColor: colors.card }]]}>
            <Text
              style={[styles.label, { color: active ? colors.primary : colors.textSecondary }]}
              numberOfLines={1}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    gap: 3,
  },
  segment: {
    flex: 1,
    borderRadius: 9,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  activeSegment: {
    shadowColor: '#143528',
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
});
