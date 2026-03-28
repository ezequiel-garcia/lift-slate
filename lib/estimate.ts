/**
 * Estimate 1RM using the Epley formula: weight × (1 + reps / 30)
 * Most widely used and accurate for 1–10 reps.
 *
 * Returns the weight in the same unit as input.
 * Returns the input weight directly if reps === 1.
 */
export function estimate1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

/** Reps above this threshold produce unreliable estimates. */
export const MAX_RELIABLE_REPS = 10;
