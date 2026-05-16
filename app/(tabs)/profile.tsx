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
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActionSheet } from "@/components/ui/ActionSheet";
import { saveLanguage, type SupportedLanguage } from "@/lib/i18n";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";
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

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  es: "Español",
};

export default function ProfileScreen() {
  const { data: profile, isLoading } = useProfile();
  const queryClient = useQueryClient();
  const { mutate: update, isPending } = useUpdateProfile();
  const { data: gym, isLoading: gymLoading } = useMyGym();
  const { mutate: leaveGym, isPending: isLeaving } = useLeaveGym();
  const { t, i18n } = useTranslation();

  const unit = (profile?.unit_preference ?? "kg") as WeightUnit;
  const currentLang = i18n.language as SupportedLanguage;

  const [displayName, setDisplayName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showLangSheet, setShowLangSheet] = useState(false);

  async function handleLanguageSelect(code: SupportedLanguage) {
    await i18n.changeLanguage(code);
    await saveLanguage(code);
  }

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

  async function clearCache() {
    queryClient.clear();
    await AsyncStorage.removeItem("LIFTSLATE_QUERY_CACHE");
  }

  async function handleSignOut() {
    await signOut();
    await clearCache();
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
            <Text
              style={{
                fontFamily: "CormorantGaramond-Regular",
                fontSize: 56,
                lineHeight: 58,
                color: colors.foreground,
                letterSpacing: -1,
              }}
            >
              {t("profile.title")}
            </Text>
          </View>

          <SectionHeader title={t("profile.account")} icon="person-outline" />

          <Card className="mx-5">
            <View className="px-4 py-4 gap-4">
              {isEditingName ? (
                <View className="gap-3">
                  <Input
                    label={t("profile.display_name")}
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder={t("profile.display_name_placeholder")}
                    returnKeyType="done"
                    autoCapitalize="words"
                    autoFocus
                    onSubmitEditing={handleSaveDisplayName}
                  />
                  <View className="flex-row gap-2">
                    <Button
                      label={t("common.cancel")}
                      variant="secondary"
                      size="sm"
                      onPress={handleCancelDisplayName}
                      style={{ flex: 1 }}
                    />
                    <Button
                      label={isPending ? t("common.saving") : t("common.save")}
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
                      {t("profile.display_name")}
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
                  {t("profile.email")}
                </Text>
                <Text className="text-muted text-[15px]">
                  {profile?.email ?? "—"}
                </Text>
              </View>
              <View className="h-px bg-border" />
              <Pressable
                onPress={() => setShowLangSheet(true)}
                className="flex-row items-center justify-between active:opacity-60"
              >
                <View className="flex-row items-center gap-2">
                  <Ionicons
                    name="earth-outline"
                    size={16}
                    color={colors.muted}
                  />
                  <Text className="text-label uppercase tracking-wider text-muted">
                    {t("profile.language")}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Text className="text-foreground text-[15px]">
                    {LANGUAGE_LABELS[currentLang] ?? currentLang.toUpperCase()}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.muted}
                  />
                </View>
              </Pressable>
            </View>
          </Card>

          <ActionSheet
            visible={showLangSheet}
            title={t("profile.language")}
            options={[
              {
                label: `${currentLang === "en" ? "✓  " : "    "}English`,
                onPress: () => handleLanguageSelect("en"),
              },
              {
                label: `${currentLang === "es" ? "✓  " : "    "}Español`,
                onPress: () => handleLanguageSelect("es"),
              },
              { label: t("common.cancel"), onPress: () => {}, cancel: true },
            ]}
            onClose={() => setShowLangSheet(false)}
          />

          <SectionHeader
            title={t("profile.units_weights")}
            icon="scale-outline"
          />

          <Card className="mx-5">
            {/* Unit preference */}
            <View className="px-4 py-4">
              <Text className="text-label uppercase tracking-wider text-muted mb-3">
                {t("profile.unit_preference")}
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

          <SectionHeader
            title={t("profile.gym_section")}
            icon="fitness-outline"
          />

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
                    <Text className="text-muted text-caption mt-0.5">
                      {t(`members.role_${gym.myRole}`)}
                    </Text>
                  </View>
                  {gym.myRole !== "admin" && (
                    <Button
                      label={t("common.leave")}
                      variant="destructive"
                      size="sm"
                      onPress={() => setShowLeaveModal(true)}
                      disabled={isLeaving}
                    />
                  )}
                  {gym.myRole === "admin" && (
                    <Text className="text-muted text-sm font-medium">
                      {t("common.owner")}
                    </Text>
                  )}
                </View>
                <View className="h-px bg-border mx-4" />
              </>
            ) : (
              <View className="px-4 py-4">
                <Text className="text-muted text-[15px]">
                  {t("profile.not_in_gym")}
                </Text>
              </View>
            )}
            <View className="px-4 py-4 flex-row items-center justify-between">
              <View className="flex-1 pr-4">
                <Text className="text-foreground text-body font-medium">
                  {t("profile.allow_coach_edits")}
                </Text>
                <Text className="text-muted text-caption mt-0.5">
                  {t("profile.allow_coach_edits_description")}
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

          <SectionHeader title={t("profile.help")} icon="help-circle-outline" />

          <Card className="mx-5">
            <Pressable
              onPress={() => router.push("/faq")}
              className="px-4 py-4 flex-row items-center active:opacity-60"
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={18}
                color={colors.muted}
              />
              <Text className="text-foreground text-[15px] flex-1 ml-3">
                {t("profile.faq")}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.muted} />
            </Pressable>
          </Card>

          <SectionHeader
            title={t("profile.legal")}
            icon="document-text-outline"
          />

          <Card className="mx-5">
            <Pressable
              onPress={() =>
                WebBrowser.openBrowserAsync(
                  "https://liftslate-invite.vercel.app/privacy",
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
                {t("profile.privacy_policy")}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.muted} />
            </Pressable>
            <View className="h-px bg-border mx-4" />
            <Pressable
              onPress={() =>
                WebBrowser.openBrowserAsync(
                  "https://liftslate-invite.vercel.app/terms",
                )
              }
              className="px-4 py-4 flex-row items-center active:opacity-60"
            >
              <Ionicons name="reader-outline" size={18} color={colors.muted} />
              <Text className="text-foreground text-[15px] flex-1 ml-3">
                {t("profile.terms_of_service")}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.muted} />
            </Pressable>
            <View className="h-px bg-border mx-4" />
            <Pressable
              onPress={() =>
                Linking.openURL("mailto:liftslate.support@gmail.com")
              }
              className="px-4 py-4 flex-row items-center active:opacity-60"
            >
              <Ionicons name="mail-outline" size={18} color={colors.muted} />
              <Text className="text-foreground text-[15px] flex-1 ml-3">
                {t("profile.contact_support")}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.muted} />
            </Pressable>
          </Card>

          <Card className="mx-5 mt-10">
            <Pressable
              onPress={handleSignOut}
              className="px-4 py-4 active:opacity-60"
            >
              <Text className="text-foreground text-[15px]">
                {t("profile.sign_out")}
              </Text>
            </Pressable>
          </Card>

          <SectionHeader
            title={t("profile.danger_zone")}
            icon="warning-outline"
          />

          <Card className="mx-5">
            <Pressable
              onPress={() => setShowDeleteModal(true)}
              className="px-4 py-4 active:opacity-60"
            >
              <Text className="text-error text-[15px] font-medium">
                {t("profile.delete_account")}
              </Text>
              <Text className="text-muted text-caption mt-0.5">
                {t("profile.delete_account_description")}
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
              await clearCache();
            }}
            isGymOwner={gym?.myRole === "admin"}
          />

          <View className="items-center mt-8 mb-4">
            <Text className="text-muted text-caption">
              {t("profile.version", { version: appVersion })}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
