import { useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";
import { SectionFormData, ItemFormData } from "./types";
import { WorkoutItemForm } from "./WorkoutItemForm";

type Props = {
  section: SectionFormData;
  onUpdate: (updated: SectionFormData) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  unit: "kg" | "lbs";
};

function newItem(itemType: "structured" | "free_text"): ItemFormData {
  return {
    localId: Math.random().toString(36).slice(2),
    itemType,
    weightMode: "percentage",
    maxTypeReference: "1RM",
  };
}

export function WorkoutSectionCard({
  section,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  unit,
}: Props) {
  const [showAddMenu, setShowAddMenu] = useState(false);

  function updateItem(index: number, updated: ItemFormData) {
    const items = [...section.items];
    items[index] = updated;
    onUpdate({ ...section, items });
  }

  function deleteItem(index: number) {
    onUpdate({ ...section, items: section.items.filter((_, i) => i !== index) });
  }

  function addItem(type: "structured" | "free_text") {
    onUpdate({ ...section, items: [...section.items, newItem(type)] });
    setShowAddMenu(false);
  }

  function moveItem(from: number, to: number) {
    const items = [...section.items];
    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);
    onUpdate({ ...section, items });
  }

  function handleDelete() {
    Alert.alert(
      "Delete Section",
      `Delete "${section.title || "this section"}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: onDelete },
      ]
    );
  }

  return (
    <View className="bg-surface rounded-2xl overflow-hidden border border-border">
      {/* Section header */}
      <View className="px-4 pt-4 pb-3 flex-row items-center gap-3 border-b border-border">
        <TextInput
          className="flex-1 text-foreground text-base font-semibold"
          placeholder="Section name..."
          placeholderTextColor={colors.muted}
          value={section.title}
          onChangeText={(v) => onUpdate({ ...section, title: v })}
        />
        <View className="flex-row items-center gap-1">
          <Pressable onPress={onMoveUp} disabled={isFirst} className="p-1">
            <Ionicons name="chevron-up" size={18} color={isFirst ? colors.muted : colors.foreground} />
          </Pressable>
          <Pressable onPress={onMoveDown} disabled={isLast} className="p-1">
            <Ionicons name="chevron-down" size={18} color={isLast ? colors.muted : colors.foreground} />
          </Pressable>
          <Pressable onPress={handleDelete} className="p-1">
            <Ionicons name="trash-outline" size={16} color={colors.error} />
          </Pressable>
        </View>
      </View>

      {/* Items */}
      <View className="px-4 py-3 gap-3">
        {section.items.map((item, i) => (
          <WorkoutItemForm
            key={item.localId}
            item={item}
            onUpdate={(updated) => updateItem(i, updated)}
            onDelete={() => deleteItem(i)}
            onMoveUp={() => moveItem(i, i - 1)}
            onMoveDown={() => moveItem(i, i + 1)}
            isFirst={i === 0}
            isLast={i === section.items.length - 1}
            unit={unit}
          />
        ))}

        {/* Add item */}
        {showAddMenu ? (
          <View className="flex-row gap-2">
            <Pressable
              className="flex-1 bg-surface2 rounded-xl py-3 items-center border border-border"
              onPress={() => addItem("structured")}
            >
              <Ionicons name="barbell-outline" size={16} color={colors.accent} />
              <Text className="text-accent text-xs font-medium mt-1">Exercise</Text>
            </Pressable>
            <Pressable
              className="flex-1 bg-surface2 rounded-xl py-3 items-center border border-border"
              onPress={() => addItem("free_text")}
            >
              <Ionicons name="text-outline" size={16} color={colors.accent} />
              <Text className="text-accent text-xs font-medium mt-1">Text</Text>
            </Pressable>
            <Pressable
              className="flex-1 bg-surface2 rounded-xl py-3 items-center border border-border"
              onPress={() => setShowAddMenu(false)}
            >
              <Ionicons name="close-outline" size={16} color={colors.muted} />
              <Text className="text-muted text-xs font-medium mt-1">Cancel</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            className="border border-dashed border-border rounded-xl py-3 items-center"
            onPress={() => setShowAddMenu(true)}
          >
            <Text className="text-accent text-sm font-medium">+ Add Item</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
