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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createMax } from "@/services/maxes.service";
import { WeightUnit } from "@/lib/units";

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
        <View className="flex-row justify-between items-center px-4 py-4 border-b border-border">
          <Text className="text-lg font-bold text-foreground">Add New Max</Text>
          <Pressable onPress={handleClose} hitSlop={12}>
            <Text className="text-lg text-muted p-1">✕</Text>
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1"
        >
          <View className="flex-1 p-4">
            <Text className="text-[11px] font-bold text-muted uppercase tracking-widest mb-1">
              1RM Weight ({unit})
            </Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-base mb-4"
              placeholder={unit === "kg" ? "e.g. 120" : "e.g. 265"}
              placeholderTextColor="#5A5A5A"
              keyboardType="decimal-pad"
              value={weight}
              onChangeText={setWeight}
              autoFocus
            />

            <Text className="text-[11px] font-bold text-muted uppercase tracking-widest mb-1">
              Notes (optional)
            </Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-base mb-6"
              placeholder="e.g. Competition PR, felt great"
              placeholderTextColor="#5A5A5A"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={2}
            />

            <Pressable
              className={`bg-accent rounded-xl p-4 items-center ${!canSubmit ? "opacity-40" : ""}`}
              onPress={() => mutation.mutate()}
              disabled={!canSubmit}
            >
              {mutation.isPending ? (
                <ActivityIndicator color="#0C0C0C" />
              ) : (
                <Text className="text-bg font-bold text-base">Save Max</Text>
              )}
            </Pressable>

            {mutation.isError && (
              <Text className="text-error text-sm text-center mt-2">
                Failed to save. Try again.
              </Text>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
