import { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createExerciseReference } from "@/services/exerciseReferences.service";
import { upsertExerciseNote } from "@/services/exercise_notes.service";
import { WeightUnit, formatWeight, toKg } from "@/lib/units";
import { estimate1RM, MAX_RELIABLE_REPS } from "@/lib/estimate";
import { useAppStore } from "@/stores/appStore";
import { colors } from "@/lib/theme";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { EquipmentType } from "@/types/exercise";

type EntryMode = "direct" | "estimate";

const MODE_SEGMENTS = [
  { value: "direct" as const, label: "Known 1RM" },
  { value: "estimate" as const, label: "Estimate" },
];

type Props = {
  visible: boolean;
  exerciseId: string;
  equipmentType?: EquipmentType;
  unit: WeightUnit;
  currentMaxKg?: number;
  onClose: () => void;
  onPR?: (newWeightKg: number) => void;
  showNotRelevant?: boolean;
};

function modalTitle(equipmentType?: EquipmentType): string {
  if (equipmentType === "bodyweight") return "Add Max Reps";
  if (
    equipmentType === "dumbbell" ||
    equipmentType === "kettlebell" ||
    equipmentType === "machine"
  )
    return "Add Working Weight";
  return "Add 1RM";
}

export function AddMaxModal({
  visible,
  exerciseId,
  equipmentType,
  unit,
  currentMaxKg,
  onClose,
  onPR,
  showNotRelevant,
}: Props) {
  const [mode, setMode] = useState<EntryMode>("direct");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [notes, setNotes] = useState("");

  const queryClient = useQueryClient();
  const showToast = useAppStore((s) => s.showToast);

  const isBodyweight = equipmentType === "bodyweight";
  const isWeightBased =
    !isBodyweight &&
    (equipmentType === "kettlebell" ||
      equipmentType === "machine" ||
      equipmentType === "other" ||
      equipmentType === "barbell" ||
      equipmentType === "dumbbell" ||
      equipmentType == null);
  const isOneRM = equipmentType == null || equipmentType === "barbell";

  const weightNum = parseFloat(weight);
  const repsNum = parseInt(reps, 10);
  const weightValid = !isNaN(weightNum) && weightNum > 0;
  const repsValid = !isNaN(repsNum) && repsNum >= 1;

  const estimated1RM =
    isOneRM && mode === "estimate" && weightValid && repsValid
      ? estimate1RM(weightNum, repsNum)
      : null;

  function referenceType() {
    if (isBodyweight) return "max_reps" as const;
    if (!isOneRM) return "working_weight" as const;
    return "one_rep_max" as const;
  }

  const mutation = useMutation({
    mutationFn: async () => {
      if (isBodyweight) {
        if (!repsValid) return;
        const userNote = notes.trim() || undefined;
        const created = await createExerciseReference({
          exerciseId,
          referenceType: "max_reps",
          reps: repsNum,
          notes: userNote,
        });
        return { created };
      }

      const submitWeight = isOneRM
        ? mode === "direct"
          ? weightNum
          : estimated1RM
        : weightNum;
      if (submitWeight == null || submitWeight <= 0) return;

      const autoNote =
        isOneRM && mode === "estimate" && weightValid && repsValid
          ? `Estimated from ${formatWeight(weightNum, unit)} x ${repsNum} reps (Epley)`
          : "";
      const userNote = notes.trim();
      const combinedNotes =
        isOneRM && mode === "estimate"
          ? [autoNote, userNote].filter(Boolean).join(" — ")
          : userNote || undefined;

      const created = await createExerciseReference({
        exerciseId,
        referenceType: referenceType(),
        weight: submitWeight,
        unit,
        notes: combinedNotes || undefined,
      });
      if (combinedNotes) {
        await upsertExerciseNote(exerciseId, combinedNotes);
      }
      return { submittedKg: toKg(submitWeight, unit), created };
    },
    onSuccess: (data) => {
      const created = (
        data as { created?: { id: string; recorded_at: string } }
      )?.created;
      if (created) {
        queryClient.setQueriesData(
          {
            queryKey: ["exercise_references", "history", exerciseId],
            exact: true,
          },
          (old: any[] | undefined) => [created, ...(old ?? [])],
        );
      }
      queryClient.invalidateQueries({ queryKey: ["exercise_references"] });
      queryClient.invalidateQueries({
        queryKey: ["exercise_references", "history", exerciseId],
      });
      queryClient.invalidateQueries({
        queryKey: ["exercise_note", exerciseId],
      });

      if (isBodyweight) {
        showToast("Max reps saved!");
        handleClose();
        return;
      }

      const submittedKg =
        (data as { submittedKg: number } | undefined)?.submittedKg ?? 0;
      const isPR = currentMaxKg == null || submittedKg > currentMaxKg;
      if (isPR && onPR && isOneRM) {
        handleClose();
        onPR(submittedKg);
      } else {
        showToast(isOneRM ? "Max saved!" : "Working weight saved!");
        handleClose();
      }
    },
  });

  const canSubmit = (() => {
    if (mutation.isPending) return false;
    if (isBodyweight) return repsValid;
    if (isOneRM && mode === "estimate") return weightValid && repsValid;
    return weightValid;
  })();

  const handleClose = () => {
    setMode("direct");
    setWeight("");
    setReps("");
    setNotes("");
    onClose();
  };

  async function handleNotRelevant() {
    let created: any = null;
    if (isBodyweight) {
      created = await createExerciseReference({
        exerciseId,
        referenceType: "max_reps",
        reps: 0,
      });
    } else {
      created = await createExerciseReference({
        exerciseId,
        referenceType: referenceType(),
        weight: 0,
        unit: "kg",
      });
    }
    if (created) {
      queryClient.setQueriesData(
        {
          queryKey: ["exercise_references", "history", exerciseId],
          exact: true,
        },
        (old: any[] | undefined) => [created, ...(old ?? [])],
      );
    }
    queryClient.invalidateQueries({ queryKey: ["exercise_references"] });
    queryClient.invalidateQueries({
      queryKey: ["exercise_references", "history", exerciseId],
    });
    showToast("Exercise added!");
    handleClose();
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

        <View className="flex-row justify-between items-center px-5 pt-2 pb-4">
          <Text className="text-xl font-bold text-foreground">
            {modalTitle(equipmentType)}
          </Text>
          <Pressable
            onPress={handleClose}
            hitSlop={16}
            className="w-8 h-8 rounded-full bg-surface2 items-center justify-center"
          >
            <Ionicons name="close" size={18} color={colors.muted} />
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1"
        >
          <View className="flex-1 p-5">
            {/* Bodyweight: just reps */}
            {isBodyweight && (
              <>
                <Text className="text-[13px] font-semibold text-muted uppercase tracking-widest mb-2">
                  Max Reps
                </Text>
                <TextInput
                  className="bg-surface rounded-xl px-4 py-3.5 text-foreground text-[18px] mb-5"
                  placeholder="e.g. 15"
                  placeholderTextColor={colors.muted}
                  keyboardType="number-pad"
                  value={reps}
                  onChangeText={setReps}
                  autoFocus
                />
              </>
            )}

            {/* Kettlebell / machine / other: working weight */}
            {isWeightBased && !isOneRM && (
              <>
                <Text className="text-[13px] font-semibold text-muted uppercase tracking-widest mb-2">
                  Working Weight ({unit})
                </Text>
                <TextInput
                  className="bg-surface rounded-xl px-4 py-3.5 text-foreground text-[18px] mb-5"
                  placeholder={unit === "kg" ? "e.g. 24" : "e.g. 53"}
                  placeholderTextColor={colors.muted}
                  keyboardType="decimal-pad"
                  value={weight}
                  onChangeText={setWeight}
                  autoFocus
                />
              </>
            )}

            {/* Barbell / dumbbell / unknown: 1RM with Direct + Estimate tabs */}
            {isOneRM && (
              <>
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
              </>
            )}

            <Text className="text-[13px] font-semibold text-muted uppercase tracking-widest mb-2">
              Notes (optional)
            </Text>
            <TextInput
              className="bg-surface rounded-xl px-4 py-3.5 text-foreground text-base mb-6"
              placeholder="e.g. Competition PR, felt great"
              placeholderTextColor={colors.muted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={2}
            />

            <Pressable
              className={`bg-accent rounded-2xl p-4 items-center ${!canSubmit ? "opacity-40" : ""}`}
              onPress={() => mutation.mutate()}
              disabled={!canSubmit}
            >
              {mutation.isPending ? (
                <ActivityIndicator color={colors.bg} />
              ) : (
                <Text className="text-bg font-bold text-[16px]">
                  {isBodyweight
                    ? "Save Max Reps"
                    : isOneRM
                      ? "Save Max"
                      : "Save Working Weight"}
                </Text>
              )}
            </Pressable>

            {showNotRelevant && (
              <Pressable
                className="mt-3 p-4 items-center"
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                disabled={mutation.isPending}
                onPress={handleNotRelevant}
              >
                <Text className="text-muted font-semibold text-[15px]">
                  Not relevant
                </Text>
              </Pressable>
            )}

            {mutation.isError && (
              <Text className="text-error text-base text-center mt-3">
                Failed to save. Try again.
              </Text>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
