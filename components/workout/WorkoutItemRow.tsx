import { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";
import {
  ItemFormData,
  DEFAULT_PRESCRIPTION_BY_EQUIPMENT,
  PRESCRIPTION_LABELS,
} from "./types";
import { ExercisePickerModal } from "./ExercisePickerModal";
import { PrescriptionPicker } from "./PrescriptionPicker";

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

  if (item.prescriptionMode === "percentage" && item.percentage) {
    parts.push(`@ ${item.percentage}%`);
  } else if (item.prescriptionMode === "absolute" && item.weightKg) {
    parts.push(`@ ${item.weightKg}kg`);
  } else if (
    item.prescriptionMode &&
    item.prescriptionMode !== "reps_only" &&
    item.prescriptionMode !== "percentage" &&
    item.prescriptionMode !== "absolute"
  ) {
    parts.push(`(${PRESCRIPTION_LABELS[item.prescriptionMode]})`);
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

      {/* Sets / Reps — single row */}
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
      </View>

      {/* Prescription picker — only for catalog exercises with known equipment */}
      {item.itemType === "exercise" && item.exerciseEquipment && (
        <PrescriptionPicker
          equipmentType={item.exerciseEquipment}
          mode={item.prescriptionMode}
          percentage={item.percentage}
          weightKg={item.weightKg}
          onChangeMode={(mode) =>
            update({
              prescriptionMode: mode,
              // Clear value fields when switching modes to avoid stale data
              percentage: mode === "percentage" ? item.percentage : undefined,
              weightKg: mode === "absolute" ? item.weightKg : undefined,
            })
          }
          onChangePercentage={(v) => update({ percentage: v || undefined })}
          onChangeWeightKg={(v) => update({ weightKg: v || undefined })}
        />
      )}

      {/* Custom item gets a free-form weight input */}
      {item.itemType === "custom_exercise" && (
        <View>
          <Text className="text-muted text-[10px] uppercase tracking-wider mb-1 ml-1">
            Weight (kg, optional)
          </Text>
          <TextInput
            className="bg-surface text-foreground rounded-lg px-3 py-2 border border-border text-sm text-center"
            placeholder="—"
            placeholderTextColor={colors.muted}
            value={item.weightKg ?? ""}
            onChangeText={(v) => update({ weightKg: v || undefined })}
            keyboardType="decimal-pad"
          />
        </View>
      )}

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
        onSelect={(id, name, equipmentType) => {
          // If equipment changed, reset prescription mode to that equipment's default
          const equipmentChanged = item.exerciseEquipment !== equipmentType;
          update({
            exerciseId: id,
            exerciseName: name,
            exerciseEquipment: equipmentType,
            ...(equipmentChanged
              ? {
                  prescriptionMode:
                    DEFAULT_PRESCRIPTION_BY_EQUIPMENT[equipmentType],
                  percentage: undefined,
                  weightKg: undefined,
                }
              : {}),
          });
          setShowExercisePicker(false);
        }}
      />
    </View>
  );
}
