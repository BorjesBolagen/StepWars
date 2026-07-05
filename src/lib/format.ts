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
