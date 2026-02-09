import { YearGrid } from "@/components/grid/YearGrid";
import { COLORS } from "@/constants/colors";
import { useCategories } from "@/hooks/useCategories";
import { useEntries } from "@/hooks/useEntries";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const currentYear = new Date().getFullYear();

export default function GridScreen() {
  const [year, setYear] = useState(currentYear);
  const { entriesMap, isLoading: entriesLoading, refetch: entriesRefetch } = useEntries(year);

  useFocusEffect(
    useCallback(() => {
      entriesRefetch();
    }, [entriesRefetch])
  );
  const { categories, categoriesMap, isLoading: categoriesLoading } = useCategories();
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
    <View style={{ flex: 1, backgroundColor: COLORS.background, paddingTop: insets.top }}>
      {/* Year header */}
      <View className="flex-row items-center justify-center py-3 px-4">
        <Pressable onPress={handlePrevYear} hitSlop={12}>
          <Feather name="chevron-left" size={22} color={COLORS.textPrimary} />
        </Pressable>
        <Text className="text-lg font-semibold mx-6" style={{ color: COLORS.textPrimary }}>
          {year}
        </Text>
        <Pressable onPress={handleNextYear} hitSlop={12}>
          <Feather
            name="chevron-right"
            size={22}
            color={year < currentYear ? COLORS.textPrimary : COLORS.textSecondary}
          />
        </Pressable>
      </View>
      {/* Category pills */}
      {/* {categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
        >
          {categories.map((cat) => (
            <CategoryPill key={cat.id} name={cat.name} color={cat.color} />
          ))}
        </ScrollView>
      )} */}

      {/* Grid */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
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
