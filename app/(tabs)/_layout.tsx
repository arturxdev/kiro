import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "@/constants/colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.tabBar,
          borderTopColor: COLORS.border,
        },
        tabBarActiveTintColor: COLORS.tabIconActive,
        tabBarInactiveTintColor: COLORS.tabIconInactive,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Calendario",
          tabBarIcon: ({ color, size }) => (
            <Feather name="grid" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: "Diario",
          tabBarIcon: ({ color, size }) => (
            <Feather name="book-open" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Config",
          tabBarIcon: ({ color, size }) => (
            <Feather name="sliders" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
