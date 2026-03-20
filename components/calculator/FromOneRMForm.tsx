import { View } from "react-native";
import { Input } from "@/components/ui/Input";

type Props = {
  unit: string;
  input: string;
  onChangeInput: (v: string) => void;
  showError: boolean;
};

export function FromOneRMForm({ unit, input, onChangeInput, showError }: Props) {
  return (
    <View className="mb-5">
      <Input
        label={`1RM – Your Max (${unit})`}
        placeholder={unit === "kg" ? "e.g. 120" : "e.g. 265"}
        keyboardType="decimal-pad"
        value={input}
        onChangeText={onChangeInput}
        error={showError ? "Enter a weight greater than 0" : undefined}
      />
    </View>
  );
}
