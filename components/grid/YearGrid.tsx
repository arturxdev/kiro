import type { Category, DayEntry } from "@/types";
import { generateYearMonths } from "@/utils/calendar";
import { useEffect, useMemo, useRef } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { MonthBlock } from "./MonthBlock";

interface YearGridProps {
  year: number;
  entriesMap: Map<string, DayEntry[]>;
  categoriesMap: Map<string, Category>;
  onDayPress: (dateKey: string) => void;
}

export function YearGrid({ year, entriesMap, categoriesMap, onDayPress }: YearGridProps) {
  const months = useMemo(() => generateYearMonths(year), [year]);
  const scrollRef = useRef<ScrollView>(null);
  const monthLayouts = useRef<Record<number, number>>({});

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Scroll to current month on mount when viewing current year
  useEffect(() => {
    if (year === currentYear) {
      // Small delay to let layout settle
      const timer = setTimeout(() => {
        const y = monthLayouts.current[currentMonth];
        if (y !== undefined) {
          scrollRef.current?.scrollTo({ y: y - 20, animated: false });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [year, currentYear, currentMonth]);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {/* Timeline spine */}

      {months.map((month) => (
          <View
            key={month.month}
            onLayout={(e) => {
              monthLayouts.current[month.month] = e.nativeEvent.layout.y;
            }}
          >
            <MonthBlock
              month={month}
              year={year}
              entriesMap={entriesMap}
              categoriesMap={categoriesMap}
              onDayPress={onDayPress}
            />
          </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 8,
    paddingBottom: 40,
    position: "relative",
  },
});
