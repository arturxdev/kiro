import { View, Text, Pressable } from "react-native";

interface CategoryPillProps {
  name: string;
  color: string;
  isActive?: boolean;
  onPress?: () => void;
}

export function CategoryPill({ name, color, isActive, onPress }: CategoryPillProps) {
  const content = (
    <View
      className="flex-row items-center rounded-full px-3 py-1 mr-2"
      style={{
        backgroundColor: isActive ? "#2A2A2A" : "#1A1A1A",
        borderWidth: isActive ? 1 : 0,
        borderColor: isActive ? color : "transparent",
      }}
    >
      <View
        className="w-2.5 h-2.5 rounded-full mr-1.5"
        style={{ backgroundColor: color }}
      />
      <Text
        className="text-xs"
        style={{ color: isActive ? "#FFFFFF" : "#A0A0A0" }}
      >
        {name}
      </Text>
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }

  return content;
}
