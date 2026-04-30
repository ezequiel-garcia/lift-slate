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
import * as authService from "@/services/auth.service";
import { colors } from "@/lib/theme";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

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
      setError("Something went wrong. Please try again.");
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
              Check your email
            </Text>
            <Text className="text-[15px] text-muted text-center leading-relaxed">
              We sent a password reset link to{"\n"}
              <Text className="text-foreground font-semibold">
                {email.trim().toLowerCase()}
              </Text>
            </Text>
            <Text className="text-sm text-muted text-center leading-5 mt-2">
              Tap the link in the email to reset your password. The link will
              open the app directly.
            </Text>

            <View className="mt-6 w-full gap-4">
              <Button
                label="Send again"
                variant="secondary"
                onPress={() => {
                  setSent(false);
                  setError("");
                }}
              />
              <Pressable className="items-center" onPress={() => router.back()}>
                <Text className="text-accent text-sm font-semibold">
                  Back to Sign In
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
          <Pressable className="mb-8" onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </Pressable>

          <Text className="text-[28px] font-extrabold text-foreground mb-2">
            Reset password
          </Text>
          <Text className="text-[15px] text-muted leading-relaxed mb-8">
            Enter your email and we&apos;ll send you a link to reset your
            password.
          </Text>

          <View className="gap-4">
            <Input
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              autoFocus
              error={error || undefined}
            />

            <Button
              label="Send Reset Link"
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
              Back to Sign In
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
