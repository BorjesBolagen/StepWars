/** Tunt mellanslag som tusentalsavgränsare — svensk sifferstil, t.ex. "8 432". */
const THIN_SPACE = ' ';

export function formatSteps(steps: number): string {
  return Math.round(steps)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, THIN_SPACE);
}

export function formatKm(km: number): string {
  return km.toFixed(1).replace('.', ',');
}

/** Lokalt datum som 'ÅÅÅÅ-MM-DD' — dagsgränsen går vid användarens midnatt. */
export function localDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
