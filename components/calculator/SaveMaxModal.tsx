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
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useExercises } from "@/hooks/useExercises";
import { useCreateExerciseReference } from "@/hooks/useExerciseReferences";
import { useAppStore } from "@/stores/appStore";
import { EQUIPMENT_LABELS } from "@/lib/constants";
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
  const { data: exercises = [], isLoading } = useExercises();
  const { mutate: saveMax, isPending: isSaving } = useCreateExerciseReference();
  const showToast = useAppStore((s) => s.showToast);

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const sortedExercises = [...exercises].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const filtered = search
    ? sortedExercises.filter((e) =>
        e.name.toLowerCase().includes(search.toLowerCase()),
      )
    : sortedExercises;

  function handleSave() {
    if (!selectedId) return;
    saveMax(
      {
        exerciseId: selectedId,
        weight: estimatedOneRM,
        unit,
        notes: `Estimated from ${sourceDescription} (Epley)`,
      },
      {
        onSuccess: () => {
          showToast("1RM saved!");
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
            Save 1RM to exercise
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
              No exercises yet
            </Text>
            <Text className="text-muted text-base text-center mb-6">
              Add an exercise from My Lifts to save your 1RM
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
                placeholder="Search exercises..."
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
                    No exercises found
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
                        {EQUIPMENT_LABELS[item.equipment_type]}
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
                  Cancel
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
                  <Text className="text-bg font-bold text-[15px]">Save</Text>
                )}
              </Pressable>
            </View>
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
}
