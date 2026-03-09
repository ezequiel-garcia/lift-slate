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
import { WeightUnit } from "@/lib/units";
import { useAppStore } from "@/stores/appStore";
import { colors } from "@/lib/theme";

type Props = {
  visible: boolean;
  exerciseId: string;
  unit: WeightUnit;
  onClose: () => void;
};

export function AddMaxModal({ visible, exerciseId, unit, onClose }: Props) {
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");

  const queryClient = useQueryClient();
  const showToast = useAppStore((s) => s.showToast);

  const mutation = useMutation({
    mutationFn: () =>
      createMax({
        exerciseId,
        weight: parseFloat(weight),
        unit,
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maxes"] });
      queryClient.invalidateQueries({ queryKey: ["maxes", "history", exerciseId] });
      showToast("Max saved!");
      handleClose();
    },
  });

  const handleClose = () => {
    setWeight("");
    setNotes("");
    onClose();
  };

  const canSubmit =
    weight.trim().length > 0 &&
    !isNaN(parseFloat(weight)) &&
    parseFloat(weight) > 0 &&
    !mutation.isPending;

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
