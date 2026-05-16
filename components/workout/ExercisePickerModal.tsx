import { useExercises } from "@/hooks/useExercises";
import { useEquipmentLabel } from "@/hooks/useEquipmentLabel";
import {
  useExerciseName,
  useExerciseSearchMatch,
} from "@/hooks/useExerciseName";
import { colors } from "@/lib/theme";
import { EquipmentType } from "@/types/exercise";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (
    exerciseId: string,
    exerciseName: string,
    equipmentType: EquipmentType,
  ) => void;
  onAddCustom?: (prefillText: string) => void;
};

export function ExercisePickerModal({
  visible,
  onClose,
  onSelect,
  onAddCustom,
}: Props) {
  const { t } = useTranslation();
  const getExerciseName = useExerciseName();
  const getEquipmentLabel = useEquipmentLabel();
  const matchesSearch = useExerciseSearchMatch();
  const [search, setSearch] = useState("");
  const { data: exercises = [] } = useExercises();

  const filtered = exercises.filter((e) => matchesSearch(e.name, search));

  function handleSelect(
    exerciseId: string,
    exerciseName: string,
    equipmentType: EquipmentType,
  ) {
    onSelect(exerciseId, exerciseName, equipmentType);
    setSearch("");
    onClose();
  }

  function handleAddCustom() {
    onAddCustom?.(search.trim());
    setSearch("");
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-bg">
        <View className="flex-row items-center justify-between px-4 pt-6 pb-4 border-b border-border">
          <Text className="text-foreground text-lg font-semibold">
            {t("workout.picker_title")}
          </Text>
          <Pressable onPress={onClose}>
            <Text className="text-accent font-medium">
              {t("common.cancel")}
            </Text>
          </Pressable>
        </View>

        <View className="px-4 py-3 border-b border-border">
          <TextInput
            className="bg-surface text-foreground rounded-xl px-4 py-3 border border-border"
            placeholder={t("workout.picker_search")}
            placeholderTextColor={colors.muted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {onAddCustom && (
          <Pressable
            className="px-4 py-2.5 border-b border-border flex-row items-center gap-2 active:bg-surface"
            onPress={handleAddCustom}
          >
            <Ionicons name="create-outline" size={16} color={colors.muted} />
            <Text className="text-muted text-sm" numberOfLines={1}>
              {search.trim()
                ? t("workout.picker_add_custom_named", { name: search.trim() })
                : t("workout.picker_add_custom")}
            </Text>
          </Pressable>
        )}

        <FlatList
          data={filtered}
          keyExtractor={(e) => e.id}
          renderItem={({ item }) => (
            <Pressable
              className="px-4 py-3.5 border-b border-border flex-row items-center justify-between active:bg-surface"
              onPress={() =>
                handleSelect(item.id, item.name, item.equipment_type)
              }
            >
              <Text className="text-foreground text-base">
                {getExerciseName(item.name)}
              </Text>
              <Text className="text-muted text-sm">
                {getEquipmentLabel(item.equipment_type)}
              </Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <View className="py-12 items-center px-4">
              {search.trim() && onAddCustom ? (
                <Pressable
                  className="bg-accent/10 rounded-xl px-5 py-3.5 flex-row items-center gap-2"
                  onPress={handleAddCustom}
                >
                  <Ionicons
                    name="create-outline"
                    size={18}
                    color={colors.accent}
                  />
                  <Text
                    className="text-accent text-sm font-semibold"
                    numberOfLines={1}
                  >
                    {t("workout.picker_add_custom_named", {
                      name: search.trim(),
                    })}
                  </Text>
                </Pressable>
              ) : (
                <Text className="text-muted text-sm">
                  {t("workout.picker_no_results")}
                </Text>
              )}
            </View>
          }
        />
      </View>
    </Modal>
  );
}
