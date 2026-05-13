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
import { useTranslation } from "react-i18next";
import * as authService from "@/services/auth.service";
import * as profileService from "@/services/profile.service";
import { useAppStore } from "@/stores/appStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { AppleIcon } from "@/components/ui/AppleIcon";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

const GOOGLE_CONFIGURED = !!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const APPLE_AVAILABLE = Platform.OS === "ios";

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pendingInviteToken = useAppStore((s) => s.pendingInviteToken);
  const clearPendingInviteToken = useAppStore((s) => s.clearPendingInviteToken);

  function getPostLoginRoute(hasDisplayName: boolean) {
    if (pendingInviteToken) {
      clearPendingInviteToken();
      return `/gym/join?token=${pendingInviteToken}` as const;
    }
    return hasDisplayName ? "/(tabs)" : "/(auth)/onboarding";
  }

  const handleAppleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await authService.signInWithApple();
      if (!result) return;
      const profile = await profileService.getProfile();
      router.replace(getPostLoginRoute(!!profile.display_name));
    } catch (e: unknown) {
      if ((e as { code?: string })?.code === "ERR_CANCELED") return;
      setError(t("auth.error_apple"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await authService.signInWithGoogle();
      if (!result) return;
      const profile = await profileService.getProfile();
      router.replace(getPostLoginRoute(!!profile.display_name));
    } catch (e: unknown) {
      setError(t("auth.error_google"));
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      setError(t("auth.error_email_password"));
      return;
    }
    setError("");
    setLoading(true);
    try {
      await authService.signIn(email, password);
      const profile = await profileService.getProfile();
      router.replace(getPostLoginRoute(!!profile.display_name));
    } catch (e: unknown) {
      setError(t("auth.error_credentials"));
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
          {/* Language switcher */}
          <View className="items-end mb-2">
            <LanguageSwitcher />
          </View>

          {/* Logo */}
          <View className="items-center mb-14">
            <Text
              className="text-[52px] font-extrabold text-accent"
              style={{ letterSpacing: -2 }}
            >
              LS
            </Text>
            <Text
              className="text-caption uppercase text-muted"
              style={{ letterSpacing: 7, marginTop: 2 }}
            >
              LIFTSLATE
            </Text>
          </View>

          {/* Form */}
          <View className="gap-4">
            <Input
              placeholder={t("auth.email")}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <Input
              placeholder={t("auth.password")}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="current-password"
            />

            {!!error && <Text className="text-error text-sm">{error}</Text>}

            <View className="items-end">
              <Link href="/(auth)/forgot-password" asChild>
                <Pressable hitSlop={8}>
                  <Text className="text-accent text-sm font-semibold">
                    {t("auth.forgot_password")}
                  </Text>
                </Pressable>
              </Link>
            </View>

            <Button
              label={t("auth.sign_in")}
              onPress={handleSignIn}
              loading={loading}
              disabled={loading}
            />
          </View>

          {(GOOGLE_CONFIGURED || APPLE_AVAILABLE) && (
            <>
              <View className="flex-row items-center my-8 gap-4">
                <View className="flex-1 h-px bg-border" />
                <Text className="text-muted text-caption">{t("auth.or")}</Text>
                <View className="flex-1 h-px bg-border" />
              </View>
              <View className="gap-3">
                {GOOGLE_CONFIGURED && (
                  <Button
                    label={t("auth.continue_google")}
                    variant="secondary"
                    onPress={handleGoogleSignIn}
                    disabled={loading}
                    icon={<GoogleIcon size={20} />}
                  />
                )}
                {APPLE_AVAILABLE && (
                  <Button
                    label={t("auth.continue_apple")}
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
              {t("auth.no_account")}{" "}
            </Text>
            <Link href="/(auth)/signup" asChild>
              <Pressable hitSlop={8}>
                <Text className="text-accent text-subtext font-semibold">
                  {t("auth.sign_up_link")}
                </Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
