import { COLORS } from "@/constants/colors";
import { FONTS } from "@/constants/fonts";
import type { Category, DayEntry } from "@/types";
import type { MonthData } from "@/utils/calendar";
import { formatDateKey } from "@/utils/calendar";
import { getCellVisualState, type CellVisualState } from "@/utils/grid-logic";
import { memo, useMemo } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

const FULL_MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Local color constants for MonthBlock
const MB_COLORS = {
  sectionBg: COLORS.surface,
  divider: "rgba(255,255,255,0.15)",
} as const;

const HORIZONTAL_PADDING = 20;
const CELL_GAP = 4;
const ROW_GAP = 8;
const screenWidth = Dimensions.get("window").width;
const gridInnerWidth = screenWidth - HORIZONTAL_PADDING * 2 - 24; // 24 = section horizontal padding (12*2)
const CELL_SIZE = Math.floor((gridInnerWidth - CELL_GAP * 6) / 7);

interface MonthBlockProps {
  month: MonthData;
  year: number;
  entriesMap: Map<string, DayEntry[]>;
  categoriesMap: Map<string, Category>;
  onDayPress: (dateKey: string) => void;
}

function MonthBlockInner({
  month,
  year,
  entriesMap,
  categoriesMap,
  onDayPress,
}: MonthBlockProps) {
  const cellStates = useMemo(() => {
    const map = new Map<string, CellVisualState>();
    for (let d = 1; d <= month.days; d++) {
      const key = formatDateKey(year, month.month, d);
      map.set(key, getCellVisualState(key, entriesMap.get(key), categoriesMap));
    }
    return map;
  }, [year, month, entriesMap, categoriesMap]);

  const gridCells = useMemo(() => {
    const cells: (number | null)[] = [];
    for (let i = 0; i < month.startDayOfWeek; i++) cells.push(null);
    for (let d = 1; d <= month.days; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [month]);

  const rows = useMemo(() => {
    const result: (number | null)[][] = [];
    for (let i = 0; i < gridCells.length; i += 7) {
      result.push(gridCells.slice(i, i + 7));
    }
    return result;
  }, [gridCells]);

  return (
    <View style={styles.section}>
      {/* Month header */}
      <Text style={styles.monthName}>{FULL_MONTH_NAMES[month.month]}</Text>

      {/* Weekday headers */}
      <View style={styles.row}>
        {WEEKDAY_LABELS.map((label, i) => (
          <View key={i} style={[styles.cellBase, styles.weekdayCell]}>
            <Text style={styles.weekdayText}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Day rows */}
      {rows.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((day, ci) => {
            if (day === null) {
              return <View key={`blank-${ri}-${ci}`} style={styles.cellBase} />;
            }
            const dateKey = formatDateKey(year, month.month, day);
            const state = cellStates.get(dateKey)!;
            return (
              <DayCell
                key={dateKey}
                dateKey={dateKey}
                day={day}
                state={state}
                onPress={onDayPress}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

export const MonthBlock = memo(MonthBlockInner);

// --- DayCell ---

interface DayCellProps {
  dateKey: string;
  day: number;
  state: CellVisualState;
  onPress: (dateKey: string) => void;
}

const DayCellInner = ({ dateKey, day, state, onPress }: DayCellProps) => {
  const cellStyle = useMemo(() => {
    switch (state.status) {
      case "future":
        return styles.cellFuture;
      case "pastEmpty":
        return styles.cellPastEmpty;
      case "today":
        return styles.cellToday;
      case "filled":
        return [styles.cellFilled, { backgroundColor: state.dominantColor ?? "#7C3AED" }];
    }
  }, [state.status, state.dominantColor]);

  const textColor =
    state.status === "today"
      ? COLORS.todayText
      : state.status === "filled"
        ? COLORS.textFilled
        : state.status === "pastEmpty"
          ? COLORS.textPastEmpty
          : COLORS.textFuture;

  return (
    <Pressable
      style={[styles.cellBase, styles.cellInner, cellStyle]}
      onPress={() => onPress(dateKey)}
      accessibilityRole="button"
      accessibilityLabel={`Day ${day}`}
    >
      <Text style={[styles.dayNumber, { color: textColor }]}>{day}</Text>
      {state.dotColors.length > 1 && (
        <View style={styles.dotRow}>
          {state.dotColors.slice(0, 3).map((color, i) => (
            <View key={i} style={[styles.dot, { backgroundColor: color }]} />
          ))}
        </View>
      )}
    </Pressable>
  );
};

const DayCell = memo(DayCellInner);

// --- Styles ---

const styles = StyleSheet.create({
  section: {
    marginBottom: 28,
    marginHorizontal: HORIZONTAL_PADDING,
    backgroundColor: MB_COLORS.sectionBg,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 12,
  },
  monthName: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: 14,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: MB_COLORS.divider,
    marginBottom: ROW_GAP,
  },
  row: {
    flexDirection: "row",
    gap: CELL_GAP,
    marginBottom: ROW_GAP,
  },
  cellBase: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  weekdayCell: {
    height: 22,
  },
  weekdayText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: COLORS.textWeekday,
  },
  cellInner: {
    borderRadius: CELL_SIZE / 2,
  },
  cellFuture: {
    // transparent — just dimmed text, no border or background
  },
  cellPastEmpty: {
    // transparent — just dimmed text, no background
  },
  cellToday: {
    backgroundColor: COLORS.todayBackground,
  },
  cellFilled: {
    // backgroundColor set inline via dominantColor
  },
  dayNumber: {
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  dotRow: {
    flexDirection: "row",
    position: "absolute",
    bottom: 3,
    gap: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
