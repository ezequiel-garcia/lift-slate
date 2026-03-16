import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Share,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { format } from "date-fns";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { colors } from "@/lib/theme";
import {
  useMyGym,
  useUpdateGym,
  useDeleteGym,
  useGymMembers,
  useGymSubscription,
  useRegenerateInviteToken,
} from "@/hooks/useGym";
import { useGenerateTempCode } from "@/hooks/useInvite";
import { uploadGymLogo } from "@/services/storage.service";

const APP_SCHEME = "liftslate";

function getDeepLink(token: string) {
  return `${APP_SCHEME}://gym/join?token=${token}`;
}

function formatCountdown(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  if (minutes > 0) return `${minutes}m ${seconds}s left`;
  return `${seconds}s left`;
}

export default function GymSettingsScreen() {
  const { data: gym, isLoading } = useMyGym();
  const { mutate: updateGym, isPending: updating } = useUpdateGym();
  const { mutate: deleteGym, isPending: deleting } = useDeleteGym();
  const { mutate: regenerateToken, isPending: regeneratingToken } = useRegenerateInviteToken();
  const { mutate: generateCode, isPending: generatingCode } = useGenerateTempCode();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    if (!gym) return;
    setName(gym.name ?? "");
    setDescription(gym.description ?? "");
    setAddress(gym.address ?? "");
  }, [gym?.id]);

  useEffect(() => {
    if (!gym?.temp_code_expires) {
      setCountdown("");
      return;
    }
    const update = () => setCountdown(formatCountdown(gym.temp_code_expires!));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [gym?.temp_code_expires]);

  function handleNameBlur() {
    if (!gym || name.trim() === gym.name || !name.trim()) return;
    updateGym({ gymId: gym.id, updates: { name: name.trim() } });
  }

  function handleDescriptionBlur() {
    if (!gym || description.trim() === (gym.description ?? "")) return;
    updateGym({ gymId: gym.id, updates: { description: description.trim() || null } });
  }

  function handleAddressBlur() {
    if (!gym || address.trim() === (gym.address ?? "")) return;
    updateGym({ gymId: gym.id, updates: { address: address.trim() || null } });
  }

  async function handlePickLogo() {
    if (!gym) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets[0]?.base64) return;
    const asset = result.assets[0];
    const ext = asset.uri.split(".").pop() ?? "jpg";
    setUploadingLogo(true);
    try {
      const url = await uploadGymLogo(asset.base64!, `logo_${gym.id}.${ext}`, `image/${ext}`);
      updateGym({ gymId: gym.id, updates: { logo_url: url } });
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Failed to upload logo");
    } finally {
      setUploadingLogo(false);
    }
  }

  function handleShareLink() {
    if (!gym?.invite_token) return;
    const link = getDeepLink(gym.invite_token);
    Share.share({ message: `Join ${gym.name} on LiftSlate: ${link}`, url: link });
  }

  function handleRegenerateToken() {
    if (!gym) return;
    Alert.alert(
      "Regenerate Link?",
      "The old invite link will stop working immediately. All new members must use the new link.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Regenerate", style: "destructive", onPress: () => regenerateToken(gym.id) },
      ]
    );
  }

  function handleGenerateCode() {
    if (!gym) return;
    const hasActive =
      !!gym.temp_invite_code &&
      !!gym.temp_code_expires &&
      new Date(gym.temp_code_expires) > new Date();

    if (hasActive) {
      Alert.alert(
        "Generate New Code?",
        "The current code will stop working immediately.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Generate", onPress: () => generateCode(gym.id) },
        ]
      );
    } else {
      generateCode(gym.id);
    }
  }

  function handleDeleteGym() {
    if (!gym) return;
    Alert.alert(
      "Delete Gym?",
      "This will permanently delete the gym, remove all members, and delete all workouts. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          style: "destructive",
          onPress: () =>
            Alert.alert(
              "Are you absolutely sure?",
              `"${gym.name}" and all its data will be permanently deleted.`,
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete Forever",
                  style: "destructive",
                  onPress: () =>
                    deleteGym(gym.id, {
                      onSuccess: () => router.replace("/(tabs)/gym"),
                      onError: (e: any) => Alert.alert("Error", e.message),
                    }),
                },
              ]
            ),
        },
      ]
    );
  }

  if (isLoading || !gym) {
    return (
      <SafeAreaView className="flex-1 bg-bg justify-center items-center">
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  const hasActiveCode =
    !!gym.temp_invite_code &&
    !!gym.temp_code_expires &&
    new Date(gym.temp_code_expires) > new Date();

  const deepLink = gym.invite_token ? getDeepLink(gym.invite_token) : "";

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View className="flex-row items-center px-4 pt-2 pb-1">
          <Pressable
            onPress={() => router.back()}
            className="p-2 -ml-2"
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Text className="text-foreground text-xl font-bold ml-1">Gym Settings</Text>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* === GYM INFO === */}
          <SectionHeader title="Gym Info" />

          {/* Logo */}
          <Pressable
            onPress={handlePickLogo}
            disabled={uploadingLogo}
            className="mx-5 mb-4 flex-row items-center gap-4"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            {gym.logo_url ? (
              <Image
                source={{ uri: gym.logo_url }}
                style={{ width: 64, height: 64, borderRadius: 14 }}
                contentFit="cover"
              />
            ) : (
              <View className="w-16 h-16 rounded-[14px] bg-surface items-center justify-center">
                <Ionicons name="image-outline" size={28} color={colors.muted} />
              </View>
            )}
            <View className="flex-1">
              <Text className="text-foreground font-semibold text-[15px]">
                {uploadingLogo ? "Uploading..." : "Change Logo"}
              </Text>
              <Text className="text-muted text-[13px] mt-0.5">Tap to pick a new image</Text>
            </View>
            {uploadingLogo && <ActivityIndicator size="small" color={colors.accent} />}
          </Pressable>

          <View className="mx-5 bg-surface rounded-2xl overflow-hidden">
            <View className="px-4 py-4">
              <Text className="text-[13px] text-muted mb-1.5 font-semibold uppercase tracking-widest">
                Gym Name
              </Text>
              <TextInput
                className="text-foreground text-[17px]"
                value={name}
                onChangeText={setName}
                onBlur={handleNameBlur}
                placeholder="Gym name"
                placeholderTextColor={colors.muted}
                returnKeyType="done"
              />
            </View>

            <View className="h-px bg-border mx-4" />

            <View className="px-4 py-4">
              <Text className="text-[13px] text-muted mb-1.5 font-semibold uppercase tracking-widest">
                Description
              </Text>
              <TextInput
                className="text-foreground text-[17px]"
                value={description}
                onChangeText={setDescription}
                onBlur={handleDescriptionBlur}
                placeholder="Optional"
                placeholderTextColor={colors.muted}
                multiline
                returnKeyType="done"
              />
            </View>

            <View className="h-px bg-border mx-4" />

            <View className="px-4 py-4">
              <Text className="text-[13px] text-muted mb-1.5 font-semibold uppercase tracking-widest">
                Address
              </Text>
              <TextInput
                className="text-foreground text-[17px]"
                value={address}
                onChangeText={setAddress}
                onBlur={handleAddressBlur}
                placeholder="Optional"
                placeholderTextColor={colors.muted}
                returnKeyType="done"
              />
            </View>
          </View>

          {/* === INVITE MANAGEMENT === */}
          <SectionHeader title="Invite Management" />

          <View className="mx-5 bg-surface rounded-2xl overflow-hidden">
            {/* Permanent link */}
            <View className="px-4 py-4">
              <Text className="text-[13px] text-muted mb-2 font-semibold uppercase tracking-widest">
                Permanent Link
              </Text>
              <Text className="text-muted text-[13px] mb-3 leading-relaxed">
                Anyone with this link can join your gym (subject to subscription limits).
              </Text>
              {deepLink ? (
                <Text
                  className="text-foreground text-[13px] bg-surface2 px-3 py-2.5 rounded-xl mb-3"
                  numberOfLines={1}
                  selectable
                >
                  {deepLink}
                </Text>
              ) : null}
              <View className="flex-row gap-2">
                <Pressable
                  onPress={handleShareLink}
                  disabled={!gym.invite_token}
                  className="flex-1 bg-accent rounded-xl py-3 items-center flex-row justify-center gap-1.5"
                  style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
                >
                  <Ionicons name="share-outline" size={16} color={colors.bg} />
                  <Text className="text-bg font-bold text-[14px]">Share Link</Text>
                </Pressable>
                <Pressable
                  onPress={handleRegenerateToken}
                  disabled={regeneratingToken}
                  className="flex-1 bg-surface2 rounded-xl py-3 items-center"
                  style={({ pressed }) => ({ opacity: pressed || regeneratingToken ? 0.6 : 1 })}
                >
                  <Text className="text-foreground font-semibold text-[14px]">
                    {regeneratingToken ? "Regenerating..." : "Regenerate"}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View className="h-px bg-border mx-4" />

            {/* Temp code */}
            <View className="px-4 py-4">
              <Text className="text-[13px] text-muted mb-2 font-semibold uppercase tracking-widest">
                Temporary Code
              </Text>
              <Text className="text-muted text-[13px] mb-3 leading-relaxed">
                Share a short code valid for 2 hours. Great for in-person sign-ups.
              </Text>
              {hasActiveCode && (
                <View className="items-center mb-4 py-2">
                  <Text
                    className="text-accent font-bold"
                    style={{ fontSize: 42, letterSpacing: 8 }}
                  >
                    {gym.temp_invite_code}
                  </Text>
                  <Text className="text-muted text-[13px] mt-1">{countdown}</Text>
                </View>
              )}
              <Pressable
                onPress={handleGenerateCode}
                disabled={generatingCode}
                className="bg-surface2 rounded-xl py-3 items-center"
                style={({ pressed }) => ({ opacity: pressed || generatingCode ? 0.6 : 1 })}
              >
                <Text className="text-foreground font-semibold text-[15px]">
                  {generatingCode
                    ? "Generating..."
                    : hasActiveCode
                    ? "Generate New Code"
                    : "Generate Code"}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* === SUBSCRIPTION === */}
          <SectionHeader title="Subscription" />
          <SubscriptionSection gymId={gym.id} />

          {/* === DANGER ZONE === */}
          <SectionHeader title="Danger Zone" />
          <View className="mx-5 mb-4">
            <Pressable
              onPress={handleDeleteGym}
              disabled={deleting}
              className="bg-surface rounded-2xl py-3.5 items-center flex-row justify-center gap-2 border border-error"
              style={({ pressed }) => ({ opacity: pressed || deleting ? 0.7 : 1 })}
            >
              <Ionicons name="trash-outline" size={16} color={colors.error} />
              <Text className="text-error font-semibold text-[15px]">
                {deleting ? "Deleting..." : "Delete Gym"}
              </Text>
            </Pressable>
            <Text className="text-muted text-[12px] text-center mt-2">
              Removes all members, workouts, and gym data permanently.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SubscriptionSection({ gymId }: { gymId: string }) {
  const { data: sub, isLoading } = useGymSubscription(gymId);
  const { data: members } = useGymMembers(gymId);

  if (isLoading) {
    return (
      <View className="mx-5 h-24 bg-surface rounded-2xl items-center justify-center">
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  if (!sub) return null;

  const athleteCount = members?.filter((m) => m.role === "athlete").length ?? 0;
  const coachCount = members?.filter((m) => m.role === "coach").length ?? 0;
  const planLabel = sub.plan === "free" ? "Free" : sub.plan === "trial" ? "Trial" : "Pro";
  const isTrialActive = sub.status === "trial" && !!sub.trial_ends_at;
  const atAthleteLimit = athleteCount >= sub.max_athletes;
  const atCoachLimit = coachCount >= sub.max_coaches;

  return (
    <View className="mx-5 bg-surface rounded-2xl overflow-hidden">
      <View className="px-4 py-4">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-foreground font-semibold text-[16px]">{planLabel} Plan</Text>
          <View
            className={`px-2.5 py-1 rounded-full ${sub.plan === "pro" ? "bg-accent" : "bg-surface2"}`}
          >
            <Text
              className={`text-[12px] font-bold ${sub.plan === "pro" ? "text-bg" : "text-muted"}`}
            >
              {planLabel.toUpperCase()}
            </Text>
          </View>
        </View>

        {isTrialActive && (
          <Text className="text-muted text-[13px] mb-3">
            Trial ends {format(new Date(sub.trial_ends_at!), "MMM d, yyyy")}
          </Text>
        )}

        <View className="gap-2">
          <View className="flex-row justify-between items-center">
            <Text className="text-muted text-[14px]">Athletes</Text>
            <Text
              className={`text-[14px] font-semibold ${atAthleteLimit ? "text-error" : "text-foreground"}`}
            >
              {athleteCount} / {sub.max_athletes}
            </Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-muted text-[14px]">Coaches</Text>
            <Text
              className={`text-[14px] font-semibold ${atCoachLimit ? "text-error" : "text-foreground"}`}
            >
              {coachCount} / {sub.max_coaches}
            </Text>
          </View>
        </View>

        {(atAthleteLimit || atCoachLimit) && sub.plan !== "pro" && (
          <View className="mt-3 bg-surface2 rounded-xl px-3 py-2.5">
            <Text className="text-accent text-[13px] font-semibold">
              Upgrade to Pro for unlimited members
            </Text>
            <Text className="text-muted text-[12px] mt-0.5">Billing coming in a future update</Text>
          </View>
        )}
      </View>
    </View>
  );
}
