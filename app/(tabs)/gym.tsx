import { useState, useCallback, useMemo, useEffect } from "react";
import { View, Text, Pressable, ActivityIndicator, RefreshControl, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useFocusEffect } from "expo-router";
import { useMyGym, useLeaveGym } from "@/hooks/useGym";
import { useAppStore } from "@/stores/appStore";
import { useWorkoutsByDate } from "@/hooks/useWorkouts";
import { useMaxes } from "@/hooks/useMaxes";
import { useProfile } from "@/hooks/useProfile";
import { WorkoutDayView } from "@/components/gym/WorkoutDayView";
import { DateNavigator } from "@/components/gym/DateNavigator";
import { colors } from "@/lib/theme";

export default function GymScreen() {
  const { data: gym, isLoading: gymLoading, isFetched } = useMyGym();
  const { data: profile } = useProfile();
  const { data: maxesData } = useMaxes();

  const pendingGymDate = useAppStore((s) => s.pendingGymDate);
  const clearPendingGymDate = useAppStore((s) => s.clearPendingGymDate);

  // Hoist date state + workout query here so it fires as soon as gym.id is available
  // instead of waiting for InGymView to mount (eliminates render-cycle waterfall)
  const [selectedDate, setSelectedDate] = useState(new Date());

  useFocusEffect(
    useCallback(() => {
      if (pendingGymDate) {
        setSelectedDate(pendingGymDate);
        clearPendingGymDate();
      }
    }, [pendingGymDate, clearPendingGymDate])
  );
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const workoutsQuery = useWorkoutsByDate(gym?.id, dateStr);

  if (gymLoading && !isFetched) {
    return (
      <SafeAreaView className="flex-1 bg-bg justify-center items-center">
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  if (gym) {
    return (
      <InGymView
        gym={gym}
        profile={profile}
        maxesData={maxesData}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        workoutsQuery={workoutsQuery}
      />
    );
  }

  return <NoGymView />;
}

function NoGymView() {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <View className="flex-1 px-5 justify-center">
        <View className="items-center mb-8">
          <View className="w-20 h-20 rounded-3xl bg-surface items-center justify-center mb-6">
            <Ionicons name="fitness" size={36} color={colors.accent} />
          </View>
          <Text className="text-[28px] font-bold text-foreground tracking-tight text-center">
            Join your gym community
          </Text>
          <Text className="text-muted text-[15px] text-center mt-3 leading-relaxed">
            Connect with your gym to view workouts, track progress alongside teammates, and get guidance from coaches.
          </Text>
        </View>

        <View className="gap-3">
          <Pressable
            className="bg-accent rounded-2xl py-4 items-center"
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
            onPress={() => router.push("/gym/join")}
          >
            <Text className="text-bg font-bold text-[16px]">Join a Gym</Text>
          </Pressable>

          <Pressable
            className="bg-surface rounded-2xl py-4 items-center flex-row justify-center gap-2"
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
            onPress={() => router.push("/gym/create")}
          >
            <Ionicons name="add-circle-outline" size={18} color={colors.text} />
            <Text className="text-foreground font-semibold text-[16px]">Create a Gym</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function InGymView({
  gym,
  profile,
  maxesData,
  selectedDate,
  onDateChange,
  workoutsQuery,
}: {
  gym: any;
  profile: any;
  maxesData: any;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  workoutsQuery: ReturnType<typeof useWorkoutsByDate>;
}) {
  const { data: workouts, isLoading, refetch } = workoutsQuery;
  const [refreshing, setRefreshing] = useState(false);
  const { mutate: leaveGym, isPending: isLeaving } = useLeaveGym();

  const isAdmin = gym.myRole === "admin";
  const canCreateWorkout = gym.myRole === "admin" || gym.myRole === "coach";

  function handleLeaveGym() {
    if (!gym.membershipId) return;
    Alert.alert("Leave Gym", `Are you sure you want to leave ${gym.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: () => leaveGym(gym.membershipId, {
          onError: (err: Error) => Alert.alert("Error", err.message),
        }),
      },
    ]);
  }
  const unit = profile?.unit_preference ?? "kg";
  const roundingKg = profile?.rounding_increment_kg ?? 2.5;

  // Build exercise_id → latest max weight_kg map
  const maxMap = useMemo(() => {
    if (!maxesData) return {};
    const map: Record<string, number> = {};
    for (const max of maxesData) {
      if (!map[max.exercise_id]) {
        map[max.exercise_id] = max.weight_kg;
      }
    }
    return map;
  }, [maxesData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-3 pb-1">
        <View className="flex-row items-center gap-3 flex-1">
          {gym.logo_url ? (
            <Image
              source={{ uri: gym.logo_url }}
              style={{ width: 36, height: 36, borderRadius: 10 }}
              contentFit="cover"
            />
          ) : (
            <View className="w-9 h-9 rounded-[10px] bg-surface items-center justify-center">
              <Ionicons name="fitness" size={18} color={colors.accent} />
            </View>
          )}
          <Text className="text-foreground text-xl font-bold flex-shrink" numberOfLines={1}>
            {gym.name}
          </Text>
        </View>

        <View className="flex-row items-center">
          {canCreateWorkout && (
            <Pressable
              onPress={() => router.push(`/gym/${gym.id}/workout/new`)}
              className="p-2"
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Ionicons name="add" size={26} color={colors.accent} />
            </Pressable>
          )}
          {canCreateWorkout && (
            <Pressable
              onPress={() => router.push(`/gym/${gym.id}/members`)}
              className="p-2"
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Ionicons name="people-outline" size={22} color={colors.muted} />
            </Pressable>
          )}
          {isAdmin && (
            <Pressable
              onPress={() => router.push(`/gym/${gym.id}/settings`)}
              className="p-2"
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Ionicons name="settings-outline" size={22} color={colors.muted} />
            </Pressable>
          )}
          {!isAdmin && (
            <Pressable
              onPress={handleLeaveGym}
              disabled={isLeaving}
              className="p-2"
              style={({ pressed }) => ({ opacity: pressed || isLeaving ? 0.6 : 1 })}
            >
              <Ionicons name="exit-outline" size={22} color={colors.error} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Date navigator */}
      <View className="px-5">
        <DateNavigator date={selectedDate} onDateChange={onDateChange} />
      </View>

      {/* Workout content */}
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-8 flex-grow"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {isLoading ? (
          <View className="flex-1 justify-center items-center py-20">
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : (
          <WorkoutDayView
            workouts={workouts ?? []}
            maxMap={maxMap}
            unit={unit}
            roundingKg={roundingKg}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
