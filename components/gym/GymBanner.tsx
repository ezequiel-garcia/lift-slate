import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";
import { getMyGym } from "@/services/gym.service";

export type MyGym = NonNullable<Awaited<ReturnType<typeof getMyGym>>>;

type Props = {
  gym: MyGym;
  onLeave?: () => void;
};

export function GymBanner({ gym, onLeave }: Props) {
  const isAdmin = gym.myRole === "admin";
  const roleLabel =
    gym.myRole === "admin"
      ? "Admin"
      : gym.myRole === "coach"
        ? "Coach"
        : "Athlete";

  return (
    <View className="bg-surface rounded-2xl p-4 gap-3">
      <View className="flex-row items-center gap-3">
        {gym.logo_url ? (
          <Image
            source={{ uri: gym.logo_url }}
            style={{ width: 44, height: 44, borderRadius: 12 }}
            contentFit="cover"
          />
        ) : (
          <View className="w-11 h-11 rounded-xl bg-surface2 items-center justify-center">
            <Ionicons name="fitness" size={22} color={colors.accent} />
          </View>
        )}
        <View className="flex-1">
          <Text className="text-foreground text-lg font-bold" numberOfLines={1}>
            {gym.name}
          </Text>
          <View className="flex-row items-center gap-2 mt-0.5">
            <View className="bg-accent/15 px-2 py-0.5 rounded-md">
              <Text className="text-accent text-xs font-semibold">
                {roleLabel}
              </Text>
            </View>
          </View>
        </View>
      </View>
      {!!gym.description && (
        <Text className="text-muted text-sm">{gym.description}</Text>
      )}
      {!!gym.address && (
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="location-outline" size={14} color={colors.muted} />
          <Text className="text-muted text-sm">{gym.address}</Text>
        </View>
      )}
      {!isAdmin && onLeave && (
        <Pressable
          onPress={onLeave}
          className="pt-2 border-t border-border"
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Text className="text-error text-sm text-center">Leave Gym</Text>
        </Pressable>
      )}
    </View>
  );
}
