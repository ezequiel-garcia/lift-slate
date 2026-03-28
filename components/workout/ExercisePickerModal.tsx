import { useExercises } from "@/hooks/useExercises";
import { CATEGORY_LABELS } from "@/lib/constants";
import { colors } from "@/lib/theme";
import { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (exerciseId: string, exerciseName: string) => void;
};

export function ExercisePickerModal({ visible, onClose, onSelect }: Props) {
  const [search, setSearch] = useState("");
  const { data: exercises = [] } = useExercises();

  const filtered = exercises.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()),
  );

  function handleSelect(exerciseId: string, exerciseName: string) {
    onSelect(exerciseId, exerciseName);
    setSearch("");
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-bg">
        <View className="flex-row items-center justify-between px-4 pt-6 pb-4 border-b border-border">
          <Text className="text-foreground text-lg font-semibold">
            Select Exercise
          </Text>
          <Pressable onPress={onClose}>
            <Text className="text-accent font-medium">Cancel</Text>
          </Pressable>
        </View>

        <View className="px-4 py-3 border-b border-border">
          <TextInput
            className="bg-surface text-foreground rounded-xl px-4 py-3 border border-border"
            placeholder="Search exercises..."
            placeholderTextColor={colors.muted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(e) => e.id}
          renderItem={({ item }) => (
            <Pressable
              className="px-4 py-3.5 border-b border-border flex-row items-center justify-between active:bg-surface"
              onPress={() => handleSelect(item.id, item.name)}
            >
              <Text className="text-foreground text-base">{item.name}</Text>
              {item.category && (
                <Text className="text-muted text-sm">
                  {CATEGORY_LABELS[
                    item.category as keyof typeof CATEGORY_LABELS
                  ] ?? item.category}
                </Text>
              )}
            </Pressable>
          )}
          ListEmptyComponent={
            <View className="py-12 items-center">
              <Text className="text-muted text-sm">No exercises found</Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
}
