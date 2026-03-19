import { useState, useEffect } from "react";
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
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import * as authService from "@/services/auth.service";
import * as profileService from "@/services/profile.service";
import { useAppStore } from "@/stores/appStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

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
    <Button
      label="Continue with Google"
      variant="secondary"
      onPress={() => promptAsync()}
      disabled={!request || disabled}
    />
  );
}

export default function LoginScreen() {
  const router = useRouter();
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

  const handleGoogleSuccess = (idToken: string) => {
    setLoading(true);
    authService
      .signInWithGoogle(idToken)
      .then(() => profileService.getProfile())
      .then((profile) => {
        router.replace(getPostLoginRoute(!!profile.display_name));
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await authService.signIn(email, password);
      const profile = await profileService.getProfile();
      router.replace(getPostLoginRoute(!!profile.display_name));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Sign in failed.");
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
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View className="items-center mb-14">
            <Text className="text-[52px] font-extrabold text-accent" style={{ letterSpacing: -2 }}>
              LS
            </Text>
            <Text className="text-caption uppercase text-muted" style={{ letterSpacing: 7, marginTop: 2 }}>
              LIFTSLATE
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
              autoComplete="current-password"
            />

            {!!error && <Text className="text-error text-sm">{error}</Text>}

            <View className="items-end">
              <Link href="/(auth)/forgot-password" asChild>
                <Pressable hitSlop={8}>
                  <Text className="text-accent text-sm font-semibold">Forgot password?</Text>
                </Pressable>
              </Link>
            </View>

            <Button
              label="Sign In"
              onPress={handleSignIn}
              loading={loading}
              disabled={loading}
            />
          </View>

          {GOOGLE_CONFIGURED && (
            <>
              <View className="flex-row items-center my-8 gap-4">
                <View className="flex-1 h-px bg-border" />
                <Text className="text-muted text-caption">or</Text>
                <View className="flex-1 h-px bg-border" />
              </View>
              <GoogleButton
                onSuccess={handleGoogleSuccess}
                onError={setError}
                disabled={loading}
              />
            </>
          )}

          <View className="flex-row justify-center mt-8">
            <Text className="text-muted text-subtext">Don't have an account? </Text>
            <Link href="/(auth)/signup" asChild>
              <Pressable hitSlop={8}>
                <Text className="text-accent text-subtext font-semibold">Sign up</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
