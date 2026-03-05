const LBS_PER_KG = 2.20462;

export type WeightUnit = "kg" | "lbs";

export function toKg(value: number, unit: WeightUnit): number {
  if (unit === "kg") return value;
  return value / LBS_PER_KG;
}

export function fromKg(valueKg: number, unit: WeightUnit): number {
  if (unit === "kg") return valueKg;
  return valueKg * LBS_PER_KG;
}

export function roundToPlate(value: number, incrementKg: number, unit: WeightUnit): number {
  const increment = unit === "kg" ? incrementKg : fromKg(incrementKg, "lbs");
  return Math.round(value / increment) * increment;
}

export function calculatePercentage(
  maxKg: number,
  percentage: number,
  unit: WeightUnit,
  roundingIncrementKg: number,
): { raw: number; rounded: number } {
  const rawKg = maxKg * (percentage / 100);
  const displayRaw = fromKg(rawKg, unit);
  const displayRounded = roundToPlate(displayRaw, roundingIncrementKg, unit);
  return { raw: parseFloat(displayRaw.toFixed(1)), rounded: displayRounded };
}

export function formatWeight(value: number, unit: WeightUnit): string {
  const rounded = Number.isInteger(value) ? value.toString() : value.toFixed(1);
  return `${rounded} ${unit}`;
}
