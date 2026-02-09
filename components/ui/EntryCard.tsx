import { View, Text, Pressable, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/colors";
import type { DayEntry, Category } from "@/types";

interface EntryCardProps {
  entry: DayEntry;
  category?: Category;
  onDelete: (id: string, photoUrl?: string) => void;
  showDate?: boolean;
}

function formatEntryDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function EntryCard({ entry, category, onDelete, showDate }: EntryCardProps) {
  const hasImage = !!entry.photo_url;

  if (hasImage) {
    return (
      <View
        style={{
          backgroundColor: COLORS.surface,
          borderRadius: 16,
          overflow: "hidden",
          borderWidth: 0.5,
          borderColor: COLORS.border,
        }}
      >
        <Image
          source={{ uri: entry.photo_url! }}
          style={{
            width: "100%",
            height: 220,
            backgroundColor: COLORS.border,
          }}
          resizeMode="cover"
        />

        <View style={{ padding: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: COLORS.textPrimary,
                  fontSize: 16,
                  fontWeight: "600",
                  lineHeight: 22,
                }}
              >
                {entry.title}
              </Text>
              {category && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 8,
                    gap: 6,
                  }}
                >
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: category.color,
                    }}
                  />
                  <Text
                    style={{
                      color: COLORS.textSecondary,
                      fontSize: 12,
                      fontWeight: "500",
                      letterSpacing: 0.3,
                      textTransform: "uppercase",
                    }}
                  >
                    {category.name}
                  </Text>
                </View>
              )}
              {showDate && (
                <Text
                  style={{
                    color: COLORS.textSecondary,
                    fontSize: 12,
                    marginTop: 4,
                  }}
                >
                  {formatEntryDate(entry.date)}
                </Text>
              )}
            </View>
            <Pressable
              onPress={() => onDelete(entry.id, entry.photo_url)}
              hitSlop={10}
              style={{
                padding: 6,
                marginTop: -2,
                marginRight: -4,
              }}
            >
              <Ionicons
                name="trash-outline"
                size={16}
                color={COLORS.textSecondary}
              />
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderWidth: 0.5,
        borderColor: COLORS.border,
      }}
    >
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: category?.color ?? COLORS.textSecondary,
          marginRight: 12,
        }}
      />
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: COLORS.textPrimary,
            fontSize: 15,
            fontWeight: "500",
          }}
        >
          {entry.title}
        </Text>
        {category && (
          <Text
            style={{
              color: COLORS.textSecondary,
              fontSize: 12,
              marginTop: 3,
              letterSpacing: 0.2,
            }}
          >
            {category.name}
          </Text>
        )}
        {showDate && (
          <Text
            style={{
              color: COLORS.textSecondary,
              fontSize: 12,
              marginTop: 2,
            }}
          >
            {formatEntryDate(entry.date)}
          </Text>
        )}
      </View>
      <Pressable
        onPress={() => onDelete(entry.id, entry.photo_url)}
        hitSlop={10}
        style={{ padding: 4 }}
      >
        <Ionicons
          name="trash-outline"
          size={16}
          color={COLORS.textSecondary}
        />
      </Pressable>
    </View>
  );
}
