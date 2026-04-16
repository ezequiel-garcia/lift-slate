import { DateNavigator } from "@/components/gym/DateNavigator";
import { GymBanner, type MyGym } from "@/components/gym/GymBanner";
import { WorkoutDayView } from "@/components/gym/WorkoutDayView";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LeaveGymModal } from "@/components/ui/LeaveGymModal";
import { useLeaveGym, useMyGym } from "@/hooks/useGym";
import { useMaxes } from "@/hooks/useMaxes";
import { useProfile } from "@/hooks/useProfile";
import { useDeleteWorkout, useWorkoutsByDate } from "@/hooks/useWorkouts";
import { colors } from "@/lib/theme";
import { getCurrentMaxes } from "@/services/maxes.service";
import { useAppStore } from "@/stores/appStore";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function GymScreen() {
  const { data: gym, isLoading: gymLoading, isFetched } = useMyGym();
  const { data: profile } = useProfile();
  const { data: maxesData } = useMaxes();

  const pendingGymDate = useAppStore((s) => s.pendingGymDate);
  const clearPendingGymDate = useAppStore((s) => s.clearPendingGymDate);

  const [selectedDate, setSelectedDate] = useState(new Date());

  useFocusEffect(
    useCallback(() => {
      if (pendingGymDate) {
        setSelectedDate(pendingGymDate);
        clearPendingGymDate();
      }
    }, [pendingGymDate, clearPendingGymDate]),
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
    <SafeAreaView className="flex-1 bg-bg justify-center" edges={["top"]}>
      <EmptyState
        icon="fitness-outline"
        title="Join your gym community"
        description="Connect with your gym to view workouts, track progress alongside teammates, and get guidance from coaches."
        action={
          <View className="gap-3">
            <Button
              label="Join a Gym"
              onPress={() => router.push("/gym/join")}
            />
            <Button
              label="Create a Gym"
              variant="secondary"
              onPress={() => router.push("/gym/create")}
              icon={
                <Ionicons
                  name="add-circle-outline"
                  size={18}
                  color={colors.foreground}
                />
              }
            />
          </View>
        }
      />
    </SafeAreaView>
  );
}

type MaxesData = Awaited<ReturnType<typeof getCurrentMaxes>>;

function InGymView({
  gym,
  profile,
  maxesData,
  selectedDate,
  onDateChange,
  workoutsQuery,
}: {
  gym: MyGym;
  profile: ReturnType<typeof useProfile>["data"];
  maxesData: MaxesData | undefined;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  workoutsQuery: ReturnType<typeof useWorkoutsByDate>;
}) {
  const { data: workouts, isLoading, refetch } = workoutsQuery;
  const [refreshing, setRefreshing] = useState(false);
  const [leaveModalVisible, setLeaveModalVisible] = useState(false);
  const { mutate: leaveGym, isPending: isLeaving } = useLeaveGym();
  const { mutate: deleteWorkout } = useDeleteWorkout();
  const showToast = useAppStore((s) => s.showToast);

  const isAdmin = gym.myRole === "admin";
  const canCreateWorkout = gym.myRole === "admin" || gym.myRole === "coach";

  function handleLeaveGym() {
    if (!gym.membershipId) return;
    leaveGym(gym.membershipId, {
      onError: (err: Error) => showToast(err.message, "error"),
    });
  }

  const unit = profile?.unit_preference ?? "kg";

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
      <View className="flex-row items-center justify-between px-5 pt-5 pb-3">
        <Text className="text-title text-foreground tracking-tight">
          My Gym
        </Text>
        <View className="flex-row items-center">
          {canCreateWorkout && (
            <Pressable
              onPress={() => router.push(`/gym/${gym.id}/members`)}
              className="w-11 h-11 items-center justify-center"
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Ionicons name="people-outline" size={22} color={colors.muted} />
            </Pressable>
          )}
          {isAdmin && (
            <Pressable
              onPress={() => router.push(`/gym/${gym.id}/settings`)}
              className="w-11 h-11 items-center justify-center"
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Ionicons
                name="settings-outline"
                size={22}
                color={colors.muted}
              />
            </Pressable>
          )}
          {canCreateWorkout && (
            <Pressable
              onPress={() => router.push(`/gym/${gym.id}/workout/new`)}
              className="w-11 h-11 items-center justify-center"
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Ionicons name="add" size={26} color={colors.accent} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Scrollable content */}
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
        {/* Gym banner card */}
        <View className="mt-2 mb-8">
          <GymBanner gym={gym} onLeave={() => setLeaveModalVisible(true)} />
        </View>

        {/* Date navigator */}
        <View className="mb-6">
          <DateNavigator date={selectedDate} onDateChange={onDateChange} />
        </View>

        {/* Workout section */}
        <View className="mb-8">
          {isLoading ? (
            <View className="py-12 items-center">
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : (
            <WorkoutDayView
              workouts={workouts ?? []}
              maxMap={maxMap}
              unit={unit}
              gymId={gym.id}
              canEditWorkout={canCreateWorkout}
              selectedDate={format(selectedDate, "yyyy-MM-dd")}
              onDeleteWorkout={(id) => deleteWorkout(id)}
            />
          )}
        </View>
      </ScrollView>
      <LeaveGymModal
        visible={leaveModalVisible}
        gymName={gym.name}
        isLeaving={isLeaving}
        onCancel={() => setLeaveModalVisible(false)}
        onConfirm={() => {
          setLeaveModalVisible(false);
          handleLeaveGym();
        }}
      />
    </SafeAreaView>
  );
}
