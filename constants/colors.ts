export const COLORS = {
  // Dark theme
  background: "#1A1A1A",
  surface: "#2D2D2D",
  border: "#3A3A3A",
  textPrimary: "#F5F5F5",
  textSecondary: "#8A8A8A",

  // Tab bar
  tabBar: "#1A1A1A",
  tabIconInactive: "#666666",
  tabIconActive: "#F5F5F5",

  // Category colors
  categories: {
    work: "#3B82F6",
    health: "#22C55E",
    social: "#EC4899",
    creative: "#A855F7",
    rest: "#3B82F6",
    travel: "#EAB308",
    learning: "#10B981",
    other: "#64748B",
  },

  // Grid
  cellEmpty: "#252525",
  cellFuture: "#1F1F1F",
  gridBackground: "rgba(255,255,255,0.03)",
  gridBorder: "rgba(255,255,255,0.08)",
  cellPastEmpty: "#252525",

  // Text opacities (light-on-dark)
  textMonthName: "rgba(245,245,245,0.85)",
  textWeekday: "rgba(245,245,245,0.35)",
  textFuture: "rgba(245,245,245,0.20)",
  textFilled: "rgba(255,255,255,0.92)",
  textPastEmpty: "rgba(245,245,245,0.40)",

  // Semantic
  danger: "#EF4444",
  todayBackground: "#F5F5F5",
  todayText: "#1A1A1A",
} as const;

export const CELL_STATES = {
  future: "transparent",
  futureBorder: "#3A3A3A",
  pastEmpty: "#252525",
  todayBorder: "#F5F5F5",
} as const;
