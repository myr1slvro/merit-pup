// Theme colors from globals.css for analytics charts
export const THEME_COLORS = {
  immsRed: "#901212",
  immsDarkRed: "#501818",
  immsYellow: "#FFDF00",
  immsGray: "#727272",
} as const;

// Chart color palette using theme colors + complementary colors
export const CHART_COLORS = [
  THEME_COLORS.immsRed, // Primary red
  THEME_COLORS.immsYellow, // Yellow
  "#10B981", // Green (success/certified)
  "#3B82F6", // Blue
  THEME_COLORS.immsDarkRed, // Dark red
  "#8B5CF6", // Purple
  THEME_COLORS.immsGray, // Gray
  "#14B8A6", // Teal
] as const;

// Specific chart colors for consistency
export const CHART_CONFIG = {
  totalIMs: THEME_COLORS.immsRed,
  certifiedIMs: "#10B981",
  created: "#10B981",
  updated: "#3B82F6",
  departments: "#3B82F6",
  monthly: THEME_COLORS.immsRed,
} as const;
