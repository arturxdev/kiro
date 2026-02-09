import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSignIn } from "@clerk/clerk-expo";
import { COLORS } from "@/constants/colors";

export default function SignInEmailScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSignIn = useCallback(async () => {
    if (!isLoaded) return;

    setLoading(true);
    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
      } else {
        console.error("Sign-in incomplete:", JSON.stringify(result, null, 2));
      }
    } catch (err: any) {
      const message =
        err.errors?.[0]?.longMessage || "Error al iniciar sesión";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, signIn, setActive, email, password]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Iniciar sesión</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="tu@email.com"
          placeholderTextColor={COLORS.textSecondary}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />

        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor={COLORS.textSecondary}
          secureTextEntry
        />

        <TouchableOpacity
          style={[
            styles.button,
            (!email || !password || loading) && styles.buttonDisabled,
          ]}
          onPress={onSignIn}
          disabled={!email || !password || loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Cargando..." : "Iniciar sesión"}
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿No tienes cuenta? </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/sign-up")}>
            <Text style={styles.footerLink}>Crear cuenta</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.backLink}
          onPress={() => router.back()}
        >
          <Text style={styles.backLinkText}>← Volver</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 32,
    textAlign: "center",
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.textPrimary,
    fontSize: 16,
  },
  button: {
    backgroundColor: COLORS.textPrimary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  footerLink: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  backLink: {
    alignItems: "center",
    marginTop: 24,
  },
  backLinkText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});
