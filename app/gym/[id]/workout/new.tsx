import { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { addDays, format, parseISO } from "date-fns";
import { useCreateWorkout, useUpdateWorkout } from "@/hooks/useWorkouts";
import { isValidUUID } from "@/lib/constants";
import { useProfile } from "@/hooks/useProfile";
import { useMyGym } from "@/hooks/useGym";
import { useAppStore } from "@/stores/appStore";
import { colors } from "@/lib/theme";
import { Button } from "@/components/ui/Button";
import { WorkoutSectionCard } from "@/components/workout/WorkoutSectionCard";
import { WorkoutPreviewModal } from "@/components/workout/WorkoutPreviewModal";
import { SectionFormData, ItemFormData } from "@/components/workout/types";
import { getWorkoutById } from "@/services/workout.service";

function newSection(): SectionFormData {
  return {
    localId: Math.random().toString(36).slice(2),
    title: "",
    items: [],
  };
}

export default function NewWorkoutScreen() {
  const { id: gymId, workoutId, date } = useLocalSearchParams<{ id: string; workoutId?: string; date?: string }>();
  const isEditMode = !!workoutId;

  if (!isValidUUID(gymId) || (workoutId && !isValidUUID(workoutId))) {
    router.replace("/(tabs)/gym");
    return null;
  }

  const { data: gym } = useMyGym();
  const { data: profile } = useProfile();

  useEffect(() => {
    if (gym !== undefined && gym?.myRole !== "coach" && gym?.myRole !== "admin") {
      router.replace("/(tabs)/gym");
    }
  }, [gym?.myRole]);
  const unit = (profile?.unit_preference ?? "kg") as "kg" | "lbs";

  const createWorkout = useCreateWorkout();
  const updateWorkout = useUpdateWorkout();
  const setPendingGymDate = useAppStore((s) => s.setPendingGymDate);

  const [loading, setLoading] = useState(isEditMode);
  const [scheduledDate, setScheduledDate] = useState(() =>
    date ? parseISO(date) : addDays(new Date(), 1)
  );
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [sections, setSections] = useState<SectionFormData[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!isEditMode || !workoutId) return;

    getWorkoutById(workoutId)
      .then((workout) => {
        setTitle(workout.title ?? "");
        setNotes(workout.notes ?? "");
        setScheduledDate(parseISO(workout.scheduled_date));

        setSections(
          workout.sections.map((section) => ({
            localId: section.id,
            title: section.title,
            items: section.items.map((item): ItemFormData => ({
              localId: item.id,
              itemType: item.item_type,
              exerciseId: item.exercise_id ?? undefined,
              exerciseName: item.exercises?.name ?? undefined,
              sets: item.sets?.toString() ?? undefined,
              reps: item.reps?.toString() ?? undefined,
              weightMode: item.percentage ? "percentage" : "none",
              percentage: item.percentage?.toString() ?? undefined,
              maxTypeReference: item.max_type_reference ?? undefined,
              weightKg: item.weight_kg?.toString() ?? undefined,
              content: item.content ?? undefined,
              notes: item.notes ?? undefined,
            })),
          }))
        );
      })
      .catch(() => Alert.alert("Error", "Failed to load workout."))
      .finally(() => setLoading(false));
  }, [workoutId, isEditMode]);

  function updateSection(index: number, updated: SectionFormData) {
    setSections((prev) => {
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  }

  function deleteSection(index: number) {
    setSections((prev) => prev.filter((_, i) => i !== index));
  }

  function moveSection(from: number, to: number) {
    setSections((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  function buildWorkoutInput() {
    return {
      title: title.trim() || undefined,
      scheduledDate: format(scheduledDate, "yyyy-MM-dd"),
      notes: notes.trim() || undefined,
      sections: sections.map((s, si) => ({
        title: s.title,
        orderIndex: si,
        items: s.items.map((item, ii) => {
          const base = {
            orderIndex: ii,
            itemType: item.itemType as "structured" | "free_text",
            notes: item.notes?.trim() || undefined,
          };
          if (item.itemType === "free_text") {
            return { ...base, content: item.content };
          }
          return {
            ...base,
            exerciseId: item.exerciseId,
            sets: item.sets ? parseInt(item.sets, 10) : undefined,
            reps: item.reps ? parseInt(item.reps, 10) : undefined,
            percentage:
              item.weightMode === "percentage" && item.percentage
                ? parseFloat(item.percentage)
                : undefined,
            maxTypeReference:
              item.weightMode === "percentage" ? "1RM" : undefined,
          };
        }),
      })),
    };
  }

  async function handleSave() {
    if (!gymId) return;
    try {
      if (isEditMode && workoutId) {
        await updateWorkout.mutateAsync({ workoutId, input: buildWorkoutInput() });
      } else {
        await createWorkout.mutateAsync({ gymId, input: buildWorkoutInput() });
      }
      setPendingGymDate(scheduledDate);
      router.back();
    } catch {
      Alert.alert("Error", "Failed to save workout. Please try again.");
    }
  }

  const isSaving = createWorkout.isPending || updateWorkout.isPending;
  const formattedDate = format(scheduledDate, "EEE, MMM d");

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-bg justify-center items-center" edges={["top"]}>
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
        >
          <Ionicons name="close" size={24} color={colors.foreground} />
        </Pressable>
        <Text className="text-foreground text-base font-semibold">
          {isEditMode ? "Edit Workout" : "New Workout"}
        </Text>
        <Pressable
          onPress={() => setShowPreview(true)}
          className="w-10 h-10 items-center justify-center"
        >
          <Ionicons name="eye-outline" size={22} color={colors.accent} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Date picker */}
        <View className="bg-surface rounded-2xl p-4 border border-border mb-4">
          <Text className="text-label uppercase tracking-wider text-muted mb-3">
            Scheduled Date
          </Text>
          <View className="flex-row items-center justify-between">
            <Pressable
              className="w-11 h-11 bg-surface2 rounded-xl items-center justify-center"
              onPress={() => setScheduledDate((d) => addDays(d, -1))}
            >
              <Ionicons name="chevron-back" size={20} color={colors.foreground} />
            </Pressable>
            <Text className="text-foreground text-base font-semibold">{formattedDate}</Text>
            <Pressable
              className="w-11 h-11 bg-surface2 rounded-xl items-center justify-center"
              onPress={() => setScheduledDate((d) => addDays(d, 1))}
            >
              <Ionicons name="chevron-forward" size={20} color={colors.foreground} />
            </Pressable>
          </View>
        </View>

        {/* Title & Notes */}
        <View className="bg-surface rounded-2xl px-4 py-4 border border-border gap-3 mb-4">
          <TextInput
            className="text-foreground text-lg font-semibold"
            placeholder="Workout title (optional)"
            placeholderTextColor={colors.muted}
            value={title}
            onChangeText={setTitle}
          />
          <View className="h-px bg-border" />
          <TextInput
            className="text-foreground text-sm"
            placeholder="General notes (optional)"
            placeholderTextColor={colors.muted}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Sections */}
        <View className="gap-4">
          {sections.map((section, i) => (
            <WorkoutSectionCard
              key={section.localId}
              section={section}
              onUpdate={(updated) => updateSection(i, updated)}
              onDelete={() => deleteSection(i)}
              onMoveUp={() => moveSection(i, i - 1)}
              onMoveDown={() => moveSection(i, i + 1)}
              isFirst={i === 0}
              isLast={i === sections.length - 1}
              unit={unit}
            />
          ))}

          {/* Add Section */}
          <Pressable
            className="border-2 border-dashed border-border rounded-2xl py-5 items-center gap-1"
            onPress={() => setSections((prev) => [...prev, newSection()])}
          >
            <Ionicons name="add-circle-outline" size={22} color={colors.accent} />
            <Text className="text-accent text-sm font-medium">Add Section</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Bottom actions */}
      <View className="absolute bottom-0 left-0 right-0 px-4 pb-10 pt-4 bg-bg border-t border-border">
        <Button
          label={isSaving ? "Saving..." : isEditMode ? "Update Workout" : "Save Workout"}
          onPress={handleSave}
          disabled={isSaving}
        />
      </View>

      <WorkoutPreviewModal
        visible={showPreview}
        onClose={() => setShowPreview(false)}
        title={title}
        notes={notes}
        scheduledDate={formattedDate}
        sections={sections}
        unit={unit}
      />
    </SafeAreaView>
  );
}
