import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { Palette } from '@/constants/theme';
import type { Person } from '@/lib/mock';

const HUES: Record<Person['hue'], string> = {
  gran: Palette.gran,
  ledorange: Palette.ledorange,
  mossa: Palette.mossa,
};

type Props = {
  person: Person;
  size?: number;
  selected?: boolean;
  style?: ViewStyle;
};

export function Avatar({ person, size = 32, selected = false, style }: Props) {
  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: HUES[person.hue],
        },
        selected && { borderWidth: 2.5, borderColor: Palette.ledorange },
        style,
      ]}>
      <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{person.initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
