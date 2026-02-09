import { View, Text, Pressable, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, Layout } from "react-native-reanimated";
import { COLORS } from "@/constants/colors";
import { FONTS } from "@/constants/fonts";
import { RADIUS, SPACING } from "@/constants/spacing";
import { formatDate } from "@/utils/date";
import type { DayEntry, Category } from "@/types";

interface EntryCardProps {
  entry: DayEntry;
  category?: Category;
  onDelete: (id: string, photoUrl?: string) => void;
  showDate?: boolean;
}

// --- Shared sub-components ---

function CategoryDot({ color }: { color: string }) {
  return <View style={[styles.dot, { backgroundColor: color }]} />;
}

function DeleteButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={styles.deleteButton}
      accessibilityRole="button"
      accessibilityLabel="Delete entry"
    >
      <Ionicons name="trash-outline" size={16} color={COLORS.textSecondary} />
    </Pressable>
  );
}

function DateLabel({ date }: { date: string }) {
  return <Text style={styles.dateText}>{formatDate(date)}</Text>;
}

// --- Variants ---

function WithImage({ entry, category, onDelete, showDate }: EntryCardProps) {
  return (
    <View style={styles.imageCard}>
      <Image
        source={{ uri: entry.photo_url! }}
        style={styles.image}
        resizeMode="cover"
        accessibilityLabel={`Photo for entry: ${entry.title}`}
      />
      <View style={styles.imageContent}>
        <View style={styles.row}>
          <View style={styles.flex}>
            <Text style={styles.imageTitle}>{entry.title}</Text>
            {category && (
              <View style={styles.categoryRow}>
                <CategoryDot color={category.color} />
                <Text style={styles.categoryName}>{category.name}</Text>
              </View>
            )}
            {showDate && <DateLabel date={entry.date} />}
          </View>
          <DeleteButton onPress={() => onDelete(entry.id, entry.photo_url)} />
        </View>
      </View>
    </View>
  );
}

function TextOnly({ entry, category, onDelete, showDate }: EntryCardProps) {
  return (
    <View style={styles.textCard}>
      <CategoryDot color={category?.color ?? COLORS.textSecondary} />
      <View style={styles.flex}>
        <Text style={styles.textTitle}>{entry.title}</Text>
        {category && <Text style={styles.textCategory}>{category.name}</Text>}
        {showDate && <DateLabel date={entry.date} />}
      </View>
      <DeleteButton onPress={() => onDelete(entry.id, entry.photo_url)} />
    </View>
  );
}

// --- Main component ---

export function EntryCard(props: EntryCardProps) {
  return (
    <Animated.View entering={FadeIn.duration(200)} layout={Layout.springify()}>
      {props.entry.photo_url ? <WithImage {...props} /> : <TextOnly {...props} />}
    </Animated.View>
  );
}

// --- Styles ---

const styles = StyleSheet.create({
  // Shared
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  deleteButton: {
    padding: SPACING.xs,
  },
  dateText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: SPACING.xs,
  },
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.sm,
    gap: 6,
  },
  categoryName: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: FONTS.medium,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },

  // WithImage variant
  imageCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  image: {
    width: "100%",
    height: 220,
    backgroundColor: COLORS.border,
  },
  imageContent: {
    padding: 14,
  },
  imageTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontFamily: FONTS.semibold,
    lineHeight: 22,
  },

  // TextOnly variant
  textCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    gap: SPACING.md,
  },
  textTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontFamily: FONTS.medium,
  },
  textCategory: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 3,
    letterSpacing: 0.2,
  },
});
