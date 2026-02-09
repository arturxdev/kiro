import React, { useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useOAuth, useSignInWithApple } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { COLORS } from "@/constants/colors";

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const router = useRouter();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const { startAppleAuthenticationFlow } = useSignInWithApple();

  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL("/(tabs)", { scheme: "mementomori" }),
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (err) {
      console.error("Google sign-in error:", JSON.stringify(err, null, 2));
    }
  }, [startOAuthFlow]);

  const handleAppleSignIn = useCallback(async () => {
    try {
      const { createdSessionId, setActive } =
        await startAppleAuthenticationFlow();

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (err: any) {
      if (err.code === "ERR_REQUEST_CANCELED") return;
      console.error("Apple sign-in error:", JSON.stringify(err, null, 2));
    }
  }, [startAppleAuthenticationFlow]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Memento Mori</Text>
        <Text style={styles.subtitle}>
          Haz que cada día cuente.
        </Text>
      </View>

      <View style={styles.buttons}>
        {Platform.OS === "ios" && (
          <TouchableOpacity
            style={styles.appleButton}
            onPress={handleAppleSignIn}
          >
            <Text style={styles.appleButtonText}> Sign in with Apple</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleSignIn}
        >
          <Text style={styles.googleButtonText}>Sign in with Google</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>o</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.emailLink}
          onPress={() => router.push("/(auth)/sign-in-email")}
        >
          <Text style={styles.emailLinkText}>Iniciar sesión con email</Text>
        </TouchableOpacity>

        <View style={styles.signUpRow}>
          <Text style={styles.signUpText}>¿No tienes cuenta? </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/sign-up")}>
            <Text style={styles.signUpLink}>Crear cuenta</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  buttons: {
    gap: 12,
  },
  appleButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  appleButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
  googleButton: {
    backgroundColor: COLORS.surface,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  googleButtonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: 12,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  emailLink: {
    alignItems: "center",
    paddingVertical: 14,
  },
  emailLinkText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    textDecorationLine: "underline",
  },
  signUpRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  signUpText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  signUpLink: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
});
