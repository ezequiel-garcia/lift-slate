import { View, Text } from "react-native";
import Animated, { FadeIn, useReducedMotion } from "react-native-reanimated";
import { COMMON_PERCENTAGES } from "@/lib/constants";
import { calculatePercentage, formatWeight } from "@/lib/units";

type Props = {
  oneRMKg: number;
  unit: "kg" | "lbs";
};

export function PercentageTable({ oneRMKg, unit }: Props) {
  const reduceMotion = useReducedMotion();

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeIn.duration(300)}
      className="bg-surface rounded-2xl overflow-hidden mb-2"
    >
      <Text className="text-label uppercase tracking-wider text-muted px-4 pt-4 pb-3">
        Percentages
      </Text>
      {COMMON_PERCENTAGES.map((pct, i) => {
        const weight = calculatePercentage(oneRMKg, pct, unit);
        const isLast = i === COMMON_PERCENTAGES.length - 1;
        return (
          <View key={pct}>
            <View className="flex-row items-center px-4 py-3">
              <Text className="text-[15px] font-semibold text-muted w-12">{pct}%</Text>
              <Text className="text-[15px] font-semibold text-foreground flex-1">
                {formatWeight(weight, unit)}
              </Text>
            </View>
            {!isLast && <View className="h-px bg-border mx-4" />}
          </View>
        );
      })}
    </Animated.View>
  );
}
