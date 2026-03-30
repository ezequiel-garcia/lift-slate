import { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";
import { ItemFormData } from "./types";
import { ExercisePickerModal } from "./ExercisePickerModal";

type Props = {
  item: ItemFormData;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (updated: ItemFormData) => void;
  onDelete: () => void;
};

function formatSummary(item: ItemFormData): string {
  const parts: string[] = [];
  if (item.sets && item.reps) parts.push(`${item.sets}x${item.reps}`);
  else if (item.sets) parts.push(`${item.sets} sets`);
  else if (item.reps) parts.push(`${item.reps} reps`);

  if (item.weightMode === "percentage" && item.percentage) {
    parts.push(`@ ${item.percentage}%`);
  }
  return parts.join(" ");
}

export function WorkoutItemRow({
  item,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete,
}: Props) {
  const [showExercisePicker, setShowExercisePicker] = useState(false);

  function update(patch: Partial<ItemFormData>) {
    onUpdate({ ...item, ...patch });
  }

  const summary = formatSummary(item);
  const name =
    item.itemType === "exercise"
      ? item.exerciseName || "Select exercise..."
      : item.content || "Custom exercise...";
  const hasName =
    item.itemType === "exercise" ? !!item.exerciseName : !!item.content;

  // Collapsed row
  if (!isExpanded) {
    return (
      <Pressable
        className="flex-row items-center py-2.5 px-2 rounded-xl active:bg-surface2"
        onPress={onToggleExpand}
      >
        <Text
          className={`flex-1 text-sm ${hasName ? "text-foreground" : "text-muted"}`}
          numberOfLines={1}
        >
          {name}
        </Text>
        {!!summary && (
          <Text className="text-muted text-xs mr-2">{summary}</Text>
        )}
        {!!item.notes && (
          <Ionicons
            name="chatbubble-outline"
            size={12}
            color={colors.muted}
            style={{ marginRight: 4 }}
          />
        )}
        <Ionicons name="chevron-forward" size={14} color={colors.muted} />
      </Pressable>
    );
  }

  // Expanded row
  return (
    <View className="bg-surface2 rounded-xl p-3 gap-2.5">
      {/* Header: name + actions */}
      <View className="flex-row items-center justify-between">
        <Pressable
          className="flex-row items-center gap-1.5 flex-1"
          onPress={onToggleExpand}
        >
          <Ionicons
            name={
              item.itemType === "exercise"
                ? "barbell-outline"
                : "create-outline"
            }
            size={16}
            color={colors.accent}
          />
          <Text className="text-accent text-xs font-semibold uppercase tracking-wider">
            {item.itemType === "exercise" ? "Exercise" : "Custom"}
          </Text>
        </Pressable>
        <View className="flex-row items-center gap-0.5">
          <Pressable onPress={onDelete} className="p-1.5">
            <Ionicons name="trash-outline" size={14} color={colors.error} />
          </Pressable>
          <Pressable onPress={onToggleExpand} className="p-1.5">
            <Ionicons name="chevron-up" size={14} color={colors.accent} />
          </Pressable>
        </View>
      </View>

      {/* Exercise name / picker */}
      {item.itemType === "exercise" ? (
        <Pressable
          className="bg-surface rounded-lg px-3 py-2.5 flex-row items-center justify-between border border-border"
          onPress={() => setShowExercisePicker(true)}
        >
          <Text
            className={`text-sm ${item.exerciseName ? "text-foreground" : "text-muted"}`}
          >
            {item.exerciseName ?? "Select exercise..."}
          </Text>
          <Ionicons name="chevron-down" size={14} color={colors.muted} />
        </Pressable>
      ) : (
        <TextInput
          className="bg-surface text-foreground rounded-lg px-3 py-2.5 border border-border text-sm"
          placeholder="Exercise name..."
          placeholderTextColor={colors.muted}
          value={item.content ?? ""}
          onChangeText={(v) => update({ content: v })}
        />
      )}

      {/* Sets / Reps / % — single row */}
      <View className="flex-row gap-2">
        <View className="flex-1">
          <Text className="text-muted text-[10px] uppercase tracking-wider mb-1 ml-1">
            Sets
          </Text>
          <TextInput
            className="bg-surface text-foreground rounded-lg px-3 py-2 border border-border text-sm text-center"
            placeholder="—"
            placeholderTextColor={colors.muted}
            value={item.sets ?? ""}
            onChangeText={(v) => update({ sets: v })}
            keyboardType="numeric"
          />
        </View>
        <View className="flex-1">
          <Text className="text-muted text-[10px] uppercase tracking-wider mb-1 ml-1">
            Reps
          </Text>
          <TextInput
            className="bg-surface text-foreground rounded-lg px-3 py-2 border border-border text-sm text-center"
            placeholder="—"
            placeholderTextColor={colors.muted}
            value={item.reps ?? ""}
            onChangeText={(v) => update({ reps: v })}
            keyboardType="numeric"
          />
        </View>
        {item.itemType === "exercise" && (
          <View className="flex-1">
            <Text className="text-muted text-[10px] uppercase tracking-wider mb-1 ml-1">
              % 1RM
            </Text>
            <View className="flex-row items-center bg-surface rounded-lg border border-border">
              <TextInput
                className="flex-1 text-foreground px-3 py-2 text-sm text-center"
                placeholder="—"
                placeholderTextColor={colors.muted}
                value={
                  item.weightMode === "percentage"
                    ? (item.percentage ?? "")
                    : ""
                }
                onChangeText={(v) => {
                  if (v) {
                    update({ weightMode: "percentage", percentage: v });
                  } else {
                    update({
                      weightMode: "none",
                      percentage: undefined,
                    });
                  }
                }}
                keyboardType="numeric"
              />
              {item.weightMode === "percentage" && item.percentage && (
                <Text className="text-muted text-xs pr-2">%</Text>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Notes */}
      <TextInput
        className="bg-surface text-foreground rounded-lg px-3 py-2 border border-border text-sm"
        placeholder="Notes (e.g. Scale: empty bar, Tempo 3-1-1)"
        placeholderTextColor={colors.muted}
        value={item.notes ?? ""}
        onChangeText={(v) => update({ notes: v || undefined })}
        multiline
      />

      <ExercisePickerModal
        visible={showExercisePicker}
        onClose={() => setShowExercisePicker(false)}
        onSelect={(id, name) => {
          update({ exerciseId: id, exerciseName: name });
          setShowExercisePicker(false);
        }}
      />
    </View>
  );
}
