import { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createExercise } from "@/services/exercises.service";
import { CATEGORY_ORDER, CATEGORY_LABELS } from "@/lib/constants";
import { ExerciseCategory, Exercise } from "@/types/exercise";
import { useAppStore } from "@/stores/appStore";

type Props = {
  visible: boolean;
  onClose: () => void;
  availableExercises: Exercise[];
  isLoadingExercises: boolean;
};

export function AddExerciseModal({
  visible,
  onClose,
  availableExercises,
  isLoadingExercises,
}: Props) {
  const [mode, setMode] = useState<"browse" | "create">("browse");
  const [search, setSearch] = useState("");
  const [customName, setCustomName] = useState("");
  const [customCategory, setCustomCategory] = useState<ExerciseCategory | null>(null);

  const queryClient = useQueryClient();
  const showToast = useAppStore((s) => s.showToast);

  const createMutation = useMutation({
    mutationFn: ({ name, category }: { name: string; category?: ExerciseCategory }) =>
      createExercise(name, category),
    onSuccess: (exercise) => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      showToast("Exercise added!");
      handleClose();
      router.push(`/exercise/${exercise.id}?addMax=true` as never);
    },
  });

  const handleClose = () => {
    setMode("browse");
    setSearch("");
    setCustomName("");
    setCustomCategory(null);
    onClose();
  };

  const handlePickExercise = (id: string) => {
    handleClose();
    router.push(`/exercise/${id}?addMax=true` as never);
  };

  const handleCreate = () => {
    const name = customName.trim();
    if (!name) return;
    createMutation.mutate({ name, category: customCategory ?? undefined });
  };

  const filtered = search
    ? availableExercises.filter((e) =>
        e.name.toLowerCase().includes(search.toLowerCase()),
      )
    : availableExercises;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
        {/* Header */}
        <View className="flex-row justify-between items-center px-4 py-4 border-b border-border">
          <Text className="text-lg font-bold text-foreground">
            {mode === "browse" ? "Add Exercise" : "Create Exercise"}
          </Text>
          <Pressable onPress={handleClose} hitSlop={12}>
            <Text className="text-lg text-muted p-1">✕</Text>
          </Pressable>
        </View>

        {mode === "browse" ? (
          <>
            <TextInput
              className="mx-4 my-4 bg-surface border border-border rounded-xl px-4 py-[10px] text-foreground text-[15px]"
              placeholder="Search exercises..."
              placeholderTextColor="#5A5A5A"
              value={search}
              onChangeText={setSearch}
              autoFocus
            />

            {isLoadingExercises ? (
              <ActivityIndicator color="#AAFF45" className="flex-1" />
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={(e) => e.id}
                renderItem={({ item }) => (
                  <Pressable
                    className="flex-row items-center justify-between px-4 py-[14px] border-b border-border"
                    onPress={() => handlePickExercise(item.id)}
                  >
                    <Text className="text-base text-foreground flex-1">{item.name}</Text>
                    {item.category && (
                      <Text className="text-xs text-muted">
                        {CATEGORY_LABELS[item.category]}
                      </Text>
                    )}
                  </Pressable>
                )}
                ListEmptyComponent={
                  <View className="items-center pt-8">
                    <Text className="text-sm text-muted">
                      {search ? "No exercises found" : "All exercises already added"}
                    </Text>
                  </View>
                }
                contentContainerStyle={{ flexGrow: 1 }}
              />
            )}

            <Pressable
              className="mx-4 my-4 p-4 rounded-xl border border-border items-center"
              onPress={() => {
                setSearch("");
                setMode("create");
              }}
            >
              <Text className="text-accent font-semibold text-[15px]">
                + Create custom exercise
              </Text>
            </Pressable>
          </>
        ) : (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            className="flex-1"
          >
            <View className="flex-1 p-4">
              <Text className="text-[11px] font-bold text-muted uppercase tracking-widest mb-1">
                Name
              </Text>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-base"
                placeholder="e.g. Romanian Deadlift"
                placeholderTextColor="#5A5A5A"
                value={customName}
                onChangeText={setCustomName}
                autoFocus
                maxLength={100}
              />

              <Text className="text-[11px] font-bold text-muted uppercase tracking-widest mt-4 mb-2">
                Category (optional)
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {CATEGORY_ORDER.map((cat) => (
                  <Pressable
                    key={cat}
                    className={`px-4 py-[6px] rounded-full border ${
                      customCategory === cat
                        ? "border-accent bg-accent/10"
                        : "border-border bg-surface"
                    }`}
                    onPress={() =>
                      setCustomCategory(customCategory === cat ? null : cat)
                    }
                  >
                    <Text
                      className={`text-sm ${
                        customCategory === cat
                          ? "text-accent font-semibold"
                          : "text-muted"
                      }`}
                    >
                      {CATEGORY_LABELS[cat]}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Pressable
                className={`mt-6 bg-accent rounded-xl p-4 items-center ${
                  !customName.trim() || createMutation.isPending ? "opacity-40" : ""
                }`}
                onPress={handleCreate}
                disabled={!customName.trim() || createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <ActivityIndicator color="#0C0C0C" />
                ) : (
                  <Text className="text-bg font-bold text-base">Create Exercise</Text>
                )}
              </Pressable>

              {createMutation.isError && (
                <Text className="text-error text-sm text-center mt-2">
                  Failed to create exercise. Try again.
                </Text>
              )}
            </View>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </Modal>
  );
}
