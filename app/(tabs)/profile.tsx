import { useEffect, useState } from "react";
import {
  View,
  Text,
  Switch,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";

import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useMyGym, useLeaveGym } from "@/hooks/useGym";
import { signOut, deleteAccount } from "@/services/auth.service";
import { DeleteAccountModal } from "@/components/ui/DeleteAccountModal";
import { LeaveGymModal } from "@/components/ui/LeaveGymModal";
import { WeightUnit } from "@/lib/units";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { colors } from "@/lib/theme";

export default function ProfileScreen() {
  const { data: profile, isLoading } = useProfile();
  const { mutate: update, isPending } = useUpdateProfile();
  const { data: gym, isLoading: gymLoading } = useMyGym();
  const { mutate: leaveGym, isPending: isLeaving } = useLeaveGym();

  const unit = (profile?.unit_preference ?? "kg") as WeightUnit;

  const [displayName, setDisplayName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name ?? "");
  }, [profile]);

  function handleSaveDisplayName() {
    const trimmed = displayName.trim();
    if (trimmed && trimmed !== (profile?.display_name ?? "")) {
      update(
        { display_name: trimmed },
        { onSettled: () => setIsEditingName(false) },
      );
    } else {
      setDisplayName(profile?.display_name ?? "");
      setIsEditingName(false);
    }
  }

  function handleCancelDisplayName() {
    setDisplayName(profile?.display_name ?? "");
    setIsEditingName(false);
  }

  function handleUnitToggle(selected: WeightUnit) {
    if (selected === unit) return;
    update({ unit_preference: selected });
  }

  function handleCoachEditToggle(value: boolean) {
    update({ allow_coach_edit: value });
  }

  function handleLeaveGym() {
    if (!gym?.membershipId) return;
    leaveGym(gym.membershipId!, {
      onSuccess: () => setShowLeaveModal(false),
    });
  }

  async function handleSignOut() {
    await signOut();
    router.replace("/(auth)/login");
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-bg justify-center">
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  const appVersion = Constants.expoConfig?.version ?? "1.0.0";

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-5 pt-5 pb-1">
            <Text className="text-title text-foreground tracking-tight">
              Profile
            </Text>
          </View>

          <SectionHeader title="Account" icon="person-outline" />

          <Card className="mx-5">
            <View className="px-4 py-4 gap-4">
              {isEditingName ? (
                <View className="gap-3">
                  <Input
                    label="Display Name"
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder="Your name"
                    returnKeyType="done"
                    autoCapitalize="words"
                    autoFocus
                    onSubmitEditing={handleSaveDisplayName}
                  />
                  <View className="flex-row gap-2">
                    <Button
                      label="Cancel"
                      variant="secondary"
                      size="sm"
                      onPress={handleCancelDisplayName}
                      style={{ flex: 1 }}
                    />
                    <Button
                      label={isPending ? "Saving..." : "Save"}
                      variant={displayName.trim() ? "primary" : "secondary"}
                      size="sm"
                      onPress={handleSaveDisplayName}
                      disabled={isPending || !displayName.trim()}
                      style={{ flex: 1 }}
                    />
                  </View>
                </View>
              ) : (
                <Pressable
                  onPress={() => setIsEditingName(true)}
                  className="flex-row items-center justify-between active:opacity-60"
                >
                  <View>
                    <Text className="text-label uppercase tracking-wider text-muted mb-1">
                      Display Name
                    </Text>
                    <Text className="text-foreground text-[15px]">
                      {profile?.display_name ?? "—"}
                    </Text>
                  </View>
                  <Ionicons
                    name="pencil-outline"
                    size={16}
                    color={colors.muted}
                  />
                </Pressable>
              )}
              <View className="h-px bg-border" />
              <View>
                <Text className="text-label uppercase tracking-wider text-muted mb-1">
                  Email
                </Text>
                <Text className="text-muted text-[15px]">
                  {profile?.email ?? "—"}
                </Text>
              </View>
            </View>
          </Card>

          <SectionHeader title="Units & Weights" icon="scale-outline" />

          <Card className="mx-5">
            {/* Unit preference */}
            <View className="px-4 py-4">
              <Text className="text-label uppercase tracking-wider text-muted mb-3">
                Unit Preference
              </Text>
              <View className="flex-row bg-surface2 rounded-xl p-1">
                {(["kg", "lbs"] as WeightUnit[]).map((u) => (
                  <Pressable
                    key={u}
                    className={`flex-1 py-2.5 rounded-lg items-center ${unit === u ? "bg-accent" : ""}`}
                    onPress={() => handleUnitToggle(u)}
                  >
                    <Text
                      className={`font-bold text-[15px] ${unit === u ? "text-bg" : "text-muted"}`}
                    >
                      {u}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </Card>

          <SectionHeader title="Gym" icon="fitness-outline" />

          <Card className="mx-5">
            {gymLoading ? (
              <View className="px-4 py-4 items-center">
                <ActivityIndicator color={colors.accent} />
              </View>
            ) : gym ? (
              <>
                <View className="px-4 py-4 flex-row items-center justify-between">
                  <View className="flex-1 pr-4">
                    <Text className="text-foreground text-body font-medium">
                      {gym.name}
                    </Text>
                    <Text className="text-muted text-caption mt-0.5 capitalize">
                      {gym.myRole}
                    </Text>
                  </View>
                  {gym.myRole !== "admin" && (
                    <Button
                      label="Leave"
                      variant="destructive"
                      size="sm"
                      onPress={() => setShowLeaveModal(true)}
                      disabled={isLeaving}
                    />
                  )}
                  {gym.myRole === "admin" && (
                    <Text className="text-muted text-sm font-medium">
                      Owner
                    </Text>
                  )}
                </View>
                <View className="h-px bg-border mx-4" />
              </>
            ) : (
              <View className="px-4 py-4">
                <Text className="text-muted text-[15px]">
                  Not part of a gym
                </Text>
              </View>
            )}
            <View className="px-4 py-4 flex-row items-center justify-between">
              <View className="flex-1 pr-4">
                <Text className="text-foreground text-body font-medium">
                  Allow Coach Edits
                </Text>
                <Text className="text-muted text-caption mt-0.5">
                  Let coaches view and edit your maxes
                </Text>
              </View>
              <Switch
                value={profile?.allow_coach_edit ?? true}
                onValueChange={handleCoachEditToggle}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor="#fff"
                disabled={isPending}
              />
            </View>
          </Card>

          <SectionHeader title="Legal" icon="document-text-outline" />

          <Card className="mx-5">
            <Pressable
              onPress={() =>
                WebBrowser.openBrowserAsync(
                  "https://ezequiel-garcia.github.io/lift-slate/privacy-policy.html",
                )
              }
              className="px-4 py-4 flex-row items-center active:opacity-60"
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={18}
                color={colors.muted}
              />
              <Text className="text-foreground text-[15px] flex-1 ml-3">
                Privacy Policy
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.muted} />
            </Pressable>
            <View className="h-px bg-border mx-4" />
            <Pressable
              onPress={() =>
                WebBrowser.openBrowserAsync(
                  "https://ezequiel-garcia.github.io/lift-slate/terms-of-service.html",
                )
              }
              className="px-4 py-4 flex-row items-center active:opacity-60"
            >
              <Ionicons name="reader-outline" size={18} color={colors.muted} />
              <Text className="text-foreground text-[15px] flex-1 ml-3">
                Terms of Service
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.muted} />
            </Pressable>
          </Card>

          <Card className="mx-5 mt-10">
            <Pressable
              onPress={handleSignOut}
              className="px-4 py-4 active:opacity-60"
            >
              <Text className="text-foreground text-[15px]">Sign Out</Text>
            </Pressable>
          </Card>

          <SectionHeader title="Danger Zone" icon="warning-outline" />

          <Card className="mx-5">
            <Pressable
              onPress={() => setShowDeleteModal(true)}
              className="px-4 py-4 active:opacity-60"
            >
              <Text className="text-error text-[15px] font-medium">
                Delete Account
              </Text>
              <Text className="text-muted text-caption mt-0.5">
                Permanently delete your account and all data
              </Text>
            </Pressable>
          </Card>

          <LeaveGymModal
            visible={showLeaveModal}
            gymName={gym?.name ?? ""}
            onCancel={() => setShowLeaveModal(false)}
            onConfirm={handleLeaveGym}
            isLeaving={isLeaving}
          />

          <DeleteAccountModal
            visible={showDeleteModal}
            onCancel={() => setShowDeleteModal(false)}
            onConfirmDelete={async () => {
              await deleteAccount();
              router.replace("/(auth)/login");
            }}
            isGymOwner={gym?.myRole === "admin"}
          />

          <View className="items-center mt-8 mb-4">
            <Text className="text-muted text-caption">
              LiftSlate v{appVersion}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
