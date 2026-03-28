import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import * as authService from "@/services/auth.service";
import { colors } from "@/lib/theme";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

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
    if (exchanged.current) return;
    exchanged.current = true;

    if (params.error) {
      const desc =
        params.error_description?.replace(/\+/g, " ") || params.error;
      setSessionError(
        params.error_code === "otp_expired"
          ? "This reset link has expired. Please request a new one."
          : desc,
      );
      setScreenState("error");
      return;
    }

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

    setSessionError("Invalid or missing reset link. Please request a new one.");
    setScreenState("error");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReset = async () => {
    if (!password) {
      setError("Please enter a new password.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
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
      <SafeAreaView className="flex-1 bg-bg justify-center items-center gap-4">
        <ActivityIndicator size="large" color={colors.accent} />
        <Text className="text-muted text-[15px]">Verifying reset link...</Text>
      </SafeAreaView>
    );
  }

  if (screenState === "error") {
    return (
      <SafeAreaView className="flex-1 bg-bg justify-center items-center px-6 gap-4">
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text className="text-[22px] font-bold text-foreground">
          Link Invalid
        </Text>
        <Text className="text-[15px] text-muted text-center leading-relaxed">
          {sessionError}
        </Text>
        <Button label="Back to Sign In" onPress={goToLogin} />
      </SafeAreaView>
    );
  }

  if (screenState === "success") {
    return (
      <SafeAreaView className="flex-1 bg-bg justify-center items-center px-6 gap-4">
        <Ionicons
          name="checkmark-circle-outline"
          size={48}
          color={colors.accent}
        />
        <Text className="text-[28px] font-extrabold text-foreground">
          Password updated
        </Text>
        <Text className="text-[15px] text-muted text-center leading-relaxed">
          Your password has been reset successfully. You're now signed in.
        </Text>
        <Button label="Continue" onPress={() => router.replace("/(tabs)")} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow px-6 pt-12 pb-8"
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-[28px] font-extrabold text-foreground mb-2">
            Set new password
          </Text>
          <Text className="text-[15px] text-muted leading-relaxed mb-8">
            Enter your new password below. Must be at least 8 characters.
          </Text>

          <View className="gap-4">
            <Input
              placeholder="New password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
              autoFocus
            />
            <Input
              placeholder="Confirm new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoComplete="new-password"
            />

            {!!error && <Text className="text-error text-sm">{error}</Text>}

            <Button
              label="Reset Password"
              onPress={handleReset}
              loading={loading}
              disabled={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
