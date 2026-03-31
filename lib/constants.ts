export const COMMON_PERCENTAGES = [50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];

export const EXERCISE_CATEGORIES = [
  { value: "squat" as const, label: "Squat" },
  { value: "press" as const, label: "Press" },
  { value: "pull" as const, label: "Pull" },
  { value: "olympic" as const, label: "Olympic" },
  { value: "accessory" as const, label: "Accessory" },
  { value: "core" as const, label: "Core" },
  { value: "conditioning" as const, label: "Conditioning" },
];

export const CATEGORY_ORDER = EXERCISE_CATEGORIES.map((c) => c.value);

export const CATEGORY_LABELS = Object.fromEntries(
  EXERCISE_CATEGORIES.map((c) => [c.value, c.label]),
) as Record<(typeof CATEGORY_ORDER)[number], string>;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isValidUUID(value: string | undefined): value is string {
  return !!value && UUID_REGEX.test(value);
}
