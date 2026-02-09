import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { COLORS } from "@/constants/colors";
import { FONTS } from "@/constants/fonts";

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();

  const handleSignOut = () => {
    Alert.alert("Cerrar sesión", "¿Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar sesión",
        style: "destructive",
        onPress: () => signOut(),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.heading}>Settings</Text>

        <View style={styles.userCard}>
          <Text style={styles.userLabel}>Cuenta</Text>
          <Text style={styles.userEmail}>
            {user?.primaryEmailAddress?.emailAddress ?? "—"}
          </Text>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  heading: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: 32,
  },
  userCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
  },
  userLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  userEmail: {
    color: COLORS.textPrimary,
    fontSize: 16,
  },
  signOutButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  signOutText: {
    color: COLORS.danger,
    fontSize: 16,
    fontFamily: FONTS.semibold,
  },
});
