import { View, TextInput, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/colors";
import { RADIUS, SPACING } from "@/constants/spacing";
import { useEntryForm } from "./EntryFormProvider";

interface EntryInputProps {
  onSubmit: () => void;
}

export function EntryInput({ onSubmit }: EntryInputProps) {
  const { title, setTitle, canSubmit, isUploading } = useEntryForm();

  return (
    <View style={styles.container}>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="What happened?"
        placeholderTextColor={COLORS.textSecondary}
        returnKeyType="done"
        onSubmitEditing={canSubmit ? onSubmit : undefined}
        style={styles.input}
        accessibilityLabel="Entry text"
        accessibilityHint="Type what happened today"
      />
      <Pressable
        onPress={onSubmit}
        disabled={!canSubmit}
        style={[
          styles.submitButton,
          { backgroundColor: canSubmit ? COLORS.textPrimary : COLORS.border },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Add entry"
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
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: RADIUS.md,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  submitButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    justifyContent: "center",
    alignItems: "center",
  },
});
