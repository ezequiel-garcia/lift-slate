import { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useExercises } from "@/hooks/useExercises";
import { useCreateExerciseReference } from "@/hooks/useExerciseReferences";
import { useAppStore } from "@/stores/appStore";
import { useExerciseSearchMatch } from "@/hooks/useExerciseName";
import { useEquipmentLabel } from "@/hooks/useEquipmentLabel";
import { WeightUnit } from "@/lib/units";
import { colors } from "@/lib/theme";

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Estimated 1RM in the user's display unit */
  estimatedOneRM: number;
  unit: WeightUnit;
  /** e.g. "100 kg x 5 reps" — used to build the note */
  sourceDescription: string;
};

export function SaveMaxModal({
  visible,
  onClose,
  estimatedOneRM,
  unit,
  sourceDescription,
}: Props) {
  const { t } = useTranslation();
  const getEquipmentLabel = useEquipmentLabel();
  const matchesSearch = useExerciseSearchMatch();
  const { data: exercises = [], isLoading } = useExercises();
  const { mutate: saveMax, isPending: isSaving } = useCreateExerciseReference();
  const showToast = useAppStore((s) => s.showToast);

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const sortedExercises = [...exercises].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const filtered = search
    ? sortedExercises.filter((e) => matchesSearch(e.name, search))
    : sortedExercises;

  function handleSave() {
    if (!selectedId) return;
    saveMax(
      {
        exerciseId: selectedId,
        weight: estimatedOneRM,
        unit,
        notes: t("save_max.estimated_from_note", {
          description: sourceDescription,
        }),
      },
      {
        onSuccess: () => {
          showToast(t("save_max.toast_saved"));
          handleClose();
        },
      },
    );
  }

  function handleClose() {
    setSearch("");
    setSelectedId(null);
    onClose();
  }

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
            {t("save_max.title")}
          </Text>
          <Pressable
            onPress={handleClose}
            hitSlop={16}
            className="w-8 h-8 rounded-full bg-surface2 items-center justify-center"
          >
            <Ionicons name="close" size={18} color={colors.muted} />
          </Pressable>
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.accent} style={{ flex: 1 }} />
        ) : exercises.length === 0 ? (
          // Empty state
          <View className="flex-1 items-center justify-center px-6">
            <Ionicons name="barbell-outline" size={40} color={colors.muted} />
            <Text className="text-foreground text-lg font-bold mt-4 mb-2 text-center">
              {t("save_max.empty_title")}
            </Text>
            <Text className="text-muted text-base text-center mb-6">
              {t("save_max.empty_description")}
            </Text>
            <Pressable
              className="bg-surface rounded-2xl px-6 py-3.5"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              onPress={handleClose}
            >
              <Text className="text-foreground font-semibold text-[15px]">
                Close
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Search */}
            <View className="mx-5 mb-3 flex-row items-center bg-surface rounded-xl px-3.5">
              <Ionicons name="search" size={18} color={colors.muted} />
              <TextInput
                className="flex-1 py-3 px-2.5 text-foreground text-[16px]"
                placeholder={t("save_max.search_placeholder")}
                placeholderTextColor={colors.muted}
                value={search}
                onChangeText={setSearch}
                autoFocus
                clearButtonMode="while-editing"
              />
            </View>

            {/* Exercise list */}
            <FlatList
              data={filtered}
              keyExtractor={(e) => e.id}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20 }}
              ItemSeparatorComponent={() => <View className="h-px bg-border" />}
              ListEmptyComponent={
                <View className="items-center pt-8">
                  <Text className="text-muted text-base">
                    {t("save_max.no_results")}
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const isSelected = selectedId === item.id;
                return (
                  <Pressable
                    className={`flex-row items-center justify-between py-4 ${isSelected ? "opacity-100" : ""}`}
                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                    onPress={() => setSelectedId(item.id)}
                  >
                    <Text
                      className={`text-[16px] flex-1 ${isSelected ? "text-accent font-semibold" : "text-foreground"}`}
                    >
                      {item.name}
                    </Text>
                    {isSelected ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.accent}
                      />
                    ) : (
                      <Text className="text-sm text-muted ml-3">
                        {getEquipmentLabel(item.equipment_type)}
                      </Text>
                    )}
                  </Pressable>
                );
              }}
            />

            {/* Actions */}
            <View className="flex-row gap-3 px-5 pt-3 pb-2">
              <Pressable
                className="flex-1 bg-surface rounded-2xl p-4 items-center"
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                onPress={handleClose}
              >
                <Text className="text-foreground font-semibold text-[15px]">
                  {t("common.cancel")}
                </Text>
              </Pressable>
              <Pressable
                className={`flex-1 bg-accent rounded-2xl p-4 items-center ${!selectedId || isSaving ? "opacity-40" : ""}`}
                onPress={handleSave}
                disabled={!selectedId || isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color={colors.bg} />
                ) : (
                  <Text className="text-bg font-bold text-[15px]">
                    {t("common.save")}
                  </Text>
                )}
              </Pressable>
            </View>
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
}
