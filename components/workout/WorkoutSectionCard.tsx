import { colors } from "@/lib/theme";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { ExercisePickerModal } from "./ExercisePickerModal";
import { ItemFormData, SectionFormData } from "./types";
import { WorkoutItemRow } from "./WorkoutItemRow";

type Props = {
  section: SectionFormData;
  onUpdate: (updated: SectionFormData) => void;
  onDelete: () => void;
  /** When non-null, only this block id stays expanded; others are collapsed. */
  openBlockId?: string | null;
  onOpenBlockChange?: (id: string | null) => void;
};

function newExerciseItem(): ItemFormData {
  return {
    localId: Math.random().toString(36).slice(2),
    itemType: "exercise",
    weightMode: "percentage",
    maxTypeReference: "1RM",
  };
}

function newCustomItem(): ItemFormData {
  return {
    localId: Math.random().toString(36).slice(2),
    itemType: "custom_exercise",
    weightMode: "none",
  };
}

export function WorkoutSectionCard({
  section,
  onUpdate,
  onDelete,
  openBlockId = null,
  onOpenBlockChange,
}: Props) {
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [localCollapsed, setLocalCollapsed] = useState(false);

  const inAccordion = openBlockId !== null;
  const forcedCollapsed = inAccordion && section.localId !== openBlockId;
  const blockCollapsed = inAccordion ? forcedCollapsed : localCollapsed;

  useEffect(() => {
    if (openBlockId === null) {
      setLocalCollapsed(false);
    }
  }, [openBlockId]);

  function expandThisBlock() {
    setLocalCollapsed(false);
    if (inAccordion) {
      onOpenBlockChange?.(section.localId);
    }
  }

  function toggleBlockCollapsed() {
    if (inAccordion) {
      if (forcedCollapsed) {
        onOpenBlockChange?.(section.localId);
      } else {
        onOpenBlockChange?.(null);
        setExpandedItemId(null);
      }
    } else {
      setLocalCollapsed((c) => {
        const next = !c;
        if (next) setExpandedItemId(null);
        return next;
      });
    }
  }

  function updateItem(index: number, updated: ItemFormData) {
    const items = [...section.items];
    items[index] = updated;
    onUpdate({ ...section, items });
  }

  function deleteItem(index: number) {
    onUpdate({
      ...section,
      items: section.items.filter((_, i) => i !== index),
    });
  }

  function addExercise(exerciseId: string, exerciseName: string) {
    const item = newExerciseItem();
    item.exerciseId = exerciseId;
    item.exerciseName = exerciseName;
    expandThisBlock();
    onUpdate({ ...section, items: [...section.items, item] });
    setExpandedItemId(item.localId);
  }

  function addCustomExercise() {
    const item = newCustomItem();
    expandThisBlock();
    onUpdate({ ...section, items: [...section.items, item] });
    setExpandedItemId(item.localId);
  }

  function confirmRemoveBlock() {
    Alert.alert(
      "Remove block?",
      `This removes "${section.title?.trim() || "this block"}" and every exercise inside it.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: onDelete },
      ],
    );
  }

  const exerciseCount = section.items.length;

  return (
    <View className="bg-surface rounded-2xl overflow-hidden border border-border">
      {/* Block header */}
      <View className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={toggleBlockCollapsed}
            accessibilityLabel={
              blockCollapsed ? "Expand block" : "Collapse block"
            }
            accessibilityRole="button"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            className="p-1.5 -ml-1"
          >
            <Ionicons
              name={blockCollapsed ? "chevron-forward" : "chevron-down"}
              size={20}
              color={colors.muted}
            />
          </Pressable>

          {blockCollapsed ? (
            <Pressable
              onPress={expandThisBlock}
              className="flex-1 min-w-0 pr-1"
              accessibilityRole="button"
              accessibilityLabel="Expand block"
            >
              <Text
                className="text-foreground text-base font-semibold"
                numberOfLines={1}
              >
                {section.title.trim() || "Untitled block"}
              </Text>
              <Text className="text-muted text-xs mt-0.5">
                {exerciseCount === 0
                  ? "No exercises"
                  : `${exerciseCount} ${exerciseCount === 1 ? "exercise" : "exercises"}`}
              </Text>
            </Pressable>
          ) : (
            <TextInput
              className="flex-1 text-foreground min-w-0 text-[16px] font-semibold py-0"
              placeholder="Block name..."
              placeholderTextColor={colors.muted}
              value={section.title}
              onChangeText={(v) => onUpdate({ ...section, title: v })}
            />
          )}

          <Pressable
            onPress={confirmRemoveBlock}
            accessibilityLabel="Remove block"
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="p-2 -mr-1"
          >
            <Ionicons name="close" size={22} color={colors.muted} />
          </Pressable>
        </View>
      </View>

      {!blockCollapsed && (
        <>
          {/* Divider */}
          <View className="h-px bg-border" />

          {/* Exercise list */}
          <View className="px-3 py-2">
            {section.items.length === 0 ? (
              <View className="py-6 items-center">
                <Text className="text-muted text-sm">No exercises yet</Text>
              </View>
            ) : (
              <View className="gap-1">
                {section.items.map((item, i) => (
                  <WorkoutItemRow
                    key={item.localId}
                    item={item}
                    isExpanded={expandedItemId === item.localId}
                    onToggleExpand={() =>
                      setExpandedItemId(
                        expandedItemId === item.localId ? null : item.localId,
                      )
                    }
                    onUpdate={(updated) => updateItem(i, updated)}
                    onDelete={() => deleteItem(i)}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Add exercise buttons */}
          <View className="px-3 pb-3 flex-row gap-2">
            <Pressable
              className="flex-1 flex-row items-center justify-center gap-1.5 bg-accent/10 rounded-xl py-3"
              onPress={() => setShowExercisePicker(true)}
            >
              <Ionicons name="add" size={16} color={colors.accent} />
              <Text className="text-accent text-sm font-semibold">
                Add another exercise
              </Text>
            </Pressable>
            <Pressable
              className="flex-1 flex-row items-center justify-center gap-1.5 bg-surface2 rounded-xl py-3"
              onPress={addCustomExercise}
            >
              <Ionicons name="add" size={16} color={colors.muted} />
              <Text className="text-muted text-sm font-semibold">
                Another custom exercise
              </Text>
            </Pressable>
          </View>
        </>
      )}

      <ExercisePickerModal
        visible={showExercisePicker}
        onClose={() => setShowExercisePicker(false)}
        onSelect={addExercise}
      />
    </View>
  );
}
