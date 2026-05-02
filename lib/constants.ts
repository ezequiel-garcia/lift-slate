export const INVITE_BASE_URL = "https://liftslate-invite.vercel.app";

export const COMMON_PERCENTAGES = [50, 55, 60, 65, 70, 75, 80, 85, 90];

export const EQUIPMENT_TYPES = [
  { value: "barbell" as const, label: "Barbell" },
  { value: "dumbbell" as const, label: "Dumbbell" },
  { value: "kettlebell" as const, label: "Kettlebell" },
  { value: "bodyweight" as const, label: "Bodyweight" },
  { value: "machine" as const, label: "Machine" },
  { value: "other" as const, label: "Other" },
];

export const EQUIPMENT_ORDER = EQUIPMENT_TYPES.map((e) => e.value);

export const EQUIPMENT_LABELS = Object.fromEntries(
  EQUIPMENT_TYPES.map((e) => [e.value, e.label]),
) as Record<(typeof EQUIPMENT_ORDER)[number], string>;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isValidUUID(value: string | undefined): value is string {
  return !!value && UUID_REGEX.test(value);
}
