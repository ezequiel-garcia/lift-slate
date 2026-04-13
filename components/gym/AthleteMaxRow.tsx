import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fromKg, formatWeight, WeightUnit } from "@/lib/units";
import type { ExerciseCategory } from "@/types/exercise";

const CATEGORY_ICON: Record<
  NonNullable<ExerciseCategory>,
  {
    name: React.ComponentProps<typeof Ionicons>["name"];
    bg: string;
    color: string;
  }
> = {
  squat: { name: "body", bg: "#131C2E", color: "#5B9BFF" },
  press: { name: "arrow-up", bg: "#231810", color: "#FF9A5C" },
  pull: { name: "arrow-down", bg: "#1E1028", color: "#C88AFF" },
  olympic: { name: "trophy", bg: "#231E0A", color: "#FFD84A" },
  accessory: { name: "barbell", bg: "#122210", color: "#B4FF4A" },
  core: { name: "body", bg: "#0E1F1F", color: "#4AFFD4" },
  conditioning: { name: "flame", bg: "#1F0E0E", color: "#FF6B6B" },
};

type Props = {
  name: string;
  category: ExerciseCategory | null;
  currentWeightKg: number;
  unit: WeightUnit;
  onPress?: () => void;
};

export function AthleteMaxRow({
  name,
  category,
  currentWeightKg,
  unit,
  onPress,
}: Props) {
  const cfg = category ? CATEGORY_ICON[category] : null;
  const displayWeight = fromKg(currentWeightKg, unit);

  return (
    <Pressable
      className="flex-row items-center px-5 py-3.5 bg-bg"
      style={({ pressed }) => ({ opacity: onPress && pressed ? 0.7 : 1 })}
      onPress={onPress}
      disabled={!onPress}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 11,
          backgroundColor: cfg?.bg ?? "#1A1A1E",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Ionicons
          name={cfg?.name ?? "barbell-outline"}
          size={20}
          color={cfg?.color ?? "#555"}
        />
      </View>
      <View className="flex-1 mx-3.5">
        <Text
          className="text-[16px] font-medium text-foreground"
          numberOfLines={1}
        >
          {name}
        </Text>
      </View>
      <Text className="text-[17px] font-bold text-foreground tabular-nums">
        {formatWeight(displayWeight, unit)}
      </Text>
      {onPress && (
        <Ionicons
          name="chevron-forward"
          size={16}
          color="#3F3F46"
          style={{ marginLeft: 6 }}
        />
      )}
    </Pressable>
  );
}
