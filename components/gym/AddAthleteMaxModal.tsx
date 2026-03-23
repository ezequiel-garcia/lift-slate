import { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useCreateAthleteMax } from "@/hooks/useMaxes";
import { useExercises } from "@/hooks/useExercises";
import { WeightUnit } from "@/lib/units";
import { useAppStore } from "@/stores/appStore";
import { colors } from "@/lib/theme";
import { CATEGORY_LABELS } from "@/lib/constants";

type Props = {
  visible: boolean;
  userId: string;
  unit: WeightUnit;
  onClose: () => void;
};

export function AddAthleteMaxModal({ visible, userId, unit, onClose }: Props) {
  const [step, setStep] = useState<"exercise" | "weight">("exercise");
  const [search, setSearch] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<{ id: string; name: string } | null>(null);
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");

  const { data: exercises = [], isLoading: exercisesLoading } = useExercises();
  const { mutate: createMax, isPending, isError } = useCreateAthleteMax(userId);
  const showToast = useAppStore((s) => s.showToast);

  const filtered = search
    ? exercises.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()))
    : exercises;

  function handleClose() {
    setStep("exercise");
    setSearch("");
    setSelectedExercise(null);
    setWeight("");
    setNotes("");
    onClose();
  }

  function handleSelectExercise(id: string, name: string) {
    setSelectedExercise({ id, name });
    setSearch("");
    setStep("weight");
  }

  function handleSubmit() {
    if (!selectedExercise || !weight.trim()) return;
    createMax(
      {
        exerciseId: selectedExercise.id,
        weight: parseFloat(weight),
        unit,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          showToast("Max saved!");
          handleClose();
        },
      }
    );
  }

  const canSubmit =
    weight.trim().length > 0 &&
    !isNaN(parseFloat(weight)) &&
    parseFloat(weight) > 0 &&
    !isPending;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
        <View className="items-center pt-2.5 pb-1">
          <View className="w-9 h-1 rounded-full bg-surface2" />
        </View>

        <View className="flex-row justify-between items-center px-5 pt-2 pb-4">
          <View className="flex-row items-center gap-2">
            {step === "weight" && (
              <Pressable onPress={() => setStep("exercise")} hitSlop={12}>
                <Ionicons name="chevron-back" size={22} color={colors.foreground} />
              </Pressable>
            )}
            <Text className="text-xl font-bold text-foreground">
              {step === "exercise" ? "Select Exercise" : selectedExercise?.name}
            </Text>
          </View>
          <Pressable
            onPress={handleClose}
            hitSlop={16}
            className="w-8 h-8 rounded-full bg-surface2 items-center justify-center"
          >
            <Ionicons name="close" size={18} color={colors.muted} />
          </Pressable>
        </View>

        {step === "exercise" ? (
          <>
            <View className="mx-5 mb-3 flex-row items-center bg-surface rounded-xl px-3.5">
              <Ionicons name="search" size={18} color={colors.muted} />
              <TextInput
                className="flex-1 py-3 px-2.5 text-foreground text-[16px]"
                placeholder="Search exercises..."
                placeholderTextColor={colors.muted}
                value={search}
                onChangeText={setSearch}
                autoFocus
              />
            </View>

            {exercisesLoading ? (
              <ActivityIndicator color={colors.accent} className="flex-1" />
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={(e) => e.id}
                renderItem={({ item }) => (
                  <Pressable
                    className="flex-row items-center justify-between px-5 py-4"
                    style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                    onPress={() => handleSelectExercise(item.id, item.name)}
                  >
                    <Text className="text-[16px] text-foreground flex-1">{item.name}</Text>
                    {item.category && (
                      <Text className="text-sm text-muted ml-3">
                        {CATEGORY_LABELS[item.category]}
                      </Text>
                    )}
                  </Pressable>
                )}
                ItemSeparatorComponent={() => <View className="h-px bg-border mx-5" />}
                ListEmptyComponent={
                  <View className="items-center pt-8">
                    <Text className="text-base text-muted">No exercises found</Text>
                  </View>
                }
                contentContainerStyle={{ flexGrow: 1 }}
              />
            )}
          </>
        ) : (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            className="flex-1"
          >
            <View className="flex-1 p-5">
              <Text className="text-[13px] font-semibold text-muted uppercase tracking-widest mb-2">
                1RM Weight ({unit})
              </Text>
              <TextInput
                className="bg-surface rounded-xl px-4 py-3.5 text-foreground text-[18px] mb-5"
                placeholder={unit === "kg" ? "e.g. 120" : "e.g. 265"}
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
                value={weight}
                onChangeText={setWeight}
                autoFocus
              />

              <Text className="text-[13px] font-semibold text-muted uppercase tracking-widest mb-2">
                Notes (optional)
              </Text>
              <TextInput
                className="bg-surface rounded-xl px-4 py-3.5 text-foreground text-base mb-6"
                placeholder="e.g. Coach assessed, tested max"
                placeholderTextColor={colors.muted}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={2}
              />

              <Pressable
                className={`bg-accent rounded-2xl p-4 items-center ${!canSubmit ? "opacity-40" : ""}`}
                onPress={handleSubmit}
                disabled={!canSubmit}
              >
                {isPending ? (
                  <ActivityIndicator color={colors.bg} />
                ) : (
                  <Text className="text-bg font-bold text-[16px]">Save Max</Text>
                )}
              </Pressable>

              {isError && (
                <Text className="text-error text-base text-center mt-3">
                  Failed to save. Try again.
                </Text>
              )}
            </View>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </Modal>
  );
}
