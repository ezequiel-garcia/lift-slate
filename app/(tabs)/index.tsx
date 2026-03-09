import { useState } from "react";
import { View, Text, SectionList, TextInput, Pressable, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useMyLifts } from "@/hooks/useMyLifts";
import { useDeleteExerciseMaxes } from "@/hooks/useMaxes";
import { ExerciseRow } from "@/components/exercises/ExerciseRow";
import { ExercisesEmptyState } from "@/components/exercises/ExercisesEmptyState";
import { AddExerciseModal } from "@/components/exercises/AddExerciseModal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ErrorState } from "@/components/ui/ErrorState";
import { colors } from "@/lib/theme";

export default function HomeScreen() {
  const [search, setSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { unit, exerciseSummaries, sections, filtered, availableExercises, isLoading, isLoadingExercises, isError, refetch } =
    useMyLifts(search);

  const { mutate: deleteExerciseMaxes } = useDeleteExerciseMaxes();

  function handleDeleteExercise(exerciseId: string, name: string) {
    Alert.alert(
      "Remove Exercise",
      `Remove ${name} from your lifts? All recorded maxes will be deleted.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => deleteExerciseMaxes(exerciseId),
        },
      ]
    );
  }

  async function handleRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-bg justify-center">
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <ErrorState message="Failed to load your lifts" onRetry={() => refetch()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      {exerciseSummaries.length === 0 ? (
        <ExercisesEmptyState onAdd={() => setModalVisible(true)} />
      ) : (
        <>
          <View className="px-5 pt-5 pb-3">
            <Text className="text-[28px] font-bold text-foreground mb-4 tracking-tight">
              My Lifts
            </Text>
            <View className="flex-row items-center bg-surface rounded-xl px-3.5">
              <Ionicons name="search" size={18} color={colors.muted} />
              <TextInput
                className="flex-1 py-3 px-2.5 text-foreground text-[16px]"
                placeholder="Search exercises..."
                placeholderTextColor={colors.muted}
                value={search}
                onChangeText={setSearch}
                clearButtonMode="while-editing"
              />
            </View>
          </View>

          {filtered.length === 0 && search ? (
            <View className="flex-1 items-center pt-12">
              <Text className="text-base text-muted">No results for "{search}"</Text>
            </View>
          ) : (
            <SectionList
              sections={sections}
              keyExtractor={(item) => item.exerciseId}
              renderItem={({ item }) => (
                <ExerciseRow
                  exerciseId={item.exerciseId}
                  name={item.name}
                  category={item.category}
                  currentWeightKg={item.currentWeightKg}
                  unit={unit}
                  onDelete={handleDeleteExercise}
                />
              )}
              renderSectionHeader={({ section }) => <SectionHeader title={section.title} />}
              stickySectionHeadersEnabled={false}
              contentContainerStyle={{ paddingBottom: 120 }}
              ItemSeparatorComponent={() => (
                <View className="h-px bg-border ml-[72px] mr-5" />
              )}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={colors.accent}
                />
              }
            />
          )}
        </>
      )}

      <Pressable
        className="absolute bottom-8 right-5 bg-accent rounded-2xl flex-row items-center px-5 py-3.5 gap-2"
        style={({ pressed }) => ({
          opacity: pressed ? 0.85 : 1,
          shadowColor: "#B4FF4A",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 12,
          elevation: 6,
        })}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={22} color={colors.bg} />
        <Text className="text-bg font-bold text-[15px]">Add Exercise</Text>
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
