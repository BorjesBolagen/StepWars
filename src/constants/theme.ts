/**
 * Stegas designtokens — "granskog och ledmarkering".
 * Grundton: gran (lugn, naturlig). Signalfärg: ledorange — samma orange som
 * märker svenska vandringsleder; betyder alltid "här händer tävlingen".
 * Se designkonceptet i docs/design.md för resonemanget bakom paletten.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Palette = {
  gran: '#1E4D3B',
  granDeep: '#143528',
  ledorange: '#E8590F',
  bjork: '#F7F8F5',
  skymning: '#131D17',
  mossa: '#6B8F71',
  // Pallen — används enbart för placering 1–3 i topplistor.
  gold: '#C99A2C',
  silver: '#9AA5A0',
  bronze: '#B0713E',
} as const;

type ThemeTokens = {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  onPrimary: string;
  accent: string;
  onAccent: string;
  accentSoft: string;
  track: string;
  segment: string;
  gold: string;
  silver: string;
  bronze: string;
};

export const Colors: Record<'light' | 'dark', ThemeTokens> = {
  light: {
    background: '#F7F8F5',
    card: '#FFFFFF',
    text: '#1C2B24',
    textSecondary: '#5C6E63',
    border: '#E3E9E2',
    primary: '#1E4D3B',
    onPrimary: '#FFFFFF',
    accent: '#E8590F',
    onAccent: '#FFFFFF',
    accentSoft: '#FBE9DD',
    track: '#EBE4DB',
    segment: '#EBEFE9',
    gold: Palette.gold,
    silver: '#7E8A85',
    bronze: Palette.bronze,
  },
  dark: {
    background: '#131D17',
    card: '#1A2820',
    text: '#E8EFE9',
    textSecondary: '#9FB2A6',
    border: '#26352C',
    primary: '#5E9A7C',
    onPrimary: '#0E1613',
    accent: '#F0692B',
    onAccent: '#FFFFFF',
    accentSoft: '#3A2418',
    track: '#2A362E',
    segment: '#222F27',
    gold: '#D9AE45',
    silver: '#9AA5A0',
    bronze: '#C68550',
  },
};

export type ThemeColors = ThemeTokens;
export type ThemeColor = keyof ThemeTokens;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  card: 14,
  pill: 999,
  button: 14,
} as const;

export const MaxContentWidth = 800;
