import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fromKg, formatWeight, WeightUnit } from "@/lib/units";
import type { EquipmentType } from "@/types/exercise";

const EQUIPMENT_ICON: Record<
  EquipmentType,
  {
    name: React.ComponentProps<typeof Ionicons>["name"];
    bg: string;
    color: string;
  }
> = {
  barbell: { name: "barbell", bg: "#122210", color: "#B4FF4A" },
  dumbbell: { name: "barbell-outline", bg: "#131C2E", color: "#5B9BFF" },
  kettlebell: { name: "fitness", bg: "#1E1028", color: "#C88AFF" },
  bodyweight: { name: "body", bg: "#0E1F1F", color: "#4AFFD4" },
  machine: { name: "settings", bg: "#231810", color: "#FF9A5C" },
  other: { name: "ellipsis-horizontal", bg: "#1A1A1E", color: "#888" },
};

type Props = {
  name: string;
  equipmentType: EquipmentType;
  currentWeightKg: number | null;
  unit: WeightUnit;
  onPress?: () => void;
};

export function AthleteMaxRow({
  name,
  equipmentType,
  currentWeightKg,
  unit,
  onPress,
}: Props) {
  const cfg = EQUIPMENT_ICON[equipmentType];
  const displayWeight =
    currentWeightKg != null ? fromKg(currentWeightKg, unit) : null;

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
          backgroundColor: cfg.bg,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Ionicons name={cfg.name} size={20} color={cfg.color} />
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
        {displayWeight != null ? formatWeight(displayWeight, unit) : "—"}
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
