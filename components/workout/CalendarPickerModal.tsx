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

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

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
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(value));

  const days = eachDayOfInterval({
    start: startOfMonth(viewMonth),
    end: endOfMonth(viewMonth),
  });

  // Pad the start with empty slots for the first week
  const startPadding = getDay(startOfMonth(viewMonth));
  const cells: (Date | null)[] = [...Array(startPadding).fill(null), ...days];
  // Pad end to complete last row
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
          {/* Header */}
          <View className="flex-row justify-between items-center px-4 py-3 border-b border-border">
            <Text className="text-foreground font-semibold">Select Date</Text>
            <Pressable onPress={onClose}>
              <Text className="text-accent font-semibold">Done</Text>
            </Pressable>
          </View>

          {/* Month navigation */}
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
              {format(viewMonth, "MMMM yyyy")}
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

          {/* Weekday labels */}
          <View className="flex-row px-4 mb-1">
            {WEEKDAYS.map((d) => (
              <View key={d} className="flex-1 items-center">
                <Text className="text-muted text-xs font-medium">{d}</Text>
              </View>
            ))}
          </View>

          {/* Day grid */}
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
