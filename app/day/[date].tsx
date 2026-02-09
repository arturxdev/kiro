import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "@clerk/clerk-expo";
import { COLORS } from "@/constants/colors";
import { useDB } from "@/db/DatabaseProvider";
import { useCategories } from "@/hooks/useCategories";
import { useDayEntries } from "@/hooks/useDayEntries";
import { CategoryPill } from "@/components/ui/CategoryPill";
import { EntryCard } from "@/components/ui/EntryCard";
import * as entryRepository from "@/db/repositories/entryRepository";
import { uploadImage, deleteImage } from "@/utils/imageService";

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

async function pickImage(source: "gallery" | "camera"): Promise<string | null> {
  if (source === "camera") {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Camera access is required to take photos.");
      return null;
    }
  }

  const result =
    source === "gallery"
      ? await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 1,
          allowsEditing: true,
        })
      : await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          quality: 1,
          allowsEditing: true,
        });

  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}

export default function DayDetailScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const db = useDB();
  const { userId, getToken } = useAuth();
  const { categories, categoriesMap } = useCategories();
  const { entries, isLoading, refetch } = useDayEntries(date!);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const canSubmit = selectedCategoryId && title.trim().length > 0 && !isUploading;

  async function handlePickImage(source: "gallery" | "camera") {
    const uri = await pickImage(source);
    if (uri) setSelectedImage(uri);
  }

  async function handleAdd() {
    if (!canSubmit) return;

    setIsUploading(true);
    try {
      // 1. Create entry
      const entryId = await entryRepository.create(db, {
        date: date!,
        category_id: selectedCategoryId,
        title: title.trim(),
      });

      // 2. Upload image if selected
      if (selectedImage && userId) {
        const token = await getToken();
        if (token) {
          const result = await uploadImage({
            imageUri: selectedImage,
            entryId,
            userId,
            clerkToken: token,
          });

          if (result.success && result.publicUrl) {
            await entryRepository.update(db, entryId, {
              photo_url: result.publicUrl,
            });
          } else {
            Alert.alert(
              "Image upload failed",
              result.error ?? "The entry was saved without a photo."
            );
          }
        }
      }

      setTitle("");
      setSelectedCategoryId(null);
      setSelectedImage(null);
      refetch();
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(id: string, photoUrl?: string) {
    // Delete image from R2 if present
    if (photoUrl) {
      const token = await getToken();
      if (token) {
        await deleteImage(photoUrl, token);
      }
    }

    await entryRepository.remove(db, id);
    refetch();
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
          <Text style={{ color: COLORS.textPrimary, fontSize: 22, fontWeight: "700" }}>
            {formatDate(date!)}
          </Text>
        </View>

        {/* Entries list */}
        {isLoading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator color={COLORS.textSecondary} />
          </View>
        ) : entries.length === 0 ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>
              No entries yet. Add one below.
            </Text>
          </View>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 12 }}
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
        <View
          style={{
            borderTopWidth: 0.5,
            borderTopColor: COLORS.border,
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 16,
            backgroundColor: COLORS.background,
          }}
        >
          {/* Category selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 10 }}
          >
            {categories.map((cat) => (
              <CategoryPill
                key={cat.id}
                name={cat.name}
                color={cat.color}
                isActive={selectedCategoryId === cat.id}
                onPress={() =>
                  setSelectedCategoryId(
                    selectedCategoryId === cat.id ? null : cat.id
                  )
                }
              />
            ))}
          </ScrollView>

          {/* Image picker buttons + preview */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 8 }}>
            <Pressable
              onPress={() => handlePickImage("gallery")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                borderWidth: 0.5,
                borderColor: COLORS.border,
                backgroundColor: COLORS.surface,
              }}
            >
              <Ionicons name="image-outline" size={16} color={COLORS.textSecondary} />
              <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>Gallery</Text>
            </Pressable>

            <Pressable
              onPress={() => handlePickImage("camera")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                borderWidth: 0.5,
                borderColor: COLORS.border,
                backgroundColor: COLORS.surface,
              }}
            >
              <Ionicons name="camera-outline" size={16} color={COLORS.textSecondary} />
              <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>Camera</Text>
            </Pressable>

            {selectedImage && (
              <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 4 }}>
                <Image
                  source={{ uri: selectedImage }}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 6,
                    backgroundColor: COLORS.surface,
                  }}
                />
                <Pressable
                  onPress={() => setSelectedImage(null)}
                  hitSlop={6}
                  style={{ marginLeft: 4 }}
                >
                  <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
                </Pressable>
              </View>
            )}
          </View>

          {/* Title input + submit */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="What happened?"
              placeholderTextColor={COLORS.textSecondary}
              returnKeyType="done"
              onSubmitEditing={canSubmit ? handleAdd : undefined}
              style={{
                flex: 1,
                height: 40,
                borderRadius: 8,
                borderWidth: 0.5,
                borderColor: COLORS.border,
                backgroundColor: COLORS.surface,
                paddingHorizontal: 12,
                color: COLORS.textPrimary,
                fontSize: 14,
              }}
            />
            <Pressable
              onPress={handleAdd}
              disabled={!canSubmit}
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                backgroundColor: canSubmit ? COLORS.textPrimary : COLORS.border,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color={COLORS.background} />
              ) : (
                <Ionicons
                  name="add"
                  size={22}
                  color={canSubmit ? COLORS.background : COLORS.textSecondary}
                />
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
