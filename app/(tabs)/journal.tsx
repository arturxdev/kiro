import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { COLORS } from "@/constants/colors";
import { useDB } from "@/db/DatabaseProvider";
import { useAllEntries } from "@/hooks/useAllEntries";
import { useCategories } from "@/hooks/useCategories";
import { EntryCard } from "@/components/ui/EntryCard";
import * as entryRepository from "@/db/repositories/entryRepository";
import { deleteImage } from "@/utils/imageService";

export default function JournalScreen() {
  const db = useDB();
  const { getToken } = useAuth();
  const { categoriesMap } = useCategories();
  const { entries, isLoading, isLoadingMore, hasMore, loadMore, refetch } =
    useAllEntries(15);

  async function handleDelete(id: string, photoUrl?: string) {
    if (photoUrl) {
      const token = await getToken();
      if (token) {
        await deleteImage(photoUrl, token);
      }
    }
    await entryRepository.remove(db, id);
    refetch();
  }

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.background,
          justifyContent: "center",
          alignItems: "center",
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
          paddingTop: 16,
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
