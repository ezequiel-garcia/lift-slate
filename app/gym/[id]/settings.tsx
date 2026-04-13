import { useState, useEffect } from "react";
import {
  View,
  Text,
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
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { colors } from "@/lib/theme";
import {
  useMyGym,
  useUpdateGym,
  useDeleteGym,
  useGymMembers,
  useGymSubscription,
  useGymInviteDetails,
  useRegenerateInviteToken,
} from "@/hooks/useGym";
import { useGenerateTempCode } from "@/hooks/useInvite";
import { uploadGymLogo } from "@/services/storage.service";
import * as Linking from "expo-linking";

function getDeepLink(token: string) {
  return Linking.createURL("gym/join", { queryParams: { token } });
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
  const { data: inviteDetails } = useGymInviteDetails(gym?.id);
  const { mutate: updateGym } = useUpdateGym();
  const { mutate: deleteGym, isPending: deleting } = useDeleteGym();
  const { mutate: regenerateToken, isPending: regeneratingToken } =
    useRegenerateInviteToken();
  const { mutate: generateCode, isPending: generatingCode } =
    useGenerateTempCode();

  useEffect(() => {
    if (!isLoading && gym?.myRole !== "admin") {
      router.replace("/(tabs)/gym");
    }
  }, [isLoading, gym?.myRole]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    if (!gym) return;
    setName(gym.name ?? "");
    setDescription(gym.description ?? "");
    setAddress(gym.address ?? "");
  }, [gym]);

  useEffect(() => {
    if (!inviteDetails?.temp_code_expires) {
      setCountdown("");
      return;
    }
    const update = () =>
      setCountdown(formatCountdown(inviteDetails.temp_code_expires!));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [inviteDetails?.temp_code_expires]);

  function handleSave() {
    if (!gym) return;
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const updates: Record<string, string | null> = {};
    if (trimmedName !== gym.name) updates.name = trimmedName;
    if (description.trim() !== (gym.description ?? ""))
      updates.description = description.trim() || null;
    if (address.trim() !== (gym.address ?? ""))
      updates.address = address.trim() || null;
    if (Object.keys(updates).length > 0) {
      updateGym(
        { gymId: gym.id, updates },
        { onSettled: () => setIsEditing(false) },
      );
    } else {
      setIsEditing(false);
    }
  }

  function handleCancel() {
    if (!gym) return;
    setName(gym.name ?? "");
    setDescription(gym.description ?? "");
    setAddress(gym.address ?? "");
    setIsEditing(false);
  }

  async function handlePickLogo() {
    if (!gym) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      base64: true,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets[0]?.base64) return;
    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? "image/jpeg";
    const ext = mimeType.split("/")[1] ?? "jpg";
    setUploadingLogo(true);
    try {
      const url = await uploadGymLogo(
        asset.base64!,
        `logo_${gym.id}.${ext}`,
        mimeType,
        asset.fileSize ?? undefined,
      );
      updateGym({ gymId: gym.id, updates: { logo_url: url } });
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Failed to upload logo");
    } finally {
      setUploadingLogo(false);
    }
  }

  function handleShareLink() {
    if (!inviteDetails?.invite_token) return;
    const link = getDeepLink(inviteDetails.invite_token);
    Share.share({
      message: `Join ${gym?.name} on LiftSlate: ${link}`,
      url: link,
    });
  }

  function handleRegenerateToken() {
    if (!gym) return;
    Alert.alert(
      "Regenerate Link?",
      "The old invite link will stop working immediately. All new members must use the new link.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Regenerate",
          style: "destructive",
          onPress: () => regenerateToken(gym.id),
        },
      ],
    );
  }

  function handleGenerateCode() {
    if (!gym) return;
    const hasActive =
      !!inviteDetails?.temp_invite_code &&
      !!inviteDetails?.temp_code_expires &&
      new Date(inviteDetails?.temp_code_expires) > new Date();

    if (hasActive) {
      Alert.alert(
        "Generate New Code?",
        "The current code will stop working immediately.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Generate", onPress: () => generateCode(gym.id) },
        ],
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
              ],
            ),
        },
      ],
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
    !!inviteDetails?.temp_invite_code &&
    !!inviteDetails?.temp_code_expires &&
    new Date(inviteDetails?.temp_code_expires) > new Date();

  const deepLink = inviteDetails?.invite_token
    ? getDeepLink(inviteDetails?.invite_token)
    : "";

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center px-4 pt-2 pb-1">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center -ml-1"
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Ionicons name="chevron-back" size={24} color={colors.foreground} />
          </Pressable>
          <Text className="text-foreground text-xl font-bold ml-1">
            Gym Settings
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* === GYM INFO === */}
          <SectionHeader title="Gym Info" icon="information-circle-outline" />

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
              <Text className="text-muted text-caption mt-0.5">
                Tap to pick a new image
              </Text>
            </View>
            {uploadingLogo && (
              <ActivityIndicator size="small" color={colors.accent} />
            )}
          </Pressable>

          <Card className="mx-5">
            {isEditing ? (
              <View className="px-4 py-4 gap-4">
                <Input
                  label="Gym Name"
                  value={name}
                  onChangeText={setName}
                  placeholder="Gym name"
                  returnKeyType="next"
                  autoFocus
                />
                <Input
                  label="Description"
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Optional"
                  multiline
                  returnKeyType="next"
                />
                <Input
                  label="Address"
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Optional"
                  returnKeyType="done"
                  onSubmitEditing={handleSave}
                />
                <View className="flex-row gap-2">
                  <Button
                    label="Cancel"
                    variant="secondary"
                    size="sm"
                    onPress={handleCancel}
                    style={{ flex: 1 }}
                  />
                  <Button
                    label="Save"
                    variant={name.trim() ? "primary" : "secondary"}
                    size="sm"
                    onPress={handleSave}
                    disabled={!name.trim()}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            ) : (
              <Pressable
                onPress={() => setIsEditing(true)}
                className="px-4 py-4 active:opacity-60"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-4 gap-3">
                    <View>
                      <Text className="text-label uppercase tracking-wider text-muted mb-1">
                        Gym Name
                      </Text>
                      <Text className="text-foreground text-[15px]">
                        {gym.name ?? "—"}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-label uppercase tracking-wider text-muted mb-1">
                        Description
                      </Text>
                      <Text className="text-foreground text-[15px]">
                        {gym.description ?? "—"}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-label uppercase tracking-wider text-muted mb-1">
                        Address
                      </Text>
                      <Text className="text-foreground text-[15px]">
                        {gym.address ?? "—"}
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name="pencil-outline"
                    size={16}
                    color={colors.muted}
                  />
                </View>
              </Pressable>
            )}
          </Card>

          {/* === INVITE MANAGEMENT === */}
          <SectionHeader title="Invite Management" icon="link-outline" />

          <Card className="mx-5">
            {/* Permanent link */}
            <View className="px-4 py-4">
              <Text className="text-label uppercase tracking-wider text-muted mb-2">
                Permanent Link
              </Text>
              <Text className="text-muted text-caption mb-3 leading-relaxed">
                Anyone with this link can join your gym (subject to subscription
                limits).
              </Text>
              {deepLink ? (
                <Text
                  className="text-foreground text-caption bg-surface2 px-3 py-2.5 rounded-xl mb-3"
                  numberOfLines={1}
                  selectable
                >
                  {deepLink}
                </Text>
              ) : null}
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Button
                    label="Share Link"
                    size="md"
                    onPress={handleShareLink}
                    disabled={!inviteDetails?.invite_token}
                    icon={
                      <Ionicons
                        name="share-outline"
                        size={16}
                        color={colors.bg}
                      />
                    }
                  />
                </View>
                <View className="flex-1">
                  <Button
                    label={regeneratingToken ? "Regenerating..." : "Regenerate"}
                    variant="secondary"
                    size="md"
                    onPress={handleRegenerateToken}
                    disabled={regeneratingToken}
                  />
                </View>
              </View>
            </View>

            <View className="h-px bg-border mx-4" />

            {/* Temp code */}
            <View className="px-4 py-4">
              <Text className="text-label uppercase tracking-wider text-muted mb-2">
                Temporary Code
              </Text>
              <Text className="text-muted text-caption mb-3 leading-relaxed">
                Share a short code valid for 2 hours. Great for in-person
                sign-ups.
              </Text>
              {hasActiveCode && (
                <View className="items-center mb-4 py-2">
                  <Text
                    className="text-accent font-bold"
                    style={{ fontSize: 42, letterSpacing: 8 }}
                  >
                    {inviteDetails?.temp_invite_code}
                  </Text>
                  <Text className="text-muted text-caption mt-1">
                    {countdown}
                  </Text>
                </View>
              )}
              <Button
                label={
                  generatingCode
                    ? "Generating..."
                    : hasActiveCode
                      ? "Generate New Code"
                      : "Generate Code"
                }
                variant="secondary"
                onPress={handleGenerateCode}
                disabled={generatingCode}
              />
            </View>
          </Card>

          {/* === SUBSCRIPTION === */}
          <SectionHeader title="Subscription" icon="card-outline" />
          <SubscriptionSection gymId={gym.id} />

          {/* === DANGER ZONE === */}
          <SectionHeader title="Danger Zone" icon="warning-outline" />
          <View className="mx-5 mb-4">
            <Button
              label={deleting ? "Deleting..." : "Delete Gym"}
              variant="destructive"
              onPress={handleDeleteGym}
              disabled={deleting}
              icon={
                <Ionicons name="trash-outline" size={16} color={colors.error} />
              }
            />
            <Text className="text-muted text-caption text-center mt-2">
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
  const planLabel =
    sub.plan === "free" ? "Free" : sub.plan === "trial" ? "Trial" : "Pro";
  const isTrialActive = sub.status === "trial" && !!sub.trial_ends_at;
  const atAthleteLimit = athleteCount >= sub.max_athletes;
  const atCoachLimit = coachCount >= sub.max_coaches;

  return (
    <Card className="mx-5">
      <View className="px-4 py-4">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-foreground font-semibold text-body">
            {planLabel} Plan
          </Text>
          <View
            className={`px-2.5 py-1 rounded-full ${sub.plan === "pro" ? "bg-accent" : "bg-surface2"}`}
          >
            <Text
              className={`text-tiny font-bold ${sub.plan === "pro" ? "text-bg" : "text-muted"}`}
            >
              {planLabel.toUpperCase()}
            </Text>
          </View>
        </View>

        {isTrialActive && (
          <Text className="text-muted text-caption mb-3">
            Trial ends {format(new Date(sub.trial_ends_at!), "MMM d, yyyy")}
          </Text>
        )}

        <View className="gap-2">
          <View className="flex-row justify-between items-center">
            <Text className="text-muted text-subtext">Athletes</Text>
            <Text
              className={`text-subtext font-semibold ${atAthleteLimit ? "text-error" : "text-foreground"}`}
            >
              {athleteCount} / {sub.max_athletes}
            </Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-muted text-subtext">Coaches</Text>
            <Text
              className={`text-subtext font-semibold ${atCoachLimit ? "text-error" : "text-foreground"}`}
            >
              {coachCount} / {sub.max_coaches}
            </Text>
          </View>
        </View>

        {(atAthleteLimit || atCoachLimit) && sub.plan !== "pro" && (
          <View className="mt-3 bg-surface2 rounded-xl px-3 py-2.5">
            <Text className="text-accent text-caption font-semibold">
              Upgrade to Pro for unlimited members
            </Text>
            <Text className="text-muted text-caption mt-0.5">
              Billing coming in a future update
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
}
