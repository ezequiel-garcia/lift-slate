import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format, addDays, isToday, isYesterday, isTomorrow } from "date-fns";
import { colors } from "@/lib/theme";

interface Props {
  date: Date;
  onDateChange: (date: Date) => void;
}

function formatLabel(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "EEE, MMM d");
}

export function DateNavigator({ date, onDateChange }: Props) {
  return (
    <View className="flex-row items-center justify-between px-1 py-2">
      <Pressable
        onPress={() => onDateChange(addDays(date, -1))}
        className="w-11 h-11 items-center justify-center rounded-full"
        style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
      >
        <Ionicons name="chevron-back" size={20} color={colors.muted} />
      </Pressable>

      <Pressable
        onPress={() => onDateChange(new Date())}
        className="px-4 py-2"
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        <Text className="text-base font-semibold text-foreground">
          {formatLabel(date)}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => onDateChange(addDays(date, 1))}
        className="w-11 h-11 items-center justify-center rounded-full"
        style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
      >
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </Pressable>
    </View>
  );
}
