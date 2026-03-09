import { useEffect, useState } from "react";
import { View, Text, TextInput, Switch, Pressable, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";

import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { signOut } from "@/services/auth.service";
import { fromKg, toKg, WeightUnit } from "@/lib/units";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { colors } from "@/lib/theme";

export default function ProfileScreen() {
  const { data: profile, isLoading } = useProfile();
  const { mutate: update, isPending } = useUpdateProfile();

  const unit = (profile?.unit_preference ?? "kg") as WeightUnit;

  const [displayName, setDisplayName] = useState("");
  const [roundingInput, setRoundingInput] = useState("");

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name ?? "");
    const roundKg = profile.rounding_increment_kg ?? 2.5;
    const displayRounding = unit === "kg" ? roundKg : fromKg(roundKg, "lbs");
    setRoundingInput(String(displayRounding));
  }, [profile]);

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
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View className="px-5 pt-5 pb-1">
          <Text className="text-[28px] font-bold text-foreground tracking-tight">Profile</Text>
        </View>

        <SectionHeader title="Account" />

        <View className="mx-5 bg-surface rounded-2xl overflow-hidden">
          <View className="px-4 py-4">
            <Text className="text-[13px] text-muted mb-1.5 font-semibold uppercase tracking-widest">Display Name</Text>
            <TextInput
              className="text-foreground text-[17px]"
              value={displayName}
              onChangeText={setDisplayName}
              onBlur={handleDisplayNameBlur}
              placeholder="Your name"
              placeholderTextColor={colors.muted}
              returnKeyType="done"
              autoCapitalize="words"
            />
          </View>
        </View>

        <SectionHeader title="Units & Weights" />

        <View className="mx-5 bg-surface rounded-2xl overflow-hidden">
          {/* Unit preference */}
          <View className="px-4 py-4">
            <Text className="text-[13px] text-muted mb-3 font-semibold uppercase tracking-widest">Unit Preference</Text>
            <View className="flex-row bg-surface2 rounded-xl p-1">
              <Pressable
                className={`flex-1 py-2.5 rounded-lg items-center ${unit === "kg" ? "bg-accent" : ""}`}
                onPress={() => handleUnitToggle("kg")}
              >
                <Text className={`font-bold text-[15px] ${unit === "kg" ? "text-bg" : "text-muted"}`}>kg</Text>
              </Pressable>
              <Pressable
                className={`flex-1 py-2.5 rounded-lg items-center ${unit === "lbs" ? "bg-accent" : ""}`}
                onPress={() => handleUnitToggle("lbs")}
              >
                <Text className={`font-bold text-[15px] ${unit === "lbs" ? "text-bg" : "text-muted"}`}>lbs</Text>
              </Pressable>
            </View>
          </View>

          <View className="h-px bg-border mx-4" />

          {/* Rounding increment */}
          <View className="px-4 py-4">
            <Text className="text-[13px] text-muted mb-1.5 font-semibold uppercase tracking-widest">
              Rounding Increment ({unit})
            </Text>
            <TextInput
              className="text-foreground text-[17px]"
              value={roundingInput}
              onChangeText={setRoundingInput}
              onBlur={handleRoundingBlur}
              keyboardType="decimal-pad"
              returnKeyType="done"
              placeholder={unit === "kg" ? "2.5" : "5"}
              placeholderTextColor={colors.muted}
            />
          </View>
        </View>

        <SectionHeader title="Gym" />

        <View className="mx-5 bg-surface rounded-2xl overflow-hidden">
          <View className="px-4 py-4 flex-row items-center justify-between">
            <View className="flex-1 pr-4">
              <Text className="text-foreground text-[16px] font-medium">Allow Coach Edits</Text>
              <Text className="text-muted text-[13px] mt-0.5">Coming soon in gym features</Text>
            </View>
            <Switch
              value={profile?.allow_coach_edit ?? true}
              onValueChange={handleCoachEditToggle}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor="#fff"
              disabled={isPending}
            />
          </View>
        </View>

        <View className="mt-10 mx-5">
          <Pressable
            className="bg-surface rounded-2xl py-3.5 items-center flex-row justify-center gap-2"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.error} />
            <Text className="text-error font-semibold text-[15px]">Sign Out</Text>
          </Pressable>
        </View>

        <View className="items-center mt-8">
          <Text className="text-muted text-[13px]">LiftSlate v{appVersion}</Text>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
