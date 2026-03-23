import { useEffect, useState } from "react";
import { View, Text, Switch, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";

import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useMyGym, useLeaveGym } from "@/hooks/useGym";
import { signOut } from "@/services/auth.service";
import { fromKg, toKg, WeightUnit } from "@/lib/units";
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
  const [roundingInput, setRoundingInput] = useState("");

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name ?? "");
    const roundKg = profile.rounding_increment_kg ?? 2.5;
    const displayRounding = unit === "kg" ? roundKg : fromKg(roundKg, "lbs");
    setRoundingInput(String(displayRounding));
  }, [profile, unit]);

  function handleDisplayNameBlur() {
    const trimmed = displayName.trim();
    if (trimmed === (profile?.display_name ?? "")) return;
    update({ display_name: trimmed });
  }

  function handleUnitToggle(selected: WeightUnit) {
    if (selected === unit) return;
    update({ unit_preference: selected });
  }

  function handleRoundingBlur() {
    const parsed = parseFloat(roundingInput);
    if (isNaN(parsed) || parsed <= 0) {
      const roundKg = profile?.rounding_increment_kg ?? 2.5;
      setRoundingInput(String(unit === "kg" ? roundKg : fromKg(roundKg, "lbs")));
      return;
    }
    const asKg = toKg(parsed, unit);
    update({ rounding_increment_kg: asKg });
  }

  function handleCoachEditToggle(value: boolean) {
    update({ allow_coach_edit: value });
  }

  function handleLeaveGym() {
    if (!gym?.membershipId) return;
    Alert.alert("Leave Gym", `Are you sure you want to leave ${gym.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: () => leaveGym(gym.membershipId!, {
          onError: (err) => Alert.alert("Error", err.message),
        }),
      },
    ]);
  }

  async function handleSignOut() {
    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            router.replace("/(auth)/login");
          } catch {
            Alert.alert("Error", "Failed to sign out. Please try again.");
          }
        },
      },
    ]);
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
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View className="px-5 pt-5 pb-1">
          <Text className="text-title text-foreground tracking-tight">Profile</Text>
        </View>

        <SectionHeader title="Account" icon="person-outline" />

        <Card className="mx-5">
          <View className="px-4 py-4">
            <Input
              label="Display Name"
              value={displayName}
              onChangeText={setDisplayName}
              onBlur={handleDisplayNameBlur}
              placeholder="Your name"
              returnKeyType="done"
              autoCapitalize="words"
            />
          </View>
        </Card>

        <SectionHeader title="Units & Weights" icon="scale-outline" />

        <Card className="mx-5">
          {/* Unit preference */}
          <View className="px-4 py-4">
            <Text className="text-label uppercase tracking-wider text-muted mb-3">Unit Preference</Text>
            <View className="flex-row bg-surface2 rounded-xl p-1">
              {(["kg", "lbs"] as WeightUnit[]).map((u) => (
                <View key={u} className={`flex-1 py-2.5 rounded-lg items-center ${unit === u ? "bg-accent" : ""}`}>
                  <Text
                    className={`font-bold text-[15px] ${unit === u ? "text-bg" : "text-muted"}`}
                    onPress={() => handleUnitToggle(u)}
                  >
                    {u}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View className="h-px bg-border mx-4" />

          {/* Rounding increment */}
          <View className="px-4 py-4">
            <Input
              label={`Rounding Increment (${unit})`}
              value={roundingInput}
              onChangeText={setRoundingInput}
              onBlur={handleRoundingBlur}
              keyboardType="decimal-pad"
              returnKeyType="done"
              placeholder={unit === "kg" ? "2.5" : "5"}
            />
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
                  <Text className="text-foreground text-body font-medium">{gym.name}</Text>
                  <Text className="text-muted text-caption mt-0.5 capitalize">{gym.myRole}</Text>
                </View>
                {gym.myRole !== "admin" && (
                  <Button
                    label="Leave"
                    variant="destructive"
                    size="sm"
                    onPress={handleLeaveGym}
                    disabled={isLeaving}
                  />
                )}
                {gym.myRole === "admin" && (
                  <Text className="text-muted text-sm font-medium">Owner</Text>
                )}
              </View>
              <View className="h-px bg-border mx-4" />
            </>
          ) : (
            <View className="px-4 py-4">
              <Text className="text-muted text-[15px]">Not part of a gym</Text>
            </View>
          )}
          <View className="px-4 py-4 flex-row items-center justify-between">
            <View className="flex-1 pr-4">
              <Text className="text-foreground text-body font-medium">Allow Coach Edits</Text>
              <Text className="text-muted text-caption mt-0.5">Let coaches view and edit your maxes</Text>
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

        <View className="mt-10 mx-5">
          <Button
            label="Sign Out"
            variant="destructive"
            onPress={handleSignOut}
            icon={<Ionicons name="log-out-outline" size={18} color={colors.error} />}
          />
        </View>

        <View className="items-center mt-8">
          <Text className="text-muted text-caption">LiftSlate v{appVersion}</Text>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
