import { useState } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import * as authService from "@/services/auth.service";
import * as profileService from "@/services/profile.service";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { AppleIcon } from "@/components/ui/AppleIcon";

const GOOGLE_CONFIGURED = !!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const APPLE_AVAILABLE = Platform.OS === "ios";

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAppleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await authService.signInWithApple();
      if (!result) return;
      const profile = await profileService.getProfile();
      router.replace(profile.display_name ? "/(tabs)" : "/(auth)/onboarding");
    } catch (e: unknown) {
      if ((e as { code?: string })?.code === "ERR_CANCELED") return;
      setError(e instanceof Error ? e.message : "Apple sign in failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await authService.signInWithGoogle();
      if (!result) return; // user cancelled
      const profile = await profileService.getProfile();
      router.replace(profile.display_name ? "/(tabs)" : "/(auth)/onboarding");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Google sign in failed.");
    } finally {
      setLoading(false);
    }
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
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const result = await authService.signUp(email, password);
      if (!result.session) {
        setError(
          "Check your inbox and confirm your email, then sign in to continue.",
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
    <SafeAreaView className="flex-1 bg-bg">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingTop: 56,
            paddingBottom: 32,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="mb-8">
            <Text
              className="text-[30px] font-extrabold text-foreground"
              style={{ letterSpacing: -0.5 }}
            >
              Create account
            </Text>
            <Text className="text-body text-muted mt-2">
              Start tracking your lifts today.
            </Text>
          </View>

          {/* Form */}
          <View className="gap-4">
            <Input
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <Input
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
            />
            <Input
              placeholder="Confirm password"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              autoComplete="new-password"
            />

            {!!error && <Text className="text-error text-sm">{error}</Text>}

            <Button
              label="Create Account"
              onPress={handleSignUp}
              loading={loading}
              disabled={loading}
            />
          </View>

          {(GOOGLE_CONFIGURED || APPLE_AVAILABLE) && (
            <>
              <View className="flex-row items-center my-8 gap-4">
                <View className="flex-1 h-px bg-border" />
                <Text className="text-muted text-caption">or</Text>
                <View className="flex-1 h-px bg-border" />
              </View>
              <View className="gap-3">
                {GOOGLE_CONFIGURED && (
                  <Button
                    label="Continue with Google"
                    variant="secondary"
                    onPress={handleGoogleSignIn}
                    disabled={loading}
                    icon={<GoogleIcon size={20} />}
                  />
                )}
                {APPLE_AVAILABLE && (
                  <Button
                    label="Continue with Apple"
                    variant="apple"
                    onPress={handleAppleSignIn}
                    disabled={loading}
                    icon={<AppleIcon size={18} color="#fff" />}
                  />
                )}
              </View>
            </>
          )}

          <View className="flex-row justify-center mt-8">
            <Text className="text-muted text-subtext">
              Already have an account?{" "}
            </Text>
            <Link href="/(auth)/login" asChild>
              <Pressable hitSlop={8}>
                <Text className="text-accent text-subtext font-semibold">
                  Sign in
                </Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
