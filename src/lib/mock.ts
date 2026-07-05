/**
 * Mockdata som driver skärmarna tills Supabase och steghämtning
 * (HealthKit / Health Connect) är inkopplade. Datat speglar designkonceptet.
 */

export type Person = {
  id: string;
  name: string;
  initials: string;
  /** Nyckel till avatarfärgen — varierar färgen i listor. */
  hue: 'gran' | 'ledorange' | 'mossa';
};

export type LeaderboardEntry = {
  person: Person;
  steps: number;
  avgPerDay: number;
};

export type ChallengeKind = 'most_steps' | 'first_to_goal' | 'daily_goal_streak' | 'journey';

export type Challenge = {
  id: string;
  kind: ChallengeKind;
  title: string;
  tag: string;
  goalSteps?: number;
  /** Sätt för kind 'journey' — pekar på en filmvandring i src/lib/journeys.ts. */
  journeyId?: string;
  daysElapsed: number;
  daysLeft?: number;
  standings: { person: Person; steps: number }[];
};

export const me: Person = { id: 'me', name: 'Du', initials: 'JB', hue: 'ledorange' };

export const friends: Person[] = [
  { id: 'erik', name: 'Erik Sundin', initials: 'ES', hue: 'gran' },
  { id: 'anna', name: 'Anna Lindqvist', initials: 'AL', hue: 'mossa' },
  { id: 'maria', name: 'Maria Kask', initials: 'MK', hue: 'mossa' },
  { id: 'jonas', name: 'Jonas Ahl', initials: 'JA', hue: 'gran' },
];

export const today = {
  steps: 8432,
  goal: 10000,
  distanceKm: 6.4,
  activeMinutes: 74,
  streakDays: 12,
};

const [erik, anna, maria, jonas] = friends;

export const leaderboards: Record<'alla' | 'aldersgrupp' | 'vanner', LeaderboardEntry[]> = {
  vanner: [
    { person: anna, steps: 71204, avgPerDay: 10172 },
    { person: me, steps: 68911, avgPerDay: 9844 },
    { person: erik, steps: 64380, avgPerDay: 9197 },
    { person: maria, steps: 58002, avgPerDay: 8286 },
    { person: jonas, steps: 51776, avgPerDay: 7397 },
  ],
  aldersgrupp: [
    { person: { id: 'p1', name: 'Sara Ek', initials: 'SE', hue: 'mossa' }, steps: 84210, avgPerDay: 12030 },
    { person: anna, steps: 71204, avgPerDay: 10172 },
    { person: me, steps: 68911, avgPerDay: 9844 },
    { person: { id: 'p2', name: 'Peter Holm', initials: 'PH', hue: 'gran' }, steps: 66450, avgPerDay: 9493 },
    { person: erik, steps: 64380, avgPerDay: 9197 },
  ],
  alla: [
    { person: { id: 'p3', name: 'Lina Berg', initials: 'LB', hue: 'gran' }, steps: 96102, avgPerDay: 13729 },
    { person: { id: 'p1', name: 'Sara Ek', initials: 'SE', hue: 'mossa' }, steps: 84210, avgPerDay: 12030 },
    { person: { id: 'p4', name: 'Omar Said', initials: 'OS', hue: 'mossa' }, steps: 79544, avgPerDay: 11363 },
    { person: anna, steps: 71204, avgPerDay: 10172 },
    { person: me, steps: 68911, avgPerDay: 9844 },
  ],
};

export const challenges: Challenge[] = [
  {
    id: 'mordor',
    kind: 'journey',
    title: 'Vägen till Mordor',
    tag: 'Filmvandring',
    goalSteps: 3722000,
    journeyId: 'mordor',
    daysElapsed: 31,
    standings: [
      { person: anna, steps: 305412 },
      { person: me, steps: 291208 },
      { person: erik, steps: 262019 },
    ],
  },
  {
    id: 'duel-erik',
    kind: 'first_to_goal',
    title: 'Du mot Erik',
    tag: 'Först till 100 000',
    goalSteps: 100000,
    daysElapsed: 7,
    standings: [
      { person: me, steps: 68911 },
      { person: erik, steps: 64380 },
    ],
  },
  {
    id: 'vannerligan-v27',
    kind: 'most_steps',
    title: 'Vännerligan · vecka 27',
    tag: 'Flest steg',
    daysElapsed: 4,
    daysLeft: 3,
    standings: leaderboards.vanner.map(({ person, steps }) => ({ person, steps })),
  },
];

export const challengeKinds: { kind: ChallengeKind; title: string; description: string }[] = [
  {
    kind: 'most_steps',
    title: 'Flest steg',
    description: 'Samla flest steg under en vald period — helg, vecka eller månad.',
  },
  {
    kind: 'first_to_goal',
    title: 'Först till målet',
    description: 'Första person att nå t.ex. 100 000 steg vinner.',
  },
  {
    kind: 'daily_goal_streak',
    title: 'Dagligt mål',
    description: 'Klara 8 000 steg om dagen — längsta sviten vinner.',
  },
  {
    kind: 'journey',
    title: 'Filmvandring',
    description: 'Gå en berömd filmpromenad — först till slutet vinner, delmål på vägen.',
  },
];
