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

export function calculatePercentage(
  maxKg: number,
  percentage: number,
  unit: WeightUnit,
): number {
  const rawKg = maxKg * (percentage / 100);
  return parseFloat(fromKg(rawKg, unit).toFixed(1));
}

export function formatWeight(value: number, unit: WeightUnit): string {
  const rounded = Number.isInteger(value) ? value.toString() : value.toFixed(1);
  return `${rounded} ${unit}`;
}
