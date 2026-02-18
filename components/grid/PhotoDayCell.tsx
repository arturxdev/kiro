import { COLORS } from "@/constants/colors";
import { FONTS } from "@/constants/fonts";
import type { PhotoGridDay } from "@/utils/calendar";
import { getWeekdayShort } from "@/utils/calendar";
import { Feather } from "@expo/vector-icons";
import { memo, useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

interface PhotoDayCellProps {
  day: PhotoGridDay;
  photoUri: string | null;
  onPress: (dateKey: string) => void;
  cellWidth: number;
  cellHeight: number;
}

function PhotoDayCellInner({
  day,
  photoUri,
  onPress,
  cellWidth,
  cellHeight,
}: PhotoDayCellProps) {
  const sizeStyle = useMemo(
    () => ({ width: cellWidth, height: cellHeight }),
    [cellWidth, cellHeight]
  );

  return (
    <Pressable
      style={[styles.cell, sizeStyle]}
      onPress={() => onPress(day.dateKey)}
      accessibilityRole="button"
      accessibilityLabel={`Day ${day.dayNumber}`}
    >
      {photoUri ? (
        <Image
          source={{ uri: photoUri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      ) : null}

      {/* Dark overlay for text contrast */}
      <View
        style={[
          StyleSheet.absoluteFill,
          photoUri ? styles.overlayWithPhoto : styles.overlayEmpty,
        ]}
      />

      {/* Top-left: weekday + day number */}
      <View style={styles.topLeft}>
        <Text style={styles.weekdayText}>
          {day.isToday ? "Today" : getWeekdayShort(day.dayOfWeek)}
        </Text>
        <Text style={[styles.dayNumber, day.isToday && styles.dayNumberToday]}>
          {day.dayNumber}
        </Text>
      </View>

      {/* Centered placeholder icon for empty cells */}
      {!photoUri && (
        <View style={styles.placeholderCenter}>
          <Feather name="camera" size={28} color="rgba(255,255,255,0.12)" />
        </View>
      )}

    </Pressable>
  );
}

export const PhotoDayCell = memo(PhotoDayCellInner);

const styles = StyleSheet.create({
  cell: {
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#1C1C1E",
  },
  overlayWithPhoto: {
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  overlayEmpty: {
    backgroundColor: "transparent",
  },
  topLeft: {
    position: "absolute",
    top: 8,
    left: 8,
  },
  weekdayText: {
    fontSize: 10,
    fontFamily: FONTS.semibold,
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  dayNumber: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    lineHeight: 32,
  },
  dayNumberToday: {
    color: "#FFFFFF",
  },
  placeholderCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});
