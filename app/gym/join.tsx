import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "@/lib/theme";
import {
  useGymPreviewByToken,
  useGymPreviewByTempCode,
  useJoinGymByToken,
  useJoinGymByTempCode,
} from "@/hooks/useInvite";
import { GymPreview } from "@/services/invite.service";
import { useAuth } from "@/hooks/useAuth";
import { useAppStore } from "@/stores/appStore";
import { Button } from "@/components/ui/Button";

export default function JoinGymScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const { session, isLoading: authLoading } = useAuth();
  const setPendingInviteToken = useAppStore((s) => s.setPendingInviteToken);
  const [code, setCode] = useState("");

  const tokenQuery = useGymPreviewByToken(!authLoading && !!session ? token : undefined);
  const codeQuery = useGymPreviewByTempCode(!authLoading && !!session && code.length === 8 ? code : undefined);
  const { mutate: joinByToken, isPending: joiningByToken } = useJoinGymByToken();
  const { mutate: joinByCode, isPending: joiningByCode } = useJoinGymByTempCode();

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      if (token) setPendingInviteToken(token);
      router.replace("/(auth)/login");
    }
  }, [authLoading, session]);

  if (authLoading || !session) {
    return (
      <SafeAreaView className="flex-1 bg-bg justify-center items-center">
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  const joining = joiningByToken || joiningByCode;

  const activePreview: GymPreview | undefined = token ? tokenQuery.data : codeQuery.data;
  const previewError = token ? tokenQuery.error : code.length === 8 ? codeQuery.error : null;
  const previewLoading = token ? tokenQuery.isLoading : codeQuery.isLoading && code.length === 8;

  function onJoinSuccess() {
    router.replace("/(tabs)/gym");
  }

  function onJoinError(e: Error) {
    const msg = e.message.toLowerCase();
    if (msg.includes("already")) {
      Alert.alert("Already a Member", "You're already in a gym. Leave it first to join another.");
    } else if (msg.includes("limit") || msg.includes("full")) {
      Alert.alert("Gym is Full", "This gym has reached its member limit.");
    } else {
      Alert.alert("Error", e.message);
    }
  }

  function handleJoin() {
    if (token && tokenQuery.data) {
      joinByToken(token, { onSuccess: onJoinSuccess, onError: onJoinError });
    } else if (code.length === 8 && codeQuery.data) {
      joinByCode(code, { onSuccess: onJoinSuccess, onError: onJoinError });
    }
  }

  function handleCodeChange(text: string) {
    setCode(text.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8));
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center px-4 pt-2 pb-1">
          <Pressable
            onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/gym")}
            className="w-10 h-10 items-center justify-center -ml-1"
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Ionicons name="chevron-back" size={24} color={colors.foreground} />
          </Pressable>
          <Text className="text-foreground text-xl font-bold ml-1">Join a Gym</Text>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Deep link banner */}
          {token && (
            <View className="bg-surface2 rounded-2xl px-4 py-3 flex-row items-center gap-3 mb-6">
              <Ionicons name="link" size={18} color={colors.accent} />
              <Text className="text-muted text-caption flex-1">
                You opened an invite link
              </Text>
            </View>
          )}

          {/* Code entry */}
          {!token && (
            <View className="mb-6">
              <Text className="text-label uppercase tracking-wider text-muted mb-2">
                Enter Invite Code
              </Text>
              <TextInput
                className="bg-surface rounded-2xl px-5 text-foreground text-[28px] font-bold tracking-[6px] text-center py-5"
                value={code}
                onChangeText={handleCodeChange}
                placeholder="XXXXXXXX"
                placeholderTextColor={colors.border}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={8}
                returnKeyType="done"
              />
              <Text className="text-muted text-caption text-center mt-2">
                8-character code from your coach or gym admin
              </Text>
            </View>
          )}

          {/* Gym preview card */}
          {previewLoading && (
            <View className="bg-surface rounded-2xl p-6 items-center">
              <ActivityIndicator color={colors.accent} />
            </View>
          )}

          {previewError && !previewLoading && (
            <View className="bg-surface rounded-2xl px-4 py-5 flex-row items-center gap-3">
              <Ionicons name="alert-circle-outline" size={20} color={colors.error} />
              <Text className="text-error text-subtext flex-1">
                {previewError.message?.toLowerCase().includes("too many")
                  ? "Too many attempts. Please wait 15 minutes before trying again."
                  : token
                  ? "Invalid or expired invite link."
                  : "Invalid or expired code."}
              </Text>
            </View>
          )}

          {activePreview && !previewLoading && (
            <View className="bg-surface rounded-2xl overflow-hidden">
              <View className="px-4 py-5">
                <View className="flex-row items-center gap-3 mb-3">
                  <View className="w-12 h-12 rounded-xl bg-surface2 items-center justify-center">
                    <Ionicons name="fitness" size={24} color={colors.accent} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-foreground text-heading font-bold">
                      {activePreview.name}
                    </Text>
                    <Text className="text-muted text-caption">
                      {activePreview.member_count} member{activePreview.member_count !== 1 ? "s" : ""}
                    </Text>
                  </View>
                </View>

                {activePreview.description && (
                  <Text className="text-muted text-subtext leading-relaxed mb-4">
                    {activePreview.description}
                  </Text>
                )}

                <Button
                  label={`Join ${activePreview.name}`}
                  onPress={handleJoin}
                  loading={joining}
                  disabled={joining}
                />
              </View>
            </View>
          )}

          {/* Alternative method hint */}
          {!token && (
            <View className="mt-8 items-center gap-3">
              <Text className="text-muted text-caption text-center">
                Have an invite link? Ask your coach to share it — it will open this screen automatically.
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
