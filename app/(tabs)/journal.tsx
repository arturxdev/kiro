import { EntryCard } from "@/components/ui/EntryCard";
import { COLORS } from "@/constants/colors";
import { useDB } from "@/db/DatabaseProvider";
import * as entryRepository from "@/db/repositories/entryRepository";
import { useAllEntries } from "@/hooks/useAllEntries";
import { useCategories } from "@/hooks/useCategories";
import { useDataContext } from "@/providers/DataProvider";
import { useSyncContext } from "@/providers/SyncProvider";
import { deleteImage } from "@/utils/imageService";
import { useAuth } from "@clerk/clerk-expo";
import { ActivityIndicator, Alert, FlatList, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function JournalScreen() {
  const insets = useSafeAreaInsets();
  const db = useDB();
  const { getToken } = useAuth();
  const { categoriesMap } = useCategories();
  const { entries, isLoading, isLoadingMore, hasMore, loadMore } =
    useAllEntries(15);
  const { triggerSync } = useSyncContext();
  const { invalidate } = useDataContext();

  function handleDelete(id: string, photoUrl?: string) {
    Alert.alert("Delete entry", "Are you sure you want to delete this entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (photoUrl) {
            const token = await getToken();
            if (token) await deleteImage(photoUrl, token);
          }
          await entryRepository.remove(db, id);
          invalidate();
          triggerSync();
        },
      },
    ]);
  }

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.background,
          justifyContent: "center",
          alignItems: "center",
          paddingTop: insets.top,
        }}
      >
        <ActivityIndicator color={COLORS.textSecondary} />
      </View>
    );
  }

  if (entries.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.background,
          justifyContent: "center",
          alignItems: "center",
          paddingTop: insets.top,
        }}
      >
        <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>
          No entries yet.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: insets.top + 16,
          paddingBottom: 20,
          gap: 12,
        }}
        renderItem={({ item }) => (
          <EntryCard
            entry={item}
            category={categoriesMap.get(item.category_id)}
            onDelete={handleDelete}
            showDate
          />
        )}
        onEndReached={hasMore ? loadMore : undefined}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isLoadingMore ? (
            <View style={{ paddingVertical: 16, alignItems: "center" }}>
              <ActivityIndicator color={COLORS.textSecondary} />
            </View>
          ) : null
        }
      />
    </View>
  );
}
