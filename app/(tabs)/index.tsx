import { useState, useCallback } from "react";
import {
  View,
  Text,
  SectionList,
  Pressable,
  RefreshControl,
  TextInput,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  useReducedMotion,
} from "react-native-reanimated";
import { useMyLifts } from "@/hooks/useMyLifts";
import { useDeleteAllReferencesForExercise } from "@/hooks/useExerciseReferences";
import { ExerciseRow } from "@/components/exercises/ExerciseRow";
import { AddExerciseModal } from "@/components/exercises/AddExerciseModal";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { ExerciseListSkeleton } from "@/components/ui/Skeleton";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { colors, animation } from "@/lib/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function HomeScreen() {
  const [search, setSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingDeleteExercise, setPendingDeleteExercise] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const reduceMotion = useReducedMotion();

  const {
    unit,
    exerciseSummaries,
    sections,
    filtered,
    availableExercises,
    isLoading,
    isLoadingExercises,
    isError,
    refetch,
  } = useMyLifts(search);

  const { mutate: deleteExerciseMaxes } = useDeleteAllReferencesForExercise();

  // FAB scroll behavior
  const fabTranslateY = useSharedValue(0);
  const lastScrollY = useSharedValue(0);

  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: fabTranslateY.value }],
  }));

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      if (reduceMotion) return;
      if (y > lastScrollY.value + 10 && y > 50) {
        // scrolling down — hide FAB
        fabTranslateY.value = withTiming(100, {
          duration: animation.duration.normal,
        });
      } else if (y < lastScrollY.value - 10 || y < 50) {
        // scrolling up — show FAB
        fabTranslateY.value = withTiming(0, {
          duration: animation.duration.normal,
        });
      }
      lastScrollY.value = y;
    },
    [reduceMotion, fabTranslateY, lastScrollY],
  );

  function handleDeleteExercise(exerciseId: string, name: string) {
    setPendingDeleteExercise({ id: exerciseId, name });
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
          <Text
            style={{
              fontFamily: "CormorantGaramond-Regular",
              fontSize: 56,
              lineHeight: 58,
              color: colors.foreground,
              letterSpacing: -1,
            }}
          >
            My <Text style={{ color: colors.accent }}>Lifts</Text>
          </Text>
        </View>
        <ExerciseListSkeleton count={6} />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <ErrorState
          message="Failed to load your lifts"
          onRetry={() => refetch()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      {exerciseSummaries.length === 0 ? (
        <View className="flex-1 justify-center">
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
        </View>
      ) : (
        <>
          <View className="px-5 pt-5 pb-3">
            <Text
              style={{
                fontFamily: "CormorantGaramond-Regular",
                fontSize: 56,
                lineHeight: 58,
                color: colors.foreground,
                letterSpacing: -1,
                marginBottom: 20,
              }}
            >
              My <Text style={{ color: colors.accent }}>Lifts</Text>
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                paddingBottom: 14,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Ionicons name="search" size={24} color={colors.muted} />
              <TextInput
                style={{
                  flex: 1,
                  color: colors.foreground,
                  fontSize: 20,
                  lineHeight: 24,
                  letterSpacing: 0,
                }}
                placeholderTextColor={colors.muted}
                selectionColor={colors.accent}
                placeholder="Search exercises"
                value={search}
                onChangeText={setSearch}
              />
            </View>
          </View>

          {filtered.length === 0 && search ? (
            <View className="flex-1 items-center pt-12">
              <Text className="text-body text-muted">
                No results for &quot;{search}&quot;
              </Text>
            </View>
          ) : (
            <SectionList
              sections={sections}
              keyExtractor={(item) => item.exerciseId}
              renderItem={({ item }) => (
                <ExerciseRow
                  exerciseId={item.exerciseId}
                  name={item.name}
                  equipmentType={item.equipmentType}
                  referenceType={item.referenceType}
                  currentWeightKg={item.currentWeightKg}
                  currentReps={item.currentReps}
                  unit={unit}
                  onDelete={handleDeleteExercise}
                />
              )}
              renderSectionHeader={({ section }) => (
                <View className="px-5 pt-6 pb-2.5 bg-bg flex-row items-center">
                  <Text
                    style={{
                      fontFamily: "CormorantGaramond-Regular",
                      color: colors.accent,
                      fontSize: 20,
                      lineHeight: 24,
                    }}
                  >
                    {section.title}
                  </Text>
                  <View
                    style={{
                      flex: 1,
                      height: 1,
                      backgroundColor: colors.hairline,
                      marginLeft: 14,
                    }}
                  />
                </View>
              )}
              stickySectionHeadersEnabled={false}
              contentContainerStyle={{ paddingBottom: 120 }}
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
              shadowColor: colors.accent,
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
      <ConfirmModal
        visible={pendingDeleteExercise !== null}
        title="Remove Exercise"
        message={`Remove ${pendingDeleteExercise?.name ?? "this exercise"} from your lifts? All recorded maxes will be deleted.`}
        confirmLabel="Remove"
        variant="destructive"
        onCancel={() => setPendingDeleteExercise(null)}
        onConfirm={() => {
          if (pendingDeleteExercise)
            deleteExerciseMaxes(pendingDeleteExercise.id);
          setPendingDeleteExercise(null);
        }}
      />
    </SafeAreaView>
  );
}
