import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import * as authService from "@/services/auth.service";
import { colors, spacing, radius } from "@/lib/theme";

type ScreenState = "loading" | "form" | "success" | "error";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    code?: string;
    error?: string;
    error_code?: string;
    error_description?: string;
  }>();

  const [screenState, setScreenState] = useState<ScreenState>("loading");
  const [sessionError, setSessionError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const exchanged = useRef(false);

  useEffect(() => {
    // Prevent double-exchange on re-renders
    if (exchanged.current) return;
    exchanged.current = true;

    // Supabase sent an error in the redirect (e.g. expired OTP)
    if (params.error) {
      const desc = params.error_description?.replace(/\+/g, " ") || params.error;
      setSessionError(
        params.error_code === "otp_expired"
          ? "This reset link has expired. Please request a new one."
          : desc,
      );
      setScreenState("error");
      return;
    }

    // PKCE flow: exchange the auth code for a session
    if (params.code) {
      supabase.auth
        .exchangeCodeForSession(params.code)
        .then(({ error: exchangeError }) => {
          if (exchangeError) {
            setSessionError(exchangeError.message);
            setScreenState("error");
          } else {
            setScreenState("form");
          }
        });
      return;
    }

    // No code and no error — invalid link
    setSessionError("Invalid or missing reset link. Please request a new one.");
    setScreenState("error");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReset = async () => {
    if (!password) {
      setError("Please enter a new password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await authService.updatePassword(password);
      setScreenState("success");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => router.replace("/(auth)/login");

  if (screenState === "loading") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Verifying reset link...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (screenState === "error") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorTitle}>Link Invalid</Text>
          <Text style={styles.errorSubtitle}>{sessionError}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={goToLogin}>
            <Text style={styles.primaryBtnText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (screenState === "success") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Ionicons name="checkmark-circle-outline" size={48} color={colors.accent} />
          <Text style={styles.title}>Password updated</Text>
          <Text style={styles.subtitle}>
            Your password has been reset successfully. You're now signed in.
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.replace("/(tabs)")}
          >
            <Text style={styles.primaryBtnText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Set new password</Text>
          <Text style={styles.subtitle}>
            Enter your new password below. Must be at least 6 characters.
          </Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="New password"
              placeholderTextColor={colors.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
              autoFocus
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm new password"
              placeholderTextColor={colors.muted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoComplete="new-password"
            />

            {!!error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.dimmed]}
              onPress={handleReset}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.bg} />
              ) : (
                <Text style={styles.primaryBtnText}>Reset Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    color: colors.muted,
    lineHeight: 22,
    marginBottom: spacing.xl,
    textAlign: "center",
  },
  form: { gap: spacing.md },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 15,
    color: colors.text,
    fontSize: 16,
  },
  error: { color: colors.error, fontSize: 14 },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 16,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  primaryBtnText: { color: colors.bg, fontSize: 16, fontWeight: "700" },
  dimmed: { opacity: 0.45 },
  loadingText: { color: colors.muted, fontSize: 15, marginTop: spacing.md },
  errorTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
  },
  errorSubtitle: {
    fontSize: 15,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 22,
  },
});
