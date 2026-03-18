import { useState, useEffect } from "react";
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
import { useUpdateAthleteMax } from "@/hooks/useMaxes";
import { fromKg, WeightUnit } from "@/lib/units";
import { useAppStore } from "@/stores/appStore";
import { colors } from "@/lib/theme";

type Props = {
  visible: boolean;
  userId: string;
  maxId: string;
  exerciseName: string;
  currentWeightKg: number;
  currentNotes: string | null;
  unit: WeightUnit;
  onClose: () => void;
};

export function EditAthleteMaxModal({
  visible,
  userId,
  maxId,
  exerciseName,
  currentWeightKg,
  currentNotes,
  unit,
  onClose,
}: Props) {
  const displayWeight = fromKg(currentWeightKg, unit);
  const [weight, setWeight] = useState(displayWeight.toFixed(1).replace(/\.0$/, ""));
  const [notes, setNotes] = useState(currentNotes ?? "");

  const { mutate: updateMax, isPending, isError } = useUpdateAthleteMax(userId);
  const showToast = useAppStore((s) => s.showToast);

  useEffect(() => {
    if (visible) {
      const dw = fromKg(currentWeightKg, unit);
      setWeight(dw.toFixed(1).replace(/\.0$/, ""));
      setNotes(currentNotes ?? "");
    }
  }, [visible, currentWeightKg, currentNotes, unit]);

  function handleSubmit() {
    if (!weight.trim()) return;
    updateMax(
      {
        id: maxId,
        input: {
          weight: parseFloat(weight),
          unit,
          notes: notes.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          showToast("Max updated!");
          onClose();
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
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
        <View className="items-center pt-2.5 pb-1">
          <View className="w-9 h-1 rounded-full bg-surface2" />
        </View>

        <View className="flex-row justify-between items-center px-5 pt-2 pb-4">
          <Text className="text-xl font-bold text-foreground">Edit {exerciseName}</Text>
          <Pressable
            onPress={onClose}
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
            <Text className="text-[13px] font-semibold text-muted uppercase tracking-widest mb-2">
              1RM Weight ({unit})
            </Text>
            <TextInput
              className="bg-surface rounded-xl px-4 py-3.5 text-foreground text-[18px] mb-5"
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
              placeholder="e.g. Updated by coach"
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
                <Text className="text-bg font-bold text-[16px]">Update Max</Text>
              )}
            </Pressable>

            {isError && (
              <Text className="text-error text-base text-center mt-3">
                Failed to update. Try again.
              </Text>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
