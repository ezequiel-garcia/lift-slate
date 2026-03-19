import { useState, useCallback } from "react";
import { View, Text, SectionList, Pressable, RefreshControl, Alert, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  useReducedMotion,
  FadeIn,
} from "react-native-reanimated";
import { useMyLifts } from "@/hooks/useMyLifts";
import { useDeleteExerciseMaxes } from "@/hooks/useMaxes";
import { ExerciseRow } from "@/components/exercises/ExerciseRow";
import { AddExerciseModal } from "@/components/exercises/AddExerciseModal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ExerciseListSkeleton } from "@/components/ui/Skeleton";
import { colors, animation } from "@/lib/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function HomeScreen() {
  const [search, setSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const reduceMotion = useReducedMotion();

  const { unit, exerciseSummaries, sections, filtered, availableExercises, isLoading, isLoadingExercises, isError, refetch } =
    useMyLifts(search);

  const { mutate: deleteExerciseMaxes } = useDeleteExerciseMaxes();

  // FAB scroll behavior
  const fabTranslateY = useSharedValue(0);
  const lastScrollY = useSharedValue(0);

  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: fabTranslateY.value }],
  }));

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    if (reduceMotion) return;
    if (y > lastScrollY.value + 10 && y > 50) {
      // scrolling down — hide FAB
      fabTranslateY.value = withTiming(100, { duration: animation.duration.normal });
    } else if (y < lastScrollY.value - 10 || y < 50) {
      // scrolling up — show FAB
      fabTranslateY.value = withTiming(0, { duration: animation.duration.normal });
    }
    lastScrollY.value = y;
  }, [reduceMotion]);

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
      <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
        <View className="px-5 pt-5 pb-3">
          <Text className="text-title text-foreground tracking-tight">My Lifts</Text>
        </View>
        <ExerciseListSkeleton count={6} />
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
        <EmptyState
          icon="barbell-outline"
          title="No lifts yet"
          description={"Track your 1RMs to auto-calculate\ntraining weights"}
          action={
            <Button
              label="Add your first exercise"
              onPress={() => setModalVisible(true)}
            />
          }
        />
      ) : (
        <>
          <View className="px-5 pt-5 pb-3">
            <Text className="text-title text-foreground mb-4 tracking-tight">
              My Lifts
            </Text>
            <Input
              placeholder="Search exercises..."
              value={search}
              onChangeText={setSearch}
              leftIcon={<Ionicons name="search" size={18} color={colors.muted} />}
            />
          </View>

          {filtered.length === 0 && search ? (
            <View className="flex-1 items-center pt-12">
              <Text className="text-body text-muted">No results for "{search}"</Text>
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
              onScroll={handleScroll}
              scrollEventThrottle={16}
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

      {exerciseSummaries.length > 0 && (
        <AnimatedPressable
          className="absolute bottom-8 right-5 bg-accent rounded-2xl flex-row items-center px-5 py-3.5 gap-2"
          style={[
            fabStyle,
            {
              shadowColor: "#B4FF4A",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 12,
              elevation: 6,
            },
          ]}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={22} color={colors.bg} />
          <Text className="text-bg font-bold text-[15px]">Add Exercise</Text>
        </AnimatedPressable>
      )}

      <AddExerciseModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        availableExercises={availableExercises}
        isLoadingExercises={isLoadingExercises}
      />
    </SafeAreaView>
  );
}
