import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, useReducedMotion } from "react-native-reanimated";

import { colors } from "@/lib/theme";
import { useMyGym, useGymMembers, useGymSubscription, useRemoveMember } from "@/hooks/useGym";
import { useUpdateMemberRole } from "@/hooks/useRoles";
import { GymMember } from "@/services/gym.service";
import { Input } from "@/components/ui/Input";

type Role = "admin" | "coach" | "athlete";

function RoleBadge({ role }: { role: Role }) {
  if (role === "admin") {
    return (
      <View className="px-2.5 py-0.5 rounded-full bg-accent">
        <Text className="text-bg text-tiny font-bold">ADMIN</Text>
      </View>
    );
  }
  if (role === "coach") {
    return (
      <View className="px-2.5 py-0.5 rounded-full bg-surface2 border border-border">
        <Text className="text-foreground text-tiny font-bold">COACH</Text>
      </View>
    );
  }
  return (
    <View className="px-2.5 py-0.5 rounded-full bg-surface2">
      <Text className="text-muted text-tiny font-bold">ATHLETE</Text>
    </View>
  );
}

function MemberAvatar({ member }: { member: GymMember }) {
  if (member.users?.avatar_url) {
    return (
      <Image
        source={{ uri: member.users.avatar_url }}
        style={{ width: 40, height: 40, borderRadius: 20 }}
        contentFit="cover"
      />
    );
  }
  const name = member.users?.display_name || member.users?.email || "?";
  const initial = (name[0] ?? "?").toUpperCase();
  return (
    <View className="w-10 h-10 rounded-full bg-surface2 items-center justify-center">
      <Text className="text-foreground font-bold text-[15px]">{initial}</Text>
    </View>
  );
}

export default function GymMembersScreen() {
  const { id: gymId } = useLocalSearchParams<{ id: string }>();
  const { data: gym } = useMyGym();
  const { data: members, isLoading } = useGymMembers(gymId);
  const { data: sub } = useGymSubscription(gymId);
  const { mutate: updateRole, isPending: updatingRole } = useUpdateMemberRole();
  const { mutate: removeMember, isPending: removing } = useRemoveMember();
  const reduceMotion = useReducedMotion();

  const [search, setSearch] = useState("");

  const isAdmin = gym?.myRole === "admin";
  const isCoachOrAdmin = gym?.myRole === "coach" || gym?.myRole === "admin";

  useEffect(() => {
    if (gym !== undefined && !isCoachOrAdmin) {
      router.replace("/(tabs)/gym");
    }
  }, [gym?.myRole]);

  const filtered =
    members?.filter((m) => {
      const q = search.toLowerCase();
      return (
        !q ||
        (m.users?.display_name ?? "").toLowerCase().includes(q) ||
        (m.users?.email ?? "").toLowerCase().includes(q)
      );
    }) ?? [];

  const athleteCount = members?.filter((m) => m.role === "athlete").length ?? 0;
  const coachCount = members?.filter((m) => m.role === "coach").length ?? 0;

  function handleRoleToggle(member: GymMember) {
    const newRole = member.role === "coach" ? "athlete" : "coach";
    const label = newRole === "coach" ? "Make Coach" : "Make Athlete";
    Alert.alert(
      label,
      `Make ${member.users?.display_name ?? "this member"} a ${newRole}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: label, onPress: () => updateRole({ membershipId: member.id, newRole }) },
      ]
    );
  }

  function handleRemove(member: GymMember) {
    Alert.alert(
      "Remove Member",
      `Remove ${member.users?.display_name ?? member.users?.email ?? "this member"} from the gym? They will need to rejoin with an invite link.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => removeMember(member.id),
        },
      ]
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center px-4 pt-2 pb-3">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center -ml-1"
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <View className="flex-1 ml-1">
          <Text className="text-foreground text-xl font-bold">Members</Text>
          {members && (
            <Text className="text-muted text-caption">
              {members.length} member{members.length !== 1 ? "s" : ""}
              {sub
                ? `  ·  ${athleteCount}/${sub.max_athletes} athletes  ·  ${coachCount}/${sub.max_coaches} coaches`
                : ""}
            </Text>
          )}
        </View>
      </View>

      {/* Search */}
      <View className="px-5 pb-3">
        <Input
          placeholder="Search members..."
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          returnKeyType="search"
          leftIcon={<Ionicons name="search" size={16} color={colors.muted} />}
        />
      </View>

      {/* List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {filtered.map((member, idx) => {
            const canViewMaxes = isCoachOrAdmin && member.role !== "admin";
            return (
              <Animated.View
                key={member.id}
                entering={reduceMotion ? undefined : FadeIn.delay(Math.min(idx, 8) * 40).duration(300)}
              >
                <Pressable
                  className="bg-surface rounded-2xl px-4 py-3 flex-row items-center gap-3"
                  style={[
                    { marginBottom: idx < filtered.length - 1 ? 8 : 0 },
                  ]}
                  onPress={canViewMaxes ? () => router.push(`/gym/${gymId}/athlete/${member.user_id}`) : undefined}
                  disabled={!canViewMaxes}
                >
                  <MemberAvatar member={member} />

                  <View className="flex-1 min-w-0">
                    <Text className="text-foreground font-semibold text-[15px]" numberOfLines={1}>
                      {member.users?.display_name ?? "Unknown"}
                    </Text>
                    <Text className="text-muted text-caption" numberOfLines={1}>
                      {member.users?.email}
                    </Text>
                  </View>

                  <RoleBadge role={member.role as Role} />

                  {isAdmin && member.role !== "admin" && (
                    <View className="flex-row gap-1 ml-1">
                      <Pressable
                        onPress={() => handleRoleToggle(member)}
                        disabled={updatingRole || removing}
                        className="w-10 h-10 items-center justify-center"
                        style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                      >
                        <Ionicons
                          name={member.role === "coach" ? "person-outline" : "ribbon-outline"}
                          size={18}
                          color={colors.muted}
                        />
                      </Pressable>
                      <Pressable
                        onPress={() => handleRemove(member)}
                        disabled={updatingRole || removing}
                        className="w-10 h-10 items-center justify-center"
                        style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                      >
                        <Ionicons name="person-remove-outline" size={18} color={colors.error} />
                      </Pressable>
                    </View>
                  )}

                  {canViewMaxes && !isAdmin && (
                    <Ionicons name="chevron-forward" size={16} color={colors.border} style={{ marginLeft: 4 }} />
                  )}
                </Pressable>
              </Animated.View>
            );
          })}

          {filtered.length === 0 && (
            <View className="items-center py-12">
              <Text className="text-muted text-body">
                {search.length > 0 ? `No members match "${search}"` : "No members yet"}
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
