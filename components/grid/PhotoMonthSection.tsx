import { COLORS } from "@/constants/colors";
import { FONTS } from "@/constants/fonts";
import type { DayEntry } from "@/types";
import { buildPhotoGridRows } from "@/utils/calendar";
import { getTodayKey } from "@/utils/calendar";
import { getDayPhotoUri } from "@/utils/grid-logic";
import { memo, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { PhotoDayCell } from "./PhotoDayCell";

const FULL_MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const GAP = 2;

interface PhotoMonthSectionProps {
  year: number;
  month: number;
  entriesMap: Map<string, DayEntry[]>;
  onDayPress: (dateKey: string) => void;
  cellWidth: number;
  cellHeight: number;
}

function PhotoMonthSectionInner({
  year,
  month,
  entriesMap,
  onDayPress,
  cellWidth,
  cellHeight,
}: PhotoMonthSectionProps) {
  const todayKey = getTodayKey();
  const rows = useMemo(
    () => buildPhotoGridRows(year, month, todayKey),
    [year, month, todayKey]
  );

  if (rows.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.monthHeader}>
        {FULL_MONTH_NAMES[month]} {year}
      </Text>
      {rows.map((row) => (
        <View key={row.id} style={styles.row}>
          {row.cells.map((cell, i) => {
            if (!cell) {
              return (
                <View
                  key={`empty-${i}`}
                  style={{ width: cellWidth, height: cellHeight }}
                />
              );
            }
            const entries = entriesMap.get(cell.dateKey);
            return (
              <PhotoDayCell
                key={cell.dateKey}
                day={cell}
                photoUri={getDayPhotoUri(entries)}
                onPress={onDayPress}
                cellWidth={cellWidth}
                cellHeight={cellHeight}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

export const PhotoMonthSection = memo(PhotoMonthSectionInner);

const styles = StyleSheet.create({
  section: {
    paddingBottom: 16,
  },
  monthHeader: {
    fontSize: 11,
    fontFamily: FONTS.semibold,
    color: "rgba(245,245,245,0.45)",
    letterSpacing: 2,
    textTransform: "uppercase",
    paddingHorizontal: GAP,
    paddingTop: 20,
    paddingBottom: 8,
  },
  row: {
    flexDirection: "row",
    gap: GAP,
    marginBottom: GAP,
  },
});
