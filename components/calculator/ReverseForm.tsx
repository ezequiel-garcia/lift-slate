import { View, Text, TextInput, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import { formatWeight } from "@/lib/units";
import { colors } from "@/lib/theme";

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
  estimatedOneRMRounded: number | null;
  canSave: boolean;
  onSave: () => void;
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
  estimatedOneRMRounded,
  canSave,
  onSave,
}: Props) {
  const displayPct = customPctInput ? parseFloat(customPctInput) : selectedChip;

  return (
    <>
      <Text className="text-[13px] font-semibold text-muted uppercase tracking-widest mb-2">
        Weight Lifted ({unit})
      </Text>
      <TextInput
        className="bg-surface rounded-xl px-4 py-3.5 text-foreground text-[18px] mb-1"
        placeholder={unit === "kg" ? "e.g. 100" : "e.g. 225"}
        placeholderTextColor={colors.muted}
        keyboardType="decimal-pad"
        value={weightInput}
        onChangeText={onChangeWeight}
      />
      {showWeightError ? (
        <Text className="text-error text-sm mb-5">Enter a weight greater than 0</Text>
      ) : (
        <View className="mb-5" />
      )}

      <Text className="text-[13px] font-semibold text-muted uppercase tracking-widest mb-3">
        At Percentage
      </Text>
      <View className="flex-row flex-wrap gap-2 mb-3">
        {REVERSE_CHIPS.map((pct) => {
          const isActive = selectedChip === pct && !customPctInput;
          return (
            <Pressable
              key={pct}
              className={`px-4 py-3 rounded-xl ${isActive ? "bg-accent/15" : "bg-surface"}`}
              style={isActive ? { borderWidth: 1, borderColor: colors.accent } : undefined}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelectChip(pct);
              }}
            >
              <Text className={`text-[15px] font-semibold ${isActive ? "text-accent" : "text-foreground"}`}>
                {pct}%
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View className="flex-row items-center gap-3 mb-1">
        <TextInput
          className="flex-1 bg-surface rounded-xl px-4 py-3.5 text-foreground text-[16px]"
          placeholder="Custom %"
          placeholderTextColor={colors.muted}
          keyboardType="number-pad"
          value={customPctInput}
          onChangeText={onChangeCustomPct}
        />
        <Text className="text-muted text-lg font-semibold">%</Text>
      </View>
      {showPctError ? (
        <Text className="text-error text-sm mb-5">Percentage must be between 1 and 100</Text>
      ) : (
        <Text className="text-muted text-xs mb-5">Enter 1–100</Text>
      )}

      {estimatedOneRMRaw != null && estimatedOneRMRounded != null && (
        <View className="bg-surface rounded-2xl p-5 mb-6">
          <Text className="text-[13px] font-semibold text-muted uppercase tracking-widest mb-2">
            Estimated 1RM
          </Text>
          <Text className="text-[48px] font-bold text-accent" style={{ letterSpacing: -2 }}>
            {formatWeight(estimatedOneRMRounded, unit)}
          </Text>
          <Text className="text-sm text-muted mt-1">
            exact {formatWeight(parseFloat(estimatedOneRMRaw.toFixed(1)), unit)}
          </Text>
          {weightInput && displayPct != null && !isNaN(displayPct) && (
            <Text className="text-xs text-muted mt-1">
              Based on {weightInput} {unit} at {displayPct}%
            </Text>
          )}
        </View>
      )}

      {canSave && (
        <Pressable
          className="bg-accent rounded-2xl p-4 items-center mb-6"
          onPress={onSave}
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
        >
          <Text className="text-bg font-bold text-[16px]">Save as 1RM</Text>
        </Pressable>
      )}
    </>
  );
}
