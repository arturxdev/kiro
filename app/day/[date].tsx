import {
  View,
  Text,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { COLORS } from "@/constants/colors";
import { FONTS } from "@/constants/fonts";
import { SPACING } from "@/constants/spacing";
import { formatDate } from "@/utils/date";
import { useDB } from "@/db/DatabaseProvider";
import { useSyncContext } from "@/providers/SyncProvider";
import { useCategories } from "@/hooks/useCategories";
import { useDayEntries } from "@/hooks/useDayEntries";
import { EntryCard } from "@/components/ui/EntryCard";
import {
  EntryFormProvider,
  useEntryForm,
  CategorySelector,
  ImagePickerButtons,
  EntryInput,
} from "@/components/entry-form";
import { useDataContext } from "@/providers/DataProvider";
import * as entryRepository from "@/db/repositories/entryRepository";
import { uploadImage, deleteImage, persistImageLocally, deleteLocalImage } from "@/utils/imageService";

export default function DayDetailScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();

  return (
    <EntryFormProvider>
      <DayDetailContent date={date!} />
    </EntryFormProvider>
  );
}

function DayDetailContent({ date }: { date: string }) {
  const db = useDB();
  const { userId, getToken } = useAuth();
  const { categories, categoriesMap } = useCategories();
  const { entries, isLoading } = useDayEntries(date);
  const { triggerSync } = useSyncContext();
  const { invalidate } = useDataContext();
  const form = useEntryForm();

  async function handleAdd() {
    if (!form.canSubmit || !form.selectedCategoryId) return;

    form.setIsUploading(true);
    try {
      const entryId = await entryRepository.create(db, {
        date,
        category_id: form.selectedCategoryId,
        title: form.title.trim(),
      });

      if (form.selectedImage && userId) {
        // Persist image locally first so it survives app restarts
        const localUri = await persistImageLocally(form.selectedImage, entryId);
        await entryRepository.update(db, entryId, { local_photo_uri: localUri });

        // Attempt upload to R2
        const token = await getToken();
        if (token) {
          const result = await uploadImage({
            imageUri: localUri,
            entryId,
            userId,
            clerkToken: token,
          });

          if (result.success && result.publicUrl) {
            await entryRepository.update(db, entryId, {
              photo_url: result.publicUrl,
              local_photo_uri: null,
            });
            await deleteLocalImage(entryId);
          }
          // If upload fails, entry keeps local_photo_uri — will retry via queue
        }
      }

      form.reset();
      invalidate();
      triggerSync();
    } finally {
      form.setIsUploading(false);
    }
  }

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
          // Clean up local image file if it exists
          await deleteLocalImage(id);
          await entryRepository.remove(db, id);
          invalidate();
          triggerSync();
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.flex}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText} accessibilityRole="header">
            {formatDate(date)}
          </Text>
        </View>

        {/* Entries list */}
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={COLORS.textSecondary} />
          </View>
        ) : entries.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No entries yet. Add one below.</Text>
          </View>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <EntryCard
                entry={item}
                category={categoriesMap.get(item.category_id)}
                onDelete={handleDelete}
              />
            )}
          />
        )}

        {/* Add form */}
        <View style={styles.formContainer}>
          <CategorySelector categories={categories} />
          <ImagePickerButtons />
          <EntryInput onSubmit={handleAdd} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  headerText: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontFamily: FONTS.bold,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
    paddingBottom: SPACING.md,
  },
  formContainer: {
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    backgroundColor: COLORS.background,
  },
});
