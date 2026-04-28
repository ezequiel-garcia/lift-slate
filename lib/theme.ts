export const colors = {
  bg: "#0A0A0C",
  surface: "#161619",
  surface2: "#1F1F23",
  hairline: "#1B1812",
  border: "#2E2E33",
  borderL: "#3A3528",
  foreground: "#F0F0F0",
  /** @deprecated Use `foreground` instead */
  text: "#F0F0F0",
  muted: "#71717A",
  muted2: "#766B57",
  muted3: "#52483A",
  accent: "#B4FF4A",
  copper: "#C88B5C",
  accentMuted: "rgba(180,255,74,0.12)",
  error: "#EF4444",
  success: "#22C55E",
  warning: "#F59E0B",
} as const;

export const spacing = {
  "2xs": 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  /** @deprecated Use "2xl" instead */
  xxl: 48,
  "2xl": 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const animation = {
  duration: {
    fast: 150,
    normal: 250,
    slow: 400,
  },
  spring: {
    default: { damping: 20, stiffness: 300 },
    bouncy: { damping: 15, stiffness: 200 },
  },
  stagger: {
    item: 40,
    maxItems: 8,
  },
} as const;
