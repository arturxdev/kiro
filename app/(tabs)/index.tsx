import { YearGrid } from "@/components/grid/YearGrid";
import { COLORS } from "@/constants/colors";
import { FONTS } from "@/constants/fonts";
import { SPACING } from "@/constants/spacing";
import { useCategories } from "@/hooks/useCategories";
import { useEntries } from "@/hooks/useEntries";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const currentYear = new Date().getFullYear();

export default function GridScreen() {
  const [year, setYear] = useState(currentYear);
  const { entriesMap, isLoading: entriesLoading } = useEntries(year);
  const { categoriesMap, isLoading: categoriesLoading } = useCategories();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const isLoading = entriesLoading || categoriesLoading;

  const handlePrevYear = () => setYear((y) => y - 1);
  const handleNextYear = () => {
    if (year < currentYear) setYear((y) => y + 1);
  };

  const handleDayPress = (dateKey: string) => {
    router.push(`/day/${dateKey}`);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Year header */}
      <View style={styles.yearHeader}>
        <Pressable
          onPress={handlePrevYear}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Previous year"
        >
          <Feather name="chevron-left" size={22} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.yearText} accessibilityRole="header">
          {year}
        </Text>
        <Pressable
          onPress={handleNextYear}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Next year"
        >
          <Feather
            name="chevron-right"
            size={22}
            color={year < currentYear ? COLORS.textPrimary : COLORS.textSecondary}
          />
        </Pressable>
      </View>

      {/* Grid */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.textSecondary} />
        </View>
      ) : (
        <YearGrid
          year={year}
          entriesMap={entriesMap}
          categoriesMap={categoriesMap}
          onDayPress={handleDayPress}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  yearHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  yearText: {
    fontSize: 18,
    fontFamily: FONTS.semibold,
    marginHorizontal: SPACING.xxl,
    color: COLORS.textPrimary,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
