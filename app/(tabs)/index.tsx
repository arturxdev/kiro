import { PhotoMonthSection } from "@/components/grid/PhotoMonthSection";
import { COLORS } from "@/constants/colors";
import { usePhotoCalendar } from "@/hooks/usePhotoCalendar";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COLUMNS = 3;
const GAP = 2;
const H_PADDING = 2;

export default function GridScreen() {
  const { months, entriesMap, isLoading, isLoadingMore, canLoadMore, loadMore } =
    usePhotoCalendar();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const { cellWidth, cellHeight } = useMemo(() => {
    const cw = Math.floor((width - H_PADDING * 2 - GAP * (COLUMNS - 1)) / COLUMNS);
    return { cellWidth: cw, cellHeight: Math.floor(cw * 1.4) };
  }, [width]);

  const handleDayPress = (dateKey: string) => {
    router.push(`/day/${dateKey}`);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={COLORS.textSecondary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={months}
        keyExtractor={(item) => item.key}
        inverted
        renderItem={({ item }) => (
          <PhotoMonthSection
            year={item.year}
            month={item.month}
            entriesMap={entriesMap}
            onDayPress={handleDayPress}
            cellWidth={cellWidth}
            cellHeight={cellHeight}
          />
        )}
        onEndReached={canLoadMore ? loadMore : undefined}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator color={COLORS.textSecondary} />
            </View>
          ) : null
        }
        contentContainerStyle={[styles.listContent, { paddingHorizontal: H_PADDING }]}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        initialNumToRender={3}
        maxToRenderPerBatch={2}
        windowSize={5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingBottom: 20,
  },
  loadingMore: {
    paddingVertical: 16,
    alignItems: "center",
  },
});
