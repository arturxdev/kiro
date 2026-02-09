import React, { useState } from "react";
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
import { useSignUp } from "@clerk/clerk-expo";
import { COLORS } from "@/constants/colors";
import { FONTS } from "@/constants/fonts";

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSignUp = async () => {
    if (!isLoaded) return;

    setLoading(true);
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      const message = err.errors?.[0]?.longMessage || "Error al crear cuenta";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async () => {
    if (!isLoaded) return;

    setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
      } else {
        console.error(
          "Verification incomplete:",
          JSON.stringify(result, null, 2)
        );
      }
    } catch (err: any) {
      const message =
        err.errors?.[0]?.longMessage || "Código de verificación inválido";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.inner}>
          <Text style={styles.title}>Verifica tu email</Text>
          <Text style={styles.description}>
            Enviamos un código de verificación a {email}
          </Text>

          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            placeholder="Código de verificación"
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="number-pad"
          />

          <TouchableOpacity
            style={[styles.button, (!code || loading) && styles.buttonDisabled]}
            onPress={onVerify}
            disabled={!code || loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Verificando..." : "Verificar"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backLink}
            onPress={() => setPendingVerification(false)}
          >
            <Text style={styles.backLinkText}>← Volver</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Crear cuenta</Text>

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
          onPress={onSignUp}
          disabled={!email || !password || loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
          <TouchableOpacity
            onPress={() => router.push("/(auth)/sign-in-email")}
          >
            <Text style={styles.footerLink}>Iniciar sesión</Text>
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
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: 32,
    textAlign: "center",
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
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
    fontFamily: FONTS.semibold,
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
    fontFamily: FONTS.semibold,
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
