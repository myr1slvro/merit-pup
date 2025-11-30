// Theme colors from globals.css for analytics charts
export const THEME_COLORS = {
  meritRed: "#901212",
  meritDarkRed: "#501818",
  meritYellow: "#FFDF00",
  meritGray: "#727272",
} as const;

// Chart color palette using theme colors + complementary colors
export const CHART_COLORS = [
  THEME_COLORS.meritRed, // Primary red
  THEME_COLORS.meritYellow, // Yellow
  "#10B981", // Green (success/certified)
  "#3B82F6", // Blue
  THEME_COLORS.meritDarkRed, // Dark red
  "#8B5CF6", // Purple
  THEME_COLORS.meritGray, // Gray
  "#14B8A6", // Teal
] as const;

// Specific chart colors for consistency
export const CHART_CONFIG = {
  totalIMs: THEME_COLORS.meritRed,
  certifiedIMs: "#10B981",
  created: "#10B981",
  updated: "#3B82F6",
  departments: "#3B82F6",
  monthly: THEME_COLORS.meritRed,
} as const;
