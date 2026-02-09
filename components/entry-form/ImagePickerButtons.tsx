import { View, Pressable, Text, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/colors";
import { RADIUS, SPACING } from "@/constants/spacing";
import { useEntryForm } from "./EntryFormProvider";

export function ImagePickerButtons() {
  const { selectedImage, setSelectedImage, pickImage } = useEntryForm();

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => pickImage("gallery")}
        style={styles.button}
        accessibilityRole="button"
        accessibilityLabel="Pick image from gallery"
      >
        <Ionicons name="image-outline" size={16} color={COLORS.textSecondary} />
        <Text style={styles.buttonText}>Gallery</Text>
      </Pressable>

      <Pressable
        onPress={() => pickImage("camera")}
        style={styles.button}
        accessibilityRole="button"
        accessibilityLabel="Take a photo"
      >
        <Ionicons name="camera-outline" size={16} color={COLORS.textSecondary} />
        <Text style={styles.buttonText}>Camera</Text>
      </Pressable>

      {selectedImage && (
        <View style={styles.preview}>
          <Image source={{ uri: selectedImage }} style={styles.thumbnail} />
          <Pressable
            onPress={() => setSelectedImage(null)}
            hitSlop={6}
            style={styles.removeButton}
            accessibilityRole="button"
            accessibilityLabel="Remove selected image"
          >
            <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm + 2, // 10
    gap: SPACING.sm,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.sm + 2, // 6
    borderWidth: 0.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  buttonText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  preview: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: SPACING.xs,
  },
  thumbnail: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm + 2, // 6
    backgroundColor: COLORS.surface,
  },
  removeButton: {
    marginLeft: SPACING.xs,
  },
});
