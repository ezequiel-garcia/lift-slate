import { useState } from "react";
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
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as authService from "@/services/auth.service";
import { colors, spacing, radius } from "@/lib/theme";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError("Please enter your email.");
      return;
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await authService.resetPassword(trimmed);
      setSent(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <TouchableOpacity style={styles.back} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.sentContainer}>
            <Ionicons name="mail-outline" size={48} color={colors.accent} />
            <Text style={styles.title}>Check your email</Text>
            <Text style={styles.subtitle}>
              We sent a password reset link to{"\n"}
              <Text style={styles.emailHighlight}>{email.trim().toLowerCase()}</Text>
            </Text>
            <Text style={styles.hint}>
              Tap the link in the email to reset your password. The link will open the app directly.
            </Text>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => {
                setSent(false);
                setError("");
              }}
            >
              <Text style={styles.secondaryBtnText}>Send again</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.textBtn} onPress={() => router.back()}>
              <Text style={styles.textBtnText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
          <TouchableOpacity style={styles.back} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.title}>Reset password</Text>
          <Text style={styles.subtitle}>
            Enter your email and we'll send you a link to reset your password.
          </Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.muted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              autoFocus
            />

            {!!error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.dimmed]}
              onPress={handleSend}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.bg} />
              ) : (
                <Text style={styles.primaryBtnText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.textBtn} onPress={() => router.back()}>
            <Text style={styles.textBtnText}>Back to Sign In</Text>
          </TouchableOpacity>
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  back: { marginBottom: spacing.xl },
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
    alignItems: "center",
    marginTop: spacing.sm,
  },
  primaryBtnText: { color: colors.bg, fontSize: 16, fontWeight: "700" },
  dimmed: { opacity: 0.45 },
  sentContainer: { alignItems: "center", marginTop: spacing.xxl, gap: spacing.md },
  emailHighlight: { color: colors.text, fontWeight: "600" },
  hint: {
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  secondaryBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  secondaryBtnText: { color: colors.text, fontSize: 16, fontWeight: "600" },
  textBtn: { alignItems: "center", marginTop: spacing.lg },
  textBtnText: { color: colors.accent, fontSize: 14, fontWeight: "600" },
});
