import { colors } from "@/lib/theme";
import { Ionicons } from "@expo/vector-icons";
import { addDays, isToday, isTomorrow, isYesterday } from "date-fns";
import { useTranslation } from "react-i18next";
import { DATE_FNS_LOCALES, formatDate } from "@/lib/i18n";
import { Pressable, Text, View } from "react-native";

interface Props {
  date: Date;
  onDateChange: (date: Date) => void;
}

export function DateNavigator({ date, onDateChange }: Props) {
  const { t, i18n } = useTranslation();
  const locale =
    DATE_FNS_LOCALES[i18n.language as keyof typeof DATE_FNS_LOCALES];

  function formatLabel(d: Date): string {
    if (isToday(d)) return t("gym.today");
    if (isYesterday(d)) return t("gym.yesterday");
    if (isTomorrow(d)) return t("gym.tomorrow");
    return formatDate(d, locale ? "EEE, d MMM" : "EEE, MMM d", locale);
  }

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
