// Standard kettlebell progression in kg. Includes full (4kg) steps plus the
// common half-sizes found at most gyms. Used to resolve heavy/easy prescriptions
// against an athlete's working weight.
const KETTLEBELL_SIZES: number[] = [
  4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 44, 48,
];

// Round an arbitrary weight to the nearest standard kettlebell size on the rack.
function snapToBell(weightKg: number): number {
  let closest = KETTLEBELL_SIZES[0];
  let minDiff = Math.abs(weightKg - closest);
  for (const size of KETTLEBELL_SIZES) {
    const diff = Math.abs(weightKg - size);
    if (diff < minDiff) {
      minDiff = diff;
      closest = size;
    }
  }
  return closest;
}

export function stepBell(weightKg: number, steps: number): number | null {
  const snapped = snapToBell(weightKg);
  const idx = KETTLEBELL_SIZES.indexOf(snapped);
  const targetIdx = idx + steps;
  if (targetIdx < 0 || targetIdx >= KETTLEBELL_SIZES.length) return null;
  return KETTLEBELL_SIZES[targetIdx];
}

export function kettlebellRange(
  workingKg: number,
  minStep: number,
  maxStep: number,
): number[] {
  const lo = Math.min(minStep, maxStep);
  const hi = Math.max(minStep, maxStep);
  const out: number[] = [];
  for (let i = lo; i <= hi; i++) {
    const val = stepBell(workingKg, i);
    if (val !== null && !out.includes(val)) out.push(val);
  }
  return out.sort((a, b) => a - b);
}

export function heavyRange(workingKg: number): number[] {
  return kettlebellRange(workingKg, 1, 2);
}

export function easyRange(workingKg: number): number[] {
  return kettlebellRange(workingKg, -2, -1);
}
