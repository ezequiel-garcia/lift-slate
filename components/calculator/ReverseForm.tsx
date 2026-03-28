import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { UnitPill } from "@/components/calculator/FromOneRMForm";
import { formatWeight } from "@/lib/units";
import { MAX_RELIABLE_REPS } from "@/lib/estimate";
import { colors } from "@/lib/theme";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type Props = {
  unit: "kg" | "lbs";
  weightInput: string;
  onChangeWeight: (v: string) => void;
  showWeightError: boolean;
  repsInput: string;
  onChangeReps: (v: string) => void;
  showRepsError: boolean;
  estimatedOneRM: number | null;
  repsNum: number;
  canSave: boolean;
  onSave: () => void;
  showPlaceholder: boolean;
};

export function ReverseForm({
  unit,
  weightInput,
  onChangeWeight,
  showWeightError,
  repsInput,
  onChangeReps,
  showRepsError,
  estimatedOneRM,
  repsNum,
  canSave,
  onSave,
  showPlaceholder,
}: Props) {
  return (
    <>
      <View className="mb-5">
        <Input
          label="Weight Lifted"
          placeholder={unit === "kg" ? "e.g. 100" : "e.g. 225"}
          keyboardType="decimal-pad"
          value={weightInput}
          onChangeText={onChangeWeight}
          error={showWeightError ? "Enter a weight greater than 0" : undefined}
          rightElement={<UnitPill unit={unit} />}
        />
      </View>

      <View className="mb-5">
        <Input
          label="Reps Performed"
          placeholder="e.g. 5"
          keyboardType="number-pad"
          value={repsInput}
          onChangeText={onChangeReps}
          error={showRepsError ? "Enter at least 1 rep" : undefined}
        />
      </View>

      {repsNum > MAX_RELIABLE_REPS && (
        <View className="flex-row items-center gap-2 mb-4 px-1">
          <Ionicons name="warning-outline" size={16} color={colors.error} />
          <Text className="text-error text-sm flex-1">
            Estimates above {MAX_RELIABLE_REPS} reps are less accurate.
          </Text>
        </View>
      )}

      {showPlaceholder ? (
        <View className="bg-surface rounded-2xl p-8 mb-6 items-center">
          <Ionicons
            name="analytics-outline"
            size={36}
            color={colors.muted}
            style={{ marginBottom: 12 }}
          />
          <Text className="text-base font-semibold text-foreground mb-2 text-center">
            Estimate your 1RM
          </Text>
          <Text className="text-sm text-muted text-center">
            Enter a weight and number of reps.
          </Text>
        </View>
      ) : (
        <>
          {estimatedOneRM != null && (
            <View className="bg-surface rounded-2xl p-5 mb-6">
              <Text className="text-label uppercase tracking-wider text-muted mb-2">
                Estimated 1RM
              </Text>
              <Text
                className="text-display text-accent"
                style={{ letterSpacing: -2 }}
              >
                {formatWeight(parseFloat(estimatedOneRM.toFixed(1)), unit)}
              </Text>
              {weightInput && repsNum >= 1 && (
                <Text className="text-xs text-muted mt-1">
                  Based on {weightInput} {unit} x {repsNum} reps (Epley formula)
                </Text>
              )}
            </View>
          )}
          {canSave && (
            <View className="mb-6">
              <Button label="Save as 1RM" onPress={onSave} />
            </View>
          )}
        </>
      )}
    </>
  );
}
