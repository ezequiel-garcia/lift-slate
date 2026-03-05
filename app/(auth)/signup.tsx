import { useState, useEffect } from "react";
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
import { Link, useRouter } from "expo-router";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import * as authService from "@/services/auth.service";
import * as profileService from "@/services/profile.service";
import { colors, spacing, radius } from "@/lib/theme";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const GOOGLE_IOS = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const GOOGLE_ANDROID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const GOOGLE_CONFIGURED = !!(GOOGLE_WEB || GOOGLE_IOS || GOOGLE_ANDROID);

function GoogleButton({
  onSuccess,
  onError,
  disabled,
}: {
  onSuccess: (idToken: string) => void;
  onError: (msg: string) => void;
  disabled: boolean;
}) {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: GOOGLE_WEB,
    iosClientId: GOOGLE_IOS,
    androidClientId: GOOGLE_ANDROID,
  });

  useEffect(() => {
    if (response?.type !== "success") return;
    const idToken = response.params.id_token;
    if (idToken) onSuccess(idToken);
  }, [response]);

  return (
    <TouchableOpacity
      style={[styles.socialBtn, (!request || disabled) && styles.dimmed]}
      onPress={() => promptAsync()}
      disabled={!request || disabled}
    >
      <Text style={styles.socialBtnText}>Continue with Google</Text>
    </TouchableOpacity>
  );
}

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSuccess = (idToken: string) => {
    setLoading(true);
    authService
      .signInWithGoogle(idToken)
      .then(() => profileService.getProfile())
      .then((profile) => {
        router.replace(profile.display_name ? "/(tabs)" : "/(auth)/onboarding");
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  const handleSignUp = async () => {
    if (!email || !password || !confirm) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const result = await authService.signUp(email, password);
      if (!result.session) {
        // Email confirmation is enabled — user must verify before continuing
        setError(
          "Check your inbox and confirm your email, then sign in to continue."
        );
        return;
      }
      router.replace("/(auth)/onboarding");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Sign up failed.");
    } finally {
      setLoading(false);
    }
  };

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
          <View style={styles.header}>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>
              Start tracking your lifts today.
            </Text>
          </View>

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
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm password"
              placeholderTextColor={colors.muted}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              autoComplete="new-password"
            />

            {!!error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.dimmed]}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.bg} />
              ) : (
                <Text style={styles.primaryBtnText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          {GOOGLE_CONFIGURED && (
            <>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerLabel}>or</Text>
                <View style={styles.dividerLine} />
              </View>
              <GoogleButton
                onSuccess={handleGoogleSuccess}
                onError={setError}
                disabled={loading}
              />
            </>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Sign in</Text>
              </TouchableOpacity>
            </Link>
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
  header: { marginBottom: spacing.xl },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 16, color: colors.muted, marginTop: spacing.sm },
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
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.xl,
    gap: spacing.md,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerLabel: { color: colors.muted, fontSize: 13 },
  socialBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: "center",
  },
  socialBtnText: { color: colors.text, fontSize: 16, fontWeight: "600" },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.xl,
  },
  footerText: { color: colors.muted, fontSize: 14 },
  footerLink: { color: colors.accent, fontSize: 14, fontWeight: "600" },
});
