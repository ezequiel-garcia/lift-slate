import { EQUIPMENT_ORDER } from "@/lib/constants";
import { useEquipmentLabel } from "@/hooks/useEquipmentLabel";
import { colors } from "@/lib/theme";
import { createExercise } from "@/services/exercises.service";
import { useAppStore } from "@/stores/appStore";
import { Exercise, EquipmentType } from "@/types/exercise";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useExerciseName,
  useExerciseSearchMatch,
} from "@/hooks/useExerciseName";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  visible: boolean;
  onClose: () => void;
  availableExercises: Exercise[];
  isLoadingExercises: boolean;
};

export function AddExerciseModal({
  visible,
  onClose,
  availableExercises,
  isLoadingExercises,
}: Props) {
  const { t } = useTranslation();
  const getExerciseName = useExerciseName();
  const matchesSearch = useExerciseSearchMatch();
  const getEquipmentLabel = useEquipmentLabel();
  const [mode, setMode] = useState<"browse" | "create">("browse");
  const [search, setSearch] = useState("");
  const [customName, setCustomName] = useState("");
  const [customEquipment, setCustomEquipment] =
    useState<EquipmentType>("barbell");

  const queryClient = useQueryClient();
  const showToast = useAppStore((s) => s.showToast);

  const createMutation = useMutation({
    mutationFn: ({
      name,
      equipmentType,
    }: {
      name: string;
      equipmentType: EquipmentType;
    }) => createExercise(name, equipmentType),
    onSuccess: (exercise) => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      showToast(t("add_exercise.toast_added"));
      handleClose();
      router.push(`/exercise/${exercise.id}?addMax=true` as never);
    },
  });

  const handleClose = () => {
    setMode("browse");
    setSearch("");
    setCustomName("");
    setCustomEquipment("barbell");
    onClose();
  };

  const handlePickExercise = (id: string) => {
    handleClose();
    router.push(`/exercise/${id}?addMax=true` as never);
  };

  const handleCreate = () => {
    const name = customName.trim();
    if (!name) return;
    createMutation.mutate({ name, equipmentType: customEquipment });
  };

  const filtered = (
    search
      ? availableExercises.filter((e) => matchesSearch(e.name, search))
      : availableExercises
  )
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
        {/* Drag handle */}
        <View className="items-center pt-2.5 pb-1">
          <View className="w-9 h-1 rounded-full bg-surface2" />
        </View>

        {/* Header */}
        <View className="flex-row justify-between items-center px-5 pt-2 pb-4">
          <Text className="text-xl font-bold text-foreground">
            {mode === "browse"
              ? t("add_exercise.title_add")
              : t("add_exercise.title_create")}
          </Text>
          <Pressable
            onPress={handleClose}
            hitSlop={16}
            className="w-8 h-8 rounded-full bg-surface2 items-center justify-center"
          >
            <Ionicons name="close" size={18} color={colors.muted} />
          </Pressable>
        </View>

        {mode === "browse" ? (
          <>
            <View className="mx-5 mb-3 flex-row items-center bg-surface rounded-xl px-3.5">
              <Ionicons name="search" size={18} color={colors.muted} />
              <TextInput
                className="flex-1 py-3 px-2.5 text-foreground text-[16px]"
                placeholder={t("add_exercise.search_placeholder")}
                placeholderTextColor={colors.muted}
                value={search}
                onChangeText={setSearch}
              />
            </View>

            {isLoadingExercises ? (
              <ActivityIndicator color={colors.accent} className="flex-1" />
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={(e) => e.id}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <Pressable
                    className="flex-row items-center justify-between px-5 py-4"
                    style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                    onPress={() => handlePickExercise(item.id)}
                  >
                    <Text className="text-[16px] text-foreground flex-1">
                      {getExerciseName(item.name)}
                    </Text>
                    <Text className="text-sm text-muted ml-3">
                      {getEquipmentLabel(item.equipment_type)}
                    </Text>
                  </Pressable>
                )}
                ItemSeparatorComponent={() => (
                  <View className="h-px bg-border mx-5" />
                )}
                ListEmptyComponent={
                  <View className="items-center pt-8">
                    <Text className="text-base text-muted">
                      {search
                        ? t("add_exercise.no_results")
                        : t("add_exercise.all_added")}
                    </Text>
                  </View>
                }
                contentContainerStyle={{ flexGrow: 1 }}
              />
            )}

            <Pressable
              className="mx-5 my-4 p-4 rounded-2xl bg-surface items-center flex-row justify-center gap-2"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              onPress={() => {
                setSearch("");
                setMode("create");
              }}
            >
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={colors.accent}
              />
              <Text className="text-accent font-semibold text-[15px]">
                {t("add_exercise.create_custom")}
              </Text>
            </Pressable>
          </>
        ) : (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            className="flex-1"
          >
            <View className="flex-1 p-5">
              <Text className="text-[13px] font-semibold text-muted uppercase tracking-widest mb-2">
                {t("add_exercise.name_label")}
              </Text>
              <TextInput
                className="bg-surface rounded-xl px-4 py-3.5 text-foreground text-[16px]"
                placeholder={t("add_exercise.name_placeholder")}
                placeholderTextColor={colors.muted}
                value={customName}
                onChangeText={setCustomName}
                autoFocus
                maxLength={100}
              />

              <Text className="text-[13px] font-semibold text-muted uppercase tracking-widest mt-6 mb-3">
                {t("add_exercise.equipment_label")}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {EQUIPMENT_ORDER.map((eq) => (
                  <Pressable
                    key={eq}
                    className={`px-4 py-2.5 rounded-xl ${
                      customEquipment === eq ? "bg-accent/15" : "bg-surface"
                    }`}
                    style={
                      customEquipment === eq
                        ? { borderWidth: 1, borderColor: colors.accent }
                        : undefined
                    }
                    onPress={() => setCustomEquipment(eq)}
                  >
                    <Text
                      className={`text-[15px] ${
                        customEquipment === eq
                          ? "text-accent font-semibold"
                          : "text-muted"
                      }`}
                    >
                      {getEquipmentLabel(eq)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Pressable
                className={`mt-6 bg-accent rounded-2xl p-4 items-center ${
                  !customName.trim() || createMutation.isPending
                    ? "opacity-40"
                    : ""
                }`}
                onPress={handleCreate}
                disabled={!customName.trim() || createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <ActivityIndicator color={colors.bg} />
                ) : (
                  <Text className="text-bg font-bold text-[16px]">
                    {t("add_exercise.create_button")}
                  </Text>
                )}
              </Pressable>

              {createMutation.isError && (
                <Text className="text-error text-base text-center mt-3">
                  {t("add_exercise.error_create")}
                </Text>
              )}
            </View>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </Modal>
  );
}
