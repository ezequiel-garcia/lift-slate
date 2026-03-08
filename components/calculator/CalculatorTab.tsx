import { useState } from "react";
import { View, Text, TextInput, ScrollView, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import { calculatePercentage, formatWeight, fromKg, WeightUnit } from "@/lib/units";
import { COMMON_PERCENTAGES } from "@/lib/constants";
import { ExerciseNotes } from "@/components/exercises/ExerciseNotes";

type Max = {
  id: string;
  weight_kg: number;
  recorded_at: string;
  notes: string | null;
};

type Props = {
  exerciseId: string;
  currentMax: Max | null;
  unit: WeightUnit;
  roundingIncrementKg: number;
  onAddMax: () => void;
};

export function CalculatorTab({ exerciseId, currentMax, unit, roundingIncrementKg, onAddMax }: Props) {
  const [selectedPct, setSelectedPct] = useState<number | null>(null);
  const [customPct, setCustomPct] = useState("");

  const activePct = customPct ? parseFloat(customPct) : selectedPct;
  const result =
    currentMax && activePct != null && !isNaN(activePct) && activePct > 0
      ? calculatePercentage(currentMax.weight_kg, activePct, unit, roundingIncrementKg)
      : null;

  const roundIncrementDisplay = formatWeight(fromKg(roundingIncrementKg, unit), unit);

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets={true}
    >
      {/* Current 1RM */}
      <View className="items-center py-6 mb-2">
        <Text className="text-[11px] font-bold text-muted uppercase tracking-widest mb-2">
          Current 1RM
        </Text>
        {currentMax ? (
          <Text className="text-5xl font-bold text-foreground">
            {formatWeight(fromKg(currentMax.weight_kg, unit), unit)}
          </Text>
        ) : (
          <Text className="text-muted text-sm">No max recorded yet</Text>
        )}
      </View>

      {/* Percentage grid */}
      <Text className="text-[11px] font-bold text-muted uppercase tracking-widest mb-3">
        Percentage
      </Text>
      <View className="flex-row flex-wrap gap-2 mb-5">
        {COMMON_PERCENTAGES.map((pct) => {
          const isActive = selectedPct === pct && !customPct;
          return (
            <Pressable
              key={pct}
              className={`px-3 py-2 rounded-lg border ${
                isActive ? "border-accent bg-accent/10" : "border-border bg-surface"
              }`}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedPct(pct);
                setCustomPct("");
              }}
            >
              <Text
                className={`text-sm font-semibold ${isActive ? "text-accent" : "text-foreground"}`}
              >
                {pct}%
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Custom percentage */}
      <Text className="text-[11px] font-bold text-muted uppercase tracking-widest mb-2">
        Custom
      </Text>
      <View className="flex-row items-center gap-3 mb-6">
        <TextInput
          className="flex-1 bg-surface border border-border rounded-xl px-4 py-[10px] text-foreground text-[15px]"
          placeholder="e.g. 67.5"
          placeholderTextColor="#5A5A5A"
          keyboardType="decimal-pad"
          value={customPct}
          onChangeText={(v) => {
            setCustomPct(v);
            if (v) setSelectedPct(null);
          }}
        />
        <Text className="text-muted text-base font-semibold">%</Text>
      </View>

      {/* Result */}
      {result && (
        <View className="bg-surface border border-border rounded-xl p-4 mb-2 items-center">
          <Text className="text-[22px] font-bold text-foreground text-center">
            {activePct}% = {formatWeight(result.raw, unit)} → {formatWeight(result.rounded, unit)}
          </Text>
          <Text className="text-xs text-muted mt-1">
            Rounded to nearest {roundIncrementDisplay}
          </Text>
        </View>
      )}

      {/* Add new max */}
      <Pressable
        className="mt-4 border border-border rounded-xl p-4 items-center"
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        onPress={onAddMax}
      >
        <Text className="text-accent font-semibold text-[15px]">+ Add New Max</Text>
      </Pressable>

      <ExerciseNotes exerciseId={exerciseId} />
    </ScrollView>
  );
}
