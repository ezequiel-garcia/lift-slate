import { View, Text, TextInput } from "react-native";
import { colors } from "@/lib/theme";

type Props = {
  unit: string;
  input: string;
  onChangeInput: (v: string) => void;
  showError: boolean;
};

export function FromOneRMForm({ unit, input, onChangeInput, showError }: Props) {
  return (
    <>
      <Text className="text-[13px] font-semibold text-muted uppercase tracking-widest mb-2">
        Your 1RM ({unit})
      </Text>
      <TextInput
        className="bg-surface rounded-xl px-4 py-3.5 text-foreground text-[18px] mb-1"
        placeholder={unit === "kg" ? "e.g. 120" : "e.g. 265"}
        placeholderTextColor={colors.muted}
        keyboardType="decimal-pad"
        value={input}
        onChangeText={onChangeInput}
      />
      {showError ? (
        <Text className="text-error text-sm mb-5">Enter a weight greater than 0</Text>
      ) : (
        <View className="mb-5" />
      )}
    </>
  );
}
