import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Trash2, Crown } from "lucide-react-native";
import { useDB } from "@/db/DatabaseProvider";
import { useRevenueCat } from "@/providers/RevenueCatProvider";
import { useEntryLimit } from "@/hooks/useEntryLimit";
import { COLORS } from "@/constants/colors";
import { FONTS } from "@/constants/fonts";

const WORKER_URL = (process.env.EXPO_PUBLIC_CLOUDFLARE_WORKER_URL ?? "").replace(/\/+$/, "");

export default function SettingsScreen() {
  const { signOut, getToken } = useAuth();
  const { user } = useUser();
  const db = useDB();
  const { isPro, showPaywall, showCustomerCenter, restorePurchases } = useRevenueCat();
  const { totalEntries, FREE_LIMIT } = useEntryLimit();
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const handleSignOut = () => {
    Alert.alert("Cerrar sesión", "¿Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar sesión",
        style: "destructive",
        onPress: async () => {
          await db.execAsync(`
            DELETE FROM day_entry;
            DELETE FROM category;
            DELETE FROM config;
          `);
          signOut();
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Eliminar cuenta",
      "Esta acción es irreversible. Se eliminarán todos tus datos, fotos y entradas. ¿Estás seguro?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar cuenta",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Confirmar eliminación",
              "¿Realmente deseas eliminar tu cuenta permanentemente?",
              [
                { text: "Cancelar", style: "cancel" },
                {
                  text: "Sí, eliminar",
                  style: "destructive",
                  onPress: performDeleteAccount,
                },
              ]
            );
          },
        },
      ]
    );
  };

  const performDeleteAccount = async () => {
    setDeleting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("No auth token");

      // 1. Delete server-side data (R2 images + Neon DB)
      const res = await fetch(`${WORKER_URL}/account`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Error al eliminar datos del servidor");
      }

      // 2. Clear local SQLite database
      await db.execAsync(`
        DELETE FROM day_entry;
        DELETE FROM category;
        DELETE FROM config;
      `);

      // 3. Delete Clerk user account (triggers automatic sign out)
      await user?.delete();
    } catch (err) {
      setDeleting(false);
      const message = err instanceof Error ? err.message : "Error desconocido";
      Alert.alert("Error", `No se pudo eliminar la cuenta: ${message}`);
    }
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

        {/* Subscription section */}
        <View style={styles.subscriptionCard}>
          <View style={styles.subscriptionHeader}>
            <Crown size={18} color={isPro ? "#FFD700" : COLORS.textSecondary} />
            <Text style={styles.subscriptionTitle}>
              {isPro ? "Plan Pro" : "Plan Gratuito"}
            </Text>
          </View>
          {!isPro && (
            <Text style={styles.subscriptionDetail}>
              {totalEntries}/{FREE_LIMIT} entradas usadas
            </Text>
          )}
        </View>

        {isPro ? (
          <TouchableOpacity
            style={styles.manageButton}
            onPress={() => showCustomerCenter()}
          >
            <Text style={styles.manageText}>Administrar suscripción</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => showPaywall()}
          >
            <Text style={styles.upgradeText}>Ser Pro</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.restoreButton}
          onPress={async () => {
            setRestoring(true);
            const restored = await restorePurchases();
            setRestoring(false);
            Alert.alert(
              restored ? "Compras restauradas" : "Sin compras",
              restored
                ? "Tu suscripción Pro ha sido restaurada."
                : "No se encontraron compras previas."
            );
          }}
          disabled={restoring}
        >
          {restoring ? (
            <ActivityIndicator color={COLORS.textSecondary} />
          ) : (
            <Text style={styles.restoreText}>Restaurar compras</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteAccount}
          disabled={deleting}
        >
          {deleting ? (
            <ActivityIndicator color={COLORS.danger} />
          ) : (
            <View style={styles.deleteButtonInner}>
              <Trash2 size={18} color={COLORS.danger} />
              <Text style={styles.deleteText}>Eliminar cuenta</Text>
            </View>
          )}
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
  subscriptionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  subscriptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  subscriptionTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontFamily: FONTS.semibold,
  },
  subscriptionDetail: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
    marginLeft: 26,
  },
  upgradeButton: {
    backgroundColor: "#FFD700",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 8,
  },
  upgradeText: {
    color: "#1A1A1A",
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  manageButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  manageText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontFamily: FONTS.semibold,
  },
  restoreButton: {
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    marginBottom: 24,
  },
  restoreText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textDecorationLine: "underline",
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
  deleteButton: {
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  deleteButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deleteText: {
    color: COLORS.danger,
    fontSize: 16,
    fontFamily: FONTS.semibold,
  },
});
