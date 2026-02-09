export const COLORS = {
  // Dark theme
  background: "#0F0F0F",
  surface: "#1A1A1A",
  border: "#2A2A2A",
  textPrimary: "#FFFFFF",
  textSecondary: "#A0A0A0",

  // Tab bar
  tabBar: "#0F0F0F",
  tabIconInactive: "#666666",
  tabIconActive: "#FFFFFF",

  // Default category colors
  categories: {
    work: "#4A9EFF",
    health: "#4ADE80",
    social: "#F472B6",
    creative: "#C084FC",
    rest: "#60A5FA",
    travel: "#FBBF24",
    learning: "#34D399",
    other: "#94A3B8",
  },

  // Grid
  cellEmpty: "#1A1A1A",
  cellFuture: "#111111",
} as const;

export const CELL_STATES = {
  future: "transparent",
  futureBorder: "#1A1A1A",
  pastEmpty: "#1E1E1E",
  todayBorder: "#FFFFFF",
} as const;
