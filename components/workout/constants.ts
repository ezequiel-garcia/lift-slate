export const BLOCK_TYPE_LABELS: Record<string, string> = {
  warmup: "Warm-up",
  strength: "Strength",
  conditioning: "Conditioning",
  accessory: "Accessory",
  custom: "Custom",
};

export const QUICK_START_TEMPLATES = [
  { key: "warmup", label: "Warm-up", icon: "flame-outline" as const },
  { key: "strength", label: "Strength", icon: "barbell-outline" as const },
  {
    key: "conditioning",
    label: "Conditioning",
    icon: "timer-outline" as const,
  },
  { key: "accessory", label: "Accessory", icon: "fitness-outline" as const },
] as const;
