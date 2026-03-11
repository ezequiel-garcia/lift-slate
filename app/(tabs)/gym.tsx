import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMyGym } from "@/hooks/useGym";
import { colors } from "@/lib/theme";

export default function GymScreen() {
  const { data: gym, isLoading, isFetched } = useMyGym();

  if (isLoading && !isFetched) {
    return (
      <SafeAreaView className="flex-1 bg-bg justify-center items-center">
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  if (gym) {
    // In-gym view — to be built in Step 10
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <View className="px-5 pt-5">
          <Text className="text-[28px] font-bold text-foreground tracking-tight">{gym.name}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <View className="flex-1 px-5 justify-center">
        {/* Icon */}
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

        {/* Actions */}
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
            <Ionicons name="add-circle-outline" size={18} color={colors.foreground} />
            <Text className="text-foreground font-semibold text-[16px]">Create a Gym</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
