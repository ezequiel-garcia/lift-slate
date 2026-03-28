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
import { createMax } from "@/services/maxes.service";
import { upsertExerciseNote } from "@/services/exercise_notes.service";
import { WeightUnit, formatWeight } from "@/lib/units";
import { estimate1RM, MAX_RELIABLE_REPS } from "@/lib/estimate";
import { useAppStore } from "@/stores/appStore";
import { colors } from "@/lib/theme";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

type EntryMode = "direct" | "estimate";

const MODE_SEGMENTS = [
  { value: "direct" as const, label: "Known 1RM" },
  { value: "estimate" as const, label: "Estimate" },
];

type Props = {
  visible: boolean;
  exerciseId: string;
  unit: WeightUnit;
  onClose: () => void;
};

export function AddMaxModal({ visible, exerciseId, unit, onClose }: Props) {
  const [mode, setMode] = useState<EntryMode>("direct");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [notes, setNotes] = useState("");

  const queryClient = useQueryClient();
  const showToast = useAppStore((s) => s.showToast);

  const weightNum = parseFloat(weight);
  const repsNum = parseInt(reps, 10);
  const weightValid = !isNaN(weightNum) && weightNum > 0;
  const repsValid = !isNaN(repsNum) && repsNum >= 1;

  const estimated1RM =
    mode === "estimate" && weightValid && repsValid
      ? estimate1RM(weightNum, repsNum)
      : null;

  const mutation = useMutation({
    mutationFn: async () => {
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

      await createMax({
        exerciseId,
        weight: submitWeight,
        unit,
        notes: combinedNotes || undefined,
      });
      if (combinedNotes) {
        await upsertExerciseNote(exerciseId, combinedNotes);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maxes"] });
      queryClient.invalidateQueries({
        queryKey: ["maxes", "history", exerciseId],
      });
      queryClient.invalidateQueries({
        queryKey: ["exercise_note", exerciseId],
      });
      showToast("Max saved!");
      handleClose();
    },
  });

  const canSubmit =
    mode === "direct"
      ? weightValid && !mutation.isPending
      : weightValid && repsValid && !mutation.isPending;

  const handleClose = () => {
    setMode("direct");
    setWeight("");
    setReps("");
    setNotes("");
    onClose();
  };

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
          <Text className="text-xl font-bold text-foreground">Add New Max</Text>
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
                      {formatWeight(parseFloat(estimated1RM.toFixed(1)), unit)}
                    </Text>
                    <Text className="text-xs text-muted mt-1">
                      Based on {weight} {unit} x {repsNum} reps (Epley formula)
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
                <Text className="text-bg font-bold text-[16px]">Save Max</Text>
              )}
            </Pressable>

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
