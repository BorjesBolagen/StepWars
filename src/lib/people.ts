import type { Person } from '@/lib/mock';

/** "Anna Lindqvist" → "AL" */
export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const HUES: Person['hue'][] = ['gran', 'mossa'];

/** Växlande avatarfärg för andra personer — du själv är alltid ledorange. */
export function hueFor(index: number): Person['hue'] {
  return HUES[index % HUES.length];
}

/** Samma åldersgruppsindelning som databasens age_group()-funktion. */
export function ageGroupOf(birthYear: number): string {
  const age = new Date().getFullYear() - birthYear;
  if (age < 18) return 'Under 18';
  if (age < 25) return '18–24';
  if (age < 35) return '25–34';
  if (age < 45) return '35–44';
  if (age < 55) return '45–54';
  if (age < 65) return '55–64';
  return '65+';
}

/** "35–44" → "35–44 år", men "Under 18" och "65+" lämnas som de är. */
export function ageGroupLabel(group: string): string {
  return group.includes('–') ? `${group} år` : group;
}

export function toPerson(id: string, name: string, index: number, isMe = false): Person {
  return {
    id,
    name: isMe ? 'Du' : name,
    initials: initialsOf(name),
    hue: isMe ? 'ledorange' : hueFor(index),
  };
}
