import { useState } from "react";
import { View, Text, SectionList, TextInput, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMyLifts } from "@/hooks/useMyLifts";
import { ExerciseRow } from "@/components/exercises/ExerciseRow";
import { ExercisesEmptyState } from "@/components/exercises/ExercisesEmptyState";
import { AddExerciseModal } from "@/components/exercises/AddExerciseModal";
import { SectionHeader } from "@/components/ui/SectionHeader";

export default function HomeScreen() {
  const [search, setSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  const { unit, exerciseSummaries, sections, filtered, availableExercises, isLoading, isLoadingExercises } =
    useMyLifts(search);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-bg justify-center">
        <ActivityIndicator color="#AAFF45" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      {exerciseSummaries.length === 0 ? (
        <ExercisesEmptyState onAdd={() => setModalVisible(true)} />
      ) : (
        <>
          <View className="px-4 py-2">
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-[10px] text-foreground text-[15px]"
              placeholder="Search exercises..."
              placeholderTextColor="#5A5A5A"
              value={search}
              onChangeText={setSearch}
              clearButtonMode="while-editing"
            />
          </View>

          {filtered.length === 0 && search ? (
            <View className="flex-1 items-center pt-8">
              <Text className="text-sm text-muted">No results for "{search}"</Text>
            </View>
          ) : (
            <SectionList
              sections={sections}
              keyExtractor={(item) => item.exerciseId}
              renderItem={({ item }) => (
                <ExerciseRow
                  exerciseId={item.exerciseId}
                  name={item.name}
                  currentWeightKg={item.currentWeightKg}
                  trend={item.trend}
                  unit={unit}
                />
              )}
              renderSectionHeader={({ section }) => <SectionHeader title={section.title} />}
              stickySectionHeadersEnabled={false}
              contentContainerStyle={{ paddingBottom: 100 }}
            />
          )}
        </>
      )}

      <Pressable
        className="absolute bottom-6 right-4 bg-accent rounded-full px-4 py-[10px]"
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
        onPress={() => setModalVisible(true)}
      >
        <Text className="text-bg font-bold text-[15px]">+ Add Exercise</Text>
      </Pressable>

      <AddExerciseModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        availableExercises={availableExercises}
        isLoadingExercises={isLoadingExercises}
      />
    </SafeAreaView>
  );
}
