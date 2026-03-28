import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { UnitPill } from "@/components/calculator/FromOneRMForm";
import * as Haptics from "expo-haptics";
import { formatWeight } from "@/lib/units";
import { colors } from "@/lib/theme";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const REVERSE_CHIPS = [60, 70, 75, 80, 85, 90];

type Props = {
  unit: "kg" | "lbs";
  weightInput: string;
  onChangeWeight: (v: string) => void;
  showWeightError: boolean;
  selectedChip: number | null;
  onSelectChip: (pct: number) => void;
  customPctInput: string;
  onChangeCustomPct: (v: string) => void;
  showPctError: boolean;
  estimatedOneRMRaw: number | null;
  canSave: boolean;
  onSave: () => void;
  showPlaceholder: boolean;
};

export function ReverseForm({
  unit,
  weightInput,
  onChangeWeight,
  showWeightError,
  selectedChip,
  onSelectChip,
  customPctInput,
  onChangeCustomPct,
  showPctError,
  estimatedOneRMRaw,
  canSave,
  onSave,
  showPlaceholder,
}: Props) {
  const displayPct = customPctInput ? parseFloat(customPctInput) : selectedChip;

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

      <Text className="text-label uppercase tracking-wider text-muted mb-3">
        At Percentage
      </Text>
      <View className="flex-row flex-wrap gap-2 mb-3">
        {REVERSE_CHIPS.map((pct) => {
          const isActive = selectedChip === pct && !customPctInput;
          return (
            <Pressable
              key={pct}
              className={`px-4 py-3 rounded-xl ${isActive ? "bg-accent-muted border border-accent" : "bg-surface"}`}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelectChip(pct);
              }}
            >
              <Text
                className={`text-[15px] font-semibold ${isActive ? "text-accent" : "text-foreground"}`}
              >
                {pct}%
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View className="flex-row items-center gap-3 mb-1">
        <View className="flex-1">
          <Input
            placeholder="Custom %"
            keyboardType="number-pad"
            value={customPctInput}
            onChangeText={onChangeCustomPct}
            error={
              showPctError ? "Percentage must be between 1 and 100" : undefined
            }
          />
        </View>
        <Text className="text-muted text-lg font-semibold">%</Text>
      </View>
      {!showPctError && (
        <Text className="text-muted text-xs mb-5">Enter 1–100</Text>
      )}
      {showPctError && <View className="mb-2" />}

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
            Enter a weight and pick a %.
          </Text>
        </View>
      ) : (
        <>
          {estimatedOneRMRaw != null && (
            <View className="bg-surface rounded-2xl p-5 mb-6">
              <Text className="text-label uppercase tracking-wider text-muted mb-2">
                Estimated 1RM
              </Text>
              <Text
                className="text-display text-accent"
                style={{ letterSpacing: -2 }}
              >
                {formatWeight(parseFloat(estimatedOneRMRaw.toFixed(1)), unit)}
              </Text>
              {weightInput && displayPct != null && !isNaN(displayPct) && (
                <Text className="text-xs text-muted mt-1">
                  Based on {weightInput} {unit} at {displayPct}%
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
