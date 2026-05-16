import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  ScrollView,
  Pressable,
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

import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { colors } from "@/lib/theme";
import { useAppStore } from "@/stores/appStore";
import {
  useMyGym,
  useUpdateGym,
  useDeleteGym,
  useGymInviteDetails,
  useRegenerateInviteToken,
} from "@/hooks/useGym";
import { useGenerateTempCode } from "@/hooks/useInvite";
import { uploadGymLogo } from "@/services/storage.service";
import { INVITE_BASE_URL } from "@/lib/constants";

function getDeepLink(token: string) {
  return `${INVITE_BASE_URL}/gym/join?token=${token}`;
}

function formatCountdown(
  expiresAt: string,
  expired: string,
  left: string,
): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return expired;
  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${left}`;
  if (minutes > 0) return `${minutes}m ${seconds}s ${left}`;
  return `${seconds}s ${left}`;
}

export default function GymSettingsScreen() {
  const { t } = useTranslation();
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
  const [regenerateLinkVisible, setRegenerateLinkVisible] = useState(false);
  const [generateCodeVisible, setGenerateCodeVisible] = useState(false);
  const [deleteGymVisible, setDeleteGymVisible] = useState(false);
  const showToast = useAppStore((s) => s.showToast);

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
      setCountdown(
        formatCountdown(
          inviteDetails.temp_code_expires!,
          t("gym_settings.countdown_expired"),
          t("gym_settings.countdown_left"),
        ),
      );
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
      showToast(t("gym_settings.logo_upload_error"), "error");
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
    setRegenerateLinkVisible(true);
  }

  function handleGenerateCode() {
    if (!gym) return;
    const hasActive =
      !!inviteDetails?.temp_invite_code &&
      !!inviteDetails?.temp_code_expires &&
      new Date(inviteDetails?.temp_code_expires) > new Date();

    if (hasActive) {
      setGenerateCodeVisible(true);
    } else {
      generateCode(gym.id);
    }
  }

  function handleDeleteGym() {
    if (!gym) return;
    setDeleteGymVisible(true);
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
            {t("gym_settings.title")}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* === GYM INFO === */}
          <SectionHeader
            title={t("gym_settings.gym_info")}
            icon="information-circle-outline"
          />

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
                {uploadingLogo
                  ? t("common.uploading")
                  : t("gym_settings.change_logo")}
              </Text>
              <Text className="text-muted text-caption mt-0.5">
                {t("gym_settings.change_logo_description")}
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
                  label={t("gym_settings.gym_name_label")}
                  value={name}
                  onChangeText={setName}
                  placeholder={t("gym_settings.gym_name_placeholder")}
                  returnKeyType="next"
                  autoFocus
                />
                <Input
                  label={t("gym_settings.description_label")}
                  value={description}
                  onChangeText={setDescription}
                  placeholder={t("gym_settings.description_placeholder")}
                  multiline
                  returnKeyType="next"
                />
                <Input
                  label={t("gym_settings.address_label")}
                  value={address}
                  onChangeText={setAddress}
                  placeholder={t("gym_settings.address_placeholder")}
                  returnKeyType="done"
                  onSubmitEditing={handleSave}
                />
                <View className="flex-row gap-2">
                  <Button
                    label={t("common.cancel")}
                    variant="secondary"
                    size="sm"
                    onPress={handleCancel}
                    style={{ flex: 1 }}
                  />
                  <Button
                    label={t("common.save")}
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
                        {t("gym_settings.gym_name_label")}
                      </Text>
                      <Text className="text-foreground text-[15px]">
                        {gym.name ?? "—"}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-label uppercase tracking-wider text-muted mb-1">
                        {t("gym_settings.description_label")}
                      </Text>
                      <Text className="text-foreground text-[15px]">
                        {gym.description ?? "—"}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-label uppercase tracking-wider text-muted mb-1">
                        {t("gym_settings.address_label")}
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
          <SectionHeader
            title={t("gym_settings.invite_management")}
            icon="link-outline"
          />

          <Card className="mx-5">
            {/* Permanent link */}
            <View className="px-4 py-4">
              <Text className="text-label uppercase tracking-wider text-muted mb-2">
                {t("gym_settings.permanent_link")}
              </Text>
              <Text className="text-muted text-caption mb-3 leading-relaxed">
                {t("gym_settings.permanent_link_description")}
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
                    label={t("gym_settings.share_link")}
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
                    label={
                      regeneratingToken
                        ? t("gym_settings.regenerating")
                        : t("gym_settings.regenerate")
                    }
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
                {t("gym_settings.temp_code")}
              </Text>
              <Text className="text-muted text-caption mb-3 leading-relaxed">
                {t("gym_settings.temp_code_description")}
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
                    ? t("gym_settings.generating")
                    : hasActiveCode
                      ? t("gym_settings.generate_new_code")
                      : t("gym_settings.generate_code")
                }
                variant="secondary"
                onPress={handleGenerateCode}
                disabled={generatingCode}
              />
            </View>
          </Card>

          {/* === DANGER ZONE === */}
          <SectionHeader
            title={t("gym_settings.danger_zone")}
            icon="warning-outline"
          />
          <View className="mx-5 mb-4">
            <Button
              label={
                deleting
                  ? t("gym_settings.deleting")
                  : t("gym_settings.delete_gym")
              }
              variant="destructive"
              onPress={handleDeleteGym}
              disabled={deleting}
              icon={
                <Ionicons name="trash-outline" size={16} color={colors.error} />
              }
            />
            <Text className="text-muted text-caption text-center mt-2">
              {t("gym_settings.delete_gym_description")}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmModal
        visible={regenerateLinkVisible}
        title={t("gym_settings.regenerate_link_title")}
        message={t("gym_settings.regenerate_link_message")}
        confirmLabel={t("gym_settings.regenerate_confirm")}
        variant="destructive"
        onCancel={() => setRegenerateLinkVisible(false)}
        onConfirm={() => {
          setRegenerateLinkVisible(false);
          if (gym) regenerateToken(gym.id);
        }}
      />
      <ConfirmModal
        visible={generateCodeVisible}
        title={t("gym_settings.generate_code_title")}
        message={t("gym_settings.generate_code_message")}
        confirmLabel={t("gym_settings.generate_code")}
        variant="primary"
        onCancel={() => setGenerateCodeVisible(false)}
        onConfirm={() => {
          setGenerateCodeVisible(false);
          if (gym) generateCode(gym.id);
        }}
      />
      <ConfirmModal
        visible={deleteGymVisible}
        title={t("gym_settings.delete_gym_title")}
        message={t("gym_settings.delete_gym_message", { gymName: gym?.name })}
        confirmLabel={t("gym_settings.delete_forever")}
        variant="destructive"
        isPending={deleting}
        onCancel={() => setDeleteGymVisible(false)}
        onConfirm={() => {
          if (gym)
            deleteGym(gym.id, {
              onSuccess: () => router.replace("/(tabs)/gym"),
              onError: () => {
                setDeleteGymVisible(false);
                showToast(t("common.error_generic"), "error");
              },
            });
        }}
      />
    </SafeAreaView>
  );
}
