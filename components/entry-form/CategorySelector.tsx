import { ScrollView, StyleSheet } from "react-native";
import { CategoryPill } from "@/components/ui/CategoryPill";
import { useEntryForm } from "./EntryFormProvider";
import type { Category } from "@/types";
import { SPACING } from "@/constants/spacing";

interface CategorySelectorProps {
  categories: Category[];
}

export function CategorySelector({ categories }: CategorySelectorProps) {
  const { selectedCategoryId, setSelectedCategoryId } = useEntryForm();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      accessibilityRole="menu"
      accessibilityLabel="Category selector"
    >
      {categories.map((cat) => (
        <CategoryPill
          key={cat.id}
          name={cat.name}
          color={cat.color}
          isActive={selectedCategoryId === cat.id}
          onPress={() =>
            setSelectedCategoryId(selectedCategoryId === cat.id ? null : cat.id)
          }
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.sm + 2, // 10
  },
});
