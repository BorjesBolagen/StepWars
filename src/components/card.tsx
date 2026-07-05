import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = PropsWithChildren<{
  style?: ViewStyle;
  /** Markerar kortet med accentfärg — används för "din" rad och valda kort. */
  highlighted?: boolean;
}>;

export function Card({ children, style, highlighted = false }: Props) {
  const colors = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        highlighted && { backgroundColor: colors.accentSoft, borderColor: colors.accent },
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth * 2,
    padding: Spacing.three,
  },
});
