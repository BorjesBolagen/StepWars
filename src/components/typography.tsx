import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Skärmrubrik — vikt 800 i gran, som i designkonceptet. */
export function Title(props: TextProps) {
  const colors = useTheme();
  return <Text {...props} style={[styles.title, { color: colors.primary }, props.style]} />;
}

/** Liten versal etikett ovanför rubriker och sektioner. */
export function Eyebrow(props: TextProps) {
  const colors = useTheme();
  return <Text {...props} style={[styles.eyebrow, { color: colors.textSecondary }, props.style]} />;
}

/** Sekundär brödtext. */
export function Muted(props: TextProps) {
  const colors = useTheme();
  return <Text {...props} style={[styles.muted, { color: colors.textSecondary }, props.style]} />;
}

/** Stegtal — alltid tabulära siffror så kolumner står still. */
export function Num(props: TextProps) {
  const colors = useTheme();
  return <Text {...props} style={[styles.num, { color: colors.text }, props.style]} />;
}

const styles = StyleSheet.create({
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
    fontFamily: Fonts?.rounded,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  muted: {
    fontSize: 13,
  },
  num: {
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
  },
});
