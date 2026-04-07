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
import { WeightUnit, formatWeight } from "@/lib/units";
import { estimate1RM, MAX_RELIABLE_REPS } from "@/lib/estimate";
import { useAppStore } from "@/stores/appStore";
import { colors } from "@/lib/theme";
import { CATEGORY_LABELS } from "@/lib/constants";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

type EntryMode = "direct" | "estimate";

const MODE_SEGMENTS = [
  { value: "direct" as const, label: "Known 1RM" },
  { value: "estimate" as const, label: "Estimate" },
];

type Props = {
  visible: boolean;
  userId: string;
  unit: WeightUnit;
  onClose: () => void;
  initialExerciseId?: string;
  initialExerciseName?: string;
};

export function AddAthleteMaxModal({
  visible,
  userId,
  unit,
  onClose,
  initialExerciseId,
  initialExerciseName,
}: Props) {
  const [step, setStep] = useState<"exercise" | "weight">(
    initialExerciseId ? "weight" : "exercise",
  );
  const [search, setSearch] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<{
    id: string;
    name: string;
  } | null>(
    initialExerciseId
      ? { id: initialExerciseId, name: initialExerciseName! }
      : null,
  );
  const [mode, setMode] = useState<EntryMode>("direct");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [notes, setNotes] = useState("");

  const { data: exercises = [], isLoading: exercisesLoading } = useExercises();
  const { mutate: createMax, isPending, isError } = useCreateAthleteMax(userId);
  const showToast = useAppStore((s) => s.showToast);

  const filtered = search
    ? exercises.filter((e) =>
        e.name.toLowerCase().includes(search.toLowerCase()),
      )
    : exercises;

  const weightNum = parseFloat(weight);
  const repsNum = parseInt(reps, 10);
  const weightValid = !isNaN(weightNum) && weightNum > 0;
  const repsValid = !isNaN(repsNum) && repsNum >= 1;

  const estimated1RM =
    mode === "estimate" && weightValid && repsValid
      ? estimate1RM(weightNum, repsNum)
      : null;

  function handleClose() {
    setStep(initialExerciseId ? "weight" : "exercise");
    setSearch("");
    setSelectedExercise(
      initialExerciseId
        ? { id: initialExerciseId, name: initialExerciseName! }
        : null,
    );
    setMode("direct");
    setWeight("");
    setReps("");
    setNotes("");
    onClose();
  }

  function handleSelectExercise(id: string, name: string) {
    setSelectedExercise({ id, name });
    setSearch("");
    setStep("weight");
  }

  function handleSubmit() {
    if (!selectedExercise || !weightValid) return;
    const submitWeight = mode === "direct" ? weightNum : estimated1RM;
    if (submitWeight == null || submitWeight <= 0) return;

    const autoNote =
      mode === "estimate" && weightValid && repsValid
        ? `Estimated from ${formatWeight(weightNum, unit)} x ${repsNum} reps (Epley)`
        : "";
    const userNote = notes.trim();
    const combinedNotes =
      mode === "estimate"
        ? [autoNote, userNote].filter(Boolean).join(" — ")
        : userNote || undefined;

    createMax(
      {
        exerciseId: selectedExercise.id,
        weight: submitWeight,
        unit,
        notes: combinedNotes || undefined,
      },
      {
        onSuccess: () => {
          showToast("Max saved!");
          handleClose();
        },
      },
    );
  }

  const canSubmit =
    mode === "direct"
      ? weightValid && !isPending
      : weightValid && repsValid && !isPending;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
        <View className="items-center pt-2.5 pb-1">
          <View className="w-9 h-1 rounded-full bg-surface2" />
        </View>

        <View className="flex-row justify-between items-center px-5 pt-2 pb-4">
          <View className="flex-row items-center gap-2">
            {step === "weight" && (
              <Pressable onPress={() => setStep("exercise")} hitSlop={12}>
                <Ionicons
                  name="chevron-back"
                  size={22}
                  color={colors.foreground}
                />
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
                    <Text className="text-[16px] text-foreground flex-1">
                      {item.name}
                    </Text>
                    {item.category && (
                      <Text className="text-sm text-muted ml-3">
                        {CATEGORY_LABELS[item.category]}
                      </Text>
                    )}
                  </Pressable>
                )}
                ItemSeparatorComponent={() => (
                  <View className="h-px bg-border mx-5" />
                )}
                ListEmptyComponent={
                  <View className="items-center pt-8">
                    <Text className="text-base text-muted">
                      No exercises found
                    </Text>
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
              {/* Mode toggle */}
              <View className="mb-5">
                <SegmentedControl
                  segments={MODE_SEGMENTS}
                  selected={mode}
                  onChange={setMode}
                />
              </View>

              {mode === "direct" ? (
                <>
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
                </>
              ) : (
                <>
                  <Text className="text-[13px] font-semibold text-muted uppercase tracking-widest mb-2">
                    Weight Lifted ({unit})
                  </Text>
                  <TextInput
                    className="bg-surface rounded-xl px-4 py-3.5 text-foreground text-[18px] mb-5"
                    placeholder={unit === "kg" ? "e.g. 100" : "e.g. 225"}
                    placeholderTextColor={colors.muted}
                    keyboardType="decimal-pad"
                    value={weight}
                    onChangeText={setWeight}
                    autoFocus
                  />

                  <Text className="text-[13px] font-semibold text-muted uppercase tracking-widest mb-2">
                    Reps Performed
                  </Text>
                  <TextInput
                    className="bg-surface rounded-xl px-4 py-3.5 text-foreground text-[18px] mb-5"
                    placeholder="e.g. 5"
                    placeholderTextColor={colors.muted}
                    keyboardType="number-pad"
                    value={reps}
                    onChangeText={setReps}
                  />

                  {repsValid && repsNum > MAX_RELIABLE_REPS && (
                    <View className="flex-row items-center gap-2 mb-3 px-1">
                      <Ionicons
                        name="warning-outline"
                        size={16}
                        color={colors.error}
                      />
                      <Text className="text-error text-sm flex-1">
                        Estimates above {MAX_RELIABLE_REPS} reps are less
                        accurate.
                      </Text>
                    </View>
                  )}

                  {estimated1RM != null && (
                    <View className="bg-surface rounded-2xl p-4 mb-5">
                      <Text className="text-[13px] font-semibold text-muted uppercase tracking-widest mb-1">
                        Estimated 1RM
                      </Text>
                      <Text className="text-[28px] font-bold text-accent">
                        {formatWeight(
                          parseFloat(estimated1RM.toFixed(1)),
                          unit,
                        )}
                      </Text>
                      <Text className="text-xs text-muted mt-1">
                        Based on {weight} {unit} x {repsNum} reps (Epley
                        formula)
                      </Text>
                    </View>
                  )}
                </>
              )}

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
                  <Text className="text-bg font-bold text-[16px]">
                    Save Max
                  </Text>
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
