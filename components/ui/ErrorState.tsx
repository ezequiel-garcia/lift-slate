import { View, Text, Pressable } from "react-native";

type Props = {
  message?: string;
  onRetry: () => void;
};

export function ErrorState({ message = "Something went wrong", onRetry }: Props) {
  return (
    <View className="flex-1 items-center justify-center gap-4 px-8">
      <Text className="text-muted text-sm text-center">{message}</Text>
      <Pressable
        className="bg-surface border border-border rounded-xl px-6 py-3"
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        onPress={onRetry}
      >
        <Text className="text-foreground font-semibold text-sm">Retry</Text>
      </Pressable>
    </View>
  );
}
