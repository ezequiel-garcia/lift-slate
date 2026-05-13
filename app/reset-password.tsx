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
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import * as authService from "@/services/auth.service";
import { colors } from "@/lib/theme";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type ScreenState = "loading" | "form" | "success" | "error";

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
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
          ? t("reset_password.link_expired")
          : desc,
      );
      setScreenState("error");
      return;
    }

    const code = Array.isArray(params.code) ? params.code[0] : params.code;

    if (code) {
      supabase.auth
        .exchangeCodeForSession(code)
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

    setSessionError(t("reset_password.link_missing"));
    setScreenState("error");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReset = async () => {
    if (!password) {
      setError(t("reset_password.error_password_required"));
      return;
    }
    if (password.length < 8) {
      setError(t("reset_password.error_password_length"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("reset_password.error_passwords_match"));
      return;
    }

    setError("");
    setLoading(true);
    try {
      await authService.updatePassword(password);
      setScreenState("success");
    } catch (e: unknown) {
      setError(t("reset_password.error_update"));
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => router.replace("/(auth)/login");

  if (screenState === "loading") {
    return (
      <SafeAreaView className="flex-1 bg-bg justify-center items-center gap-4">
        <ActivityIndicator size="large" color={colors.accent} />
        <Text className="text-muted text-[15px]">
          {t("reset_password.verifying")}
        </Text>
      </SafeAreaView>
    );
  }

  if (screenState === "error") {
    return (
      <SafeAreaView className="flex-1 bg-bg justify-center items-center px-6 gap-4">
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text className="text-[22px] font-bold text-foreground">
          {t("reset_password.link_invalid")}
        </Text>
        <Text className="text-[15px] text-muted text-center leading-relaxed">
          {sessionError}
        </Text>
        <Button
          label={t("reset_password.back_to_sign_in")}
          onPress={goToLogin}
        />
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
          {t("reset_password.success_title")}
        </Text>
        <Text className="text-[15px] text-muted text-center leading-relaxed">
          {t("reset_password.success_description")}
        </Text>
        <Button
          label={t("reset_password.continue")}
          onPress={() => router.replace("/(tabs)")}
        />
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
            {t("reset_password.title")}
          </Text>
          <Text className="text-[15px] text-muted leading-relaxed mb-8">
            {t("reset_password.description")}
          </Text>

          <View className="gap-4">
            <Input
              placeholder={t("reset_password.new_password_placeholder")}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
              autoFocus
            />
            <Input
              placeholder={t("reset_password.confirm_password_placeholder")}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoComplete="new-password"
            />

            {!!error && <Text className="text-error text-sm">{error}</Text>}

            <Button
              label={t("reset_password.reset_button")}
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
