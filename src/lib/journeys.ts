/**
 * Filmvandringar — kända promenader ur filmhistorien som utmaningsbanor.
 * Vännerna tävlar om vem som går hela sträckan först; delmålen är platserna
 * ur filmen och prickas av allteftersom stegen räknas upp.
 *
 * Stegen är estimat: sträckan i km × ~1 300 steg/km, avrundat.
 * Mordor-sträckan bygger på Tolkien-fansens klassiska beräkning att vägen
 * Fylke → Domedagsberget är 1 779 miles (≈ 2 863 km).
 */

export type Milestone = {
  name: string;
  /** Ackumulerade steg från start till detta delmål. */
  steps: number;
};

export type Journey = {
  id: string;
  title: string;
  film: string;
  description: string;
  totalSteps: number;
  milestones: Milestone[];
};

export const journeys: Journey[] = [
  {
    id: 'stand-by-me',
    title: 'Längs rälsen',
    film: 'Stand by Me (1986)',
    description: 'Pojkarnas två dagar längs järnvägen utanför Castle Rock. En lagom helgutmaning.',
    totalSteps: 52000,
    milestones: [
      { name: 'Castle Rock', steps: 0 },
      { name: 'Järnvägsbron', steps: 20000 },
      { name: 'Skogen och skroten', steps: 33000 },
      { name: 'Back Harlow Road', steps: 52000 },
    ],
  },
  {
    id: 'the-way',
    title: 'Caminon',
    film: 'The Way (2010)',
    description: 'Pilgrimsleden till Santiago de Compostela — 780 km genom norra Spanien.',
    totalSteps: 1014000,
    milestones: [
      { name: 'Saint-Jean-Pied-de-Port', steps: 0 },
      { name: 'Pamplona', steps: 88000 },
      { name: 'Burgos', steps: 367000 },
      { name: 'León', steps: 601000 },
      { name: 'Santiago de Compostela', steps: 1014000 },
    ],
  },
  {
    id: 'wild',
    title: 'Pacific Crest Trail',
    film: 'Wild (2014)',
    description: 'Cheryl Strayeds 1 770 km från Mojaveöknen till Gudarnas bro.',
    totalSteps: 2301000,
    milestones: [
      { name: 'Mojaveöknen', steps: 0 },
      { name: 'Kennedy Meadows', steps: 356000 },
      { name: 'Sierra Nevada', steps: 900000 },
      { name: 'Ashland, Oregon', steps: 1946000 },
      { name: 'Gudarnas bro', steps: 2301000 },
    ],
  },
  {
    id: 'mordor',
    title: 'Vägen till Mordor',
    film: 'Sagan om ringen',
    description:
      'Frodos hela vandring: Fylke till Domedagsberget, 1 779 miles. "One does not simply walk into Mordor" — men det är precis vad ni gör.',
    totalSteps: 3722000,
    milestones: [
      { name: 'Fylke', steps: 0 },
      { name: 'Bri och Den stegrande ponnyn', steps: 282000 },
      { name: 'Vattnadal', steps: 958000 },
      { name: 'Morias gruvor', steps: 1664000 },
      { name: 'Lothlórien', steps: 1925000 },
      { name: 'Rauros fall', steps: 2739000 },
      { name: 'Svarta porten', steps: 3349000 },
      { name: 'Domedagsberget', steps: 3722000 },
    ],
  },
  {
    id: 'forrest-gump',
    title: 'Springturnén',
    film: 'Forrest Gump (1994)',
    description:
      'Forrests tre år av löpning fram och tillbaka över USA. För de som vill ha ett mål för resten av livet.',
    totalSteps: 31900000,
    milestones: [
      { name: 'Greenbow, Alabama', steps: 0 },
      { name: 'Santa Monica-piren', steps: 4680000 },
      { name: 'Fyren i Maine', steps: 11050000 },
      { name: 'Mississippifloden (varv 3)', steps: 21000000 },
      { name: 'Monument Valley — "Jag är rätt trött"', steps: 31900000 },
    ],
  },
];

export function getJourney(id: string): Journey | undefined {
  return journeys.find((journey) => journey.id === id);
}

/** Senast passerade och nästa delmål för ett givet stegantal. */
export function journeyPosition(journey: Journey, steps: number) {
  const reached = journey.milestones.filter((m) => m.steps <= steps);
  const next = journey.milestones.find((m) => m.steps > steps);
  return { reached, next, done: !next };
}
