import { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";
import { ItemFormData } from "./types";
import { ExercisePickerModal } from "./ExercisePickerModal";

type Props = {
  item: ItemFormData;
  onUpdate: (updated: ItemFormData) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  unit: "kg" | "lbs";
};

export function WorkoutItemForm({
  item,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  unit,
}: Props) {
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [showNotes, setShowNotes] = useState(!!item.notes);

  function update(patch: Partial<ItemFormData>) {
    onUpdate({ ...item, ...patch });
  }

  const moveControls = (
    <View className="flex-row items-center gap-1">
      <Pressable onPress={onMoveUp} disabled={isFirst} className="p-1">
        <Ionicons
          name="chevron-up"
          size={18}
          color={isFirst ? colors.muted : colors.foreground}
        />
      </Pressable>
      <Pressable onPress={onMoveDown} disabled={isLast} className="p-1">
        <Ionicons
          name="chevron-down"
          size={18}
          color={isLast ? colors.muted : colors.foreground}
        />
      </Pressable>
      <Pressable onPress={onDelete} className="p-1">
        <Ionicons name="trash-outline" size={16} color={colors.error} />
      </Pressable>
    </View>
  );

  if (item.itemType === "free_text") {
    return (
      <View className="bg-surface2 rounded-xl p-4 gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-muted text-xs font-semibold uppercase tracking-wider">
            Free Text
          </Text>
          {moveControls}
        </View>

        <TextInput
          className="bg-surface text-foreground rounded-lg px-3 py-2.5 border border-border text-sm"
          placeholder="Enter text..."
          placeholderTextColor={colors.muted}
          value={item.content ?? ""}
          onChangeText={(v) => update({ content: v })}
          multiline
          numberOfLines={3}
        />

        {showNotes ? (
          <TextInput
            className="bg-surface text-foreground rounded-lg px-3 py-2 border border-border text-sm"
            placeholder="Notes..."
            placeholderTextColor={colors.muted}
            value={item.notes ?? ""}
            onChangeText={(v) => update({ notes: v })}
          />
        ) : (
          <Pressable onPress={() => setShowNotes(true)}>
            <Text className="text-muted text-xs">+ Add notes</Text>
          </Pressable>
        )}
      </View>
    );
  }

  // structured
  return (
    <View className="bg-surface2 rounded-xl p-4 gap-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-muted text-xs font-semibold uppercase tracking-wider">
          Exercise
        </Text>
        {moveControls}
      </View>

      {/* Exercise picker trigger */}
      <Pressable
        className="bg-surface rounded-xl px-4 py-3 border border-border flex-row items-center justify-between"
        onPress={() => setShowExercisePicker(true)}
      >
        <Text
          className={
            item.exerciseName
              ? "text-foreground text-base"
              : "text-muted text-base"
          }
        >
          {item.exerciseName ?? "Select exercise..."}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.muted} />
      </Pressable>

      {/* Sets & Reps */}
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Text className="text-muted text-xs mb-1.5">Sets</Text>
          <TextInput
            className="bg-surface text-foreground rounded-xl px-4 py-3 border border-border text-center text-base"
            placeholder="—"
            placeholderTextColor={colors.muted}
            value={item.sets ?? ""}
            onChangeText={(v) => update({ sets: v })}
            keyboardType="numeric"
          />
        </View>
        <View className="flex-1">
          <Text className="text-muted text-xs mb-1.5">Reps</Text>
          <TextInput
            className="bg-surface text-foreground rounded-xl px-4 py-3 border border-border text-center text-base"
            placeholder="—"
            placeholderTextColor={colors.muted}
            value={item.reps ?? ""}
            onChangeText={(v) => update({ reps: v })}
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Weight mode toggle */}
      <View className="flex-row bg-surface rounded-xl p-1 border border-border">
        <Pressable
          className={`flex-1 py-2 rounded-lg items-center ${item.weightMode === "percentage" ? "bg-accent" : ""}`}
          onPress={() => update({ weightMode: "percentage" })}
        >
          <Text
            className={`text-sm font-medium ${item.weightMode === "percentage" ? "text-bg" : "text-muted"}`}
          >
            % of 1RM
          </Text>
        </Pressable>
        <Pressable
          className={`flex-1 py-2 rounded-lg items-center ${item.weightMode === "none" ? "bg-accent" : ""}`}
          onPress={() =>
            update({
              weightMode: "none",
              percentage: undefined,
              weightKg: undefined,
            })
          }
        >
          <Text
            className={`text-sm font-medium ${item.weightMode === "none" ? "text-bg" : "text-muted"}`}
          >
            N/A
          </Text>
        </Pressable>
      </View>

      {/* Percentage input */}
      {item.weightMode === "percentage" && (
        <TextInput
          className="bg-surface text-foreground rounded-xl px-4 py-3 border border-border text-base"
          placeholder="Percentage (e.g. 80)"
          placeholderTextColor={colors.muted}
          value={item.percentage ?? ""}
          onChangeText={(v) => update({ percentage: v })}
          keyboardType="numeric"
        />
      )}

      {/* Notes */}
      {showNotes ? (
        <TextInput
          className="bg-surface text-foreground rounded-lg px-3 py-2 border border-border text-sm"
          placeholder="Notes..."
          placeholderTextColor={colors.muted}
          value={item.notes ?? ""}
          onChangeText={(v) => update({ notes: v })}
        />
      ) : (
        <Pressable onPress={() => setShowNotes(true)}>
          <Text className="text-muted text-xs">+ Add notes</Text>
        </Pressable>
      )}

      <ExercisePickerModal
        visible={showExercisePicker}
        onClose={() => setShowExercisePicker(false)}
        onSelect={(id, name) => update({ exerciseId: id, exerciseName: name })}
      />
    </View>
  );
}
