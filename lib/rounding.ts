/**
 * Round a value to a given number of decimal places.
 * Used for display precision before plate rounding.
 */
export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Round up to nearest increment (ceiling rounding for plate math).
 */
export function ceilToIncrement(value: number, increment: number): number {
  return Math.ceil(value / increment) * increment;
}

/**
 * Round down to nearest increment (floor rounding for plate math).
 */
export function floorToIncrement(value: number, increment: number): number {
  return Math.floor(value / increment) * increment;
}
