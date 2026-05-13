import { colors } from "@/lib/theme";
import { Ionicons } from "@expo/vector-icons";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  isSameMonth,
  startOfMonth,
  subMonths,
} from "date-fns";
import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { DATE_FNS_LOCALES, formatDate } from "@/lib/i18n";

type Props = {
  visible: boolean;
  value: Date;
  onClose: () => void;
  onChange: (date: Date) => void;
};

export function CalendarPickerModal({
  visible,
  value,
  onClose,
  onChange,
}: Props) {
  const { t, i18n } = useTranslation();
  const locale =
    DATE_FNS_LOCALES[i18n.language as keyof typeof DATE_FNS_LOCALES];
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(value));

  const weekdays = [
    t("calendar.weekday_su"),
    t("calendar.weekday_mo"),
    t("calendar.weekday_tu"),
    t("calendar.weekday_we"),
    t("calendar.weekday_th"),
    t("calendar.weekday_fr"),
    t("calendar.weekday_sa"),
  ];

  const days = eachDayOfInterval({
    start: startOfMonth(viewMonth),
    end: endOfMonth(viewMonth),
  });

  const startPadding = getDay(startOfMonth(viewMonth));
  const cells: (Date | null)[] = [...Array(startPadding).fill(null), ...days];
  while (cells.length % 7 !== 0) cells.push(null);

  function handleSelect(day: Date) {
    onChange(day);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/50" onPress={onClose} />
        <View className="bg-surface rounded-t-3xl pb-10">
          <View className="flex-row justify-between items-center px-4 py-3 border-b border-border">
            <Text className="text-foreground font-semibold">
              {t("calendar.title")}
            </Text>
            <Pressable onPress={onClose}>
              <Text className="text-accent font-semibold">
                {t("calendar.done")}
              </Text>
            </Pressable>
          </View>

          <View className="flex-row items-center justify-between px-4 py-3">
            <Pressable
              className="w-9 h-9 bg-surface2 rounded-lg items-center justify-center"
              onPress={() => setViewMonth((m) => subMonths(m, 1))}
            >
              <Ionicons
                name="chevron-back"
                size={18}
                color={colors.foreground}
              />
            </Pressable>
            <Text className="text-foreground font-semibold text-base">
              {formatDate(viewMonth, "MMMM yyyy", locale)}
            </Text>
            <Pressable
              className="w-9 h-9 bg-surface2 rounded-lg items-center justify-center"
              onPress={() => setViewMonth((m) => addMonths(m, 1))}
            >
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.foreground}
              />
            </Pressable>
          </View>

          <View className="flex-row px-4 mb-1">
            {weekdays.map((d) => (
              <View key={d} className="flex-1 items-center">
                <Text className="text-muted text-xs font-medium">{d}</Text>
              </View>
            ))}
          </View>

          <View className="px-4 pb-2">
            {Array.from({ length: cells.length / 7 }).map((_, row) => (
              <View key={row} className="flex-row">
                {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
                  if (!day) {
                    return <View key={col} className="flex-1 h-10" />;
                  }
                  const isSelected = isSameDay(day, value);
                  const isCurrentMonth = isSameMonth(day, viewMonth);
                  return (
                    <Pressable
                      key={col}
                      className={`flex-1 h-10 items-center justify-center rounded-full ${isSelected ? "bg-accent" : ""}`}
                      onPress={() => handleSelect(day)}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          isSelected
                            ? "text-bg"
                            : isCurrentMonth
                              ? "text-foreground"
                              : "text-muted"
                        }`}
                      >
                        {format(day, "d")}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}
