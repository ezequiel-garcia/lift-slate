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
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import * as authService from "@/services/auth.service";
import { colors } from "@/lib/theme";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError(t("forgot_password.error_email_required"));
      return;
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      setError(t("forgot_password.error_email_invalid"));
      return;
    }

    setError("");
    setLoading(true);
    try {
      await authService.resetPassword(trimmed);
      setSent(true);
    } catch (e: unknown) {
      setError(t("common.error_generic"));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <ScrollView contentContainerClassName="flex-grow px-6 pt-6 pb-8">
          <Pressable className="mb-8" onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </Pressable>

          <View className="items-center mt-12 gap-4">
            <Ionicons name="mail-outline" size={48} color={colors.accent} />
            <Text className="text-[28px] font-extrabold text-foreground">
              {t("forgot_password.sent_title")}
            </Text>
            <Text className="text-[15px] text-muted text-center leading-relaxed">
              {t("forgot_password.sent_description")}
              {"\n"}
              <Text className="text-foreground font-semibold">
                {email.trim().toLowerCase()}
              </Text>
            </Text>
            <Text className="text-sm text-muted text-center leading-5 mt-2">
              {t("forgot_password.sent_hint")}
            </Text>

            <View className="mt-6 w-full gap-4">
              <Button
                label={t("forgot_password.send_again")}
                variant="secondary"
                onPress={() => {
                  setSent(false);
                  setError("");
                }}
              />
              <Pressable className="items-center" onPress={() => router.back()}>
                <Text className="text-accent text-sm font-semibold">
                  {t("forgot_password.back_to_sign_in")}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
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
          contentContainerClassName="flex-grow px-6 pt-6 pb-8"
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-row items-center justify-between mb-8">
            <Pressable onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={colors.foreground} />
            </Pressable>
            <LanguageSwitcher />
          </View>

          <Text className="text-[28px] font-extrabold text-foreground mb-2">
            {t("forgot_password.title")}
          </Text>
          <Text className="text-[15px] text-muted leading-relaxed mb-8">
            {t("forgot_password.description")}
          </Text>

          <View className="gap-4">
            <Input
              placeholder={t("auth.email")}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              autoFocus
              error={error || undefined}
            />

            <Button
              label={t("forgot_password.send_button")}
              onPress={handleSend}
              loading={loading}
              disabled={loading}
            />
          </View>

          <Pressable
            className="items-center mt-6"
            onPress={() => router.back()}
          >
            <Text className="text-accent text-sm font-semibold">
              {t("forgot_password.back_to_sign_in")}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
