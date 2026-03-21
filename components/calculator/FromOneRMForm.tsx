import { View, Text } from "react-native";
import { Input } from "@/components/ui/Input";

type Props = {
  unit: string;
  input: string;
  onChangeInput: (v: string) => void;
  showError: boolean;
};

function UnitPill({ unit }: { unit: string }) {
  return (
    <View className="bg-surface2 rounded-md px-2 py-0.5">
      <Text className="text-xs font-semibold text-muted uppercase">{unit}</Text>
    </View>
  );
}

export { UnitPill };

export function FromOneRMForm({ unit, input, onChangeInput, showError }: Props) {
  return (
    <View className="mb-5">
      <Input
        label="1RM – Your Max"
        placeholder={unit === "kg" ? "e.g. 120" : "e.g. 265"}
        keyboardType="decimal-pad"
        value={input}
        onChangeText={onChangeInput}
        error={showError ? "Enter a weight greater than 0" : undefined}
        rightElement={<UnitPill unit={unit} />}
      />
    </View>
  );
}
