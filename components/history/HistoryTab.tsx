import {
  FlatList,
  View,
  Text,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from "react-native";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, {
  FadeIn,
  useReducedMotion,
  useAnimatedStyle,
  interpolate,
} from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";
import { fromKg, WeightUnit } from "@/lib/units";
import { colors } from "@/lib/theme";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

function DeleteAction({
  progress,
  onDelete,
}: {
  progress: SharedValue<number>;
  onDelete: () => void;
}) {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
  }));

  return (
    <Animated.View
      style={[
        style,
        { width: 88, justifyContent: "center", alignItems: "center" },
      ]}
    >
      <Pressable
        className="flex-1 w-full bg-error justify-center items-center"
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
        onPress={onDelete}
      >
        <Ionicons name="trash-outline" size={20} color="#fff" />
        <Text className="text-white font-medium text-xs mt-1">Delete</Text>
      </Pressable>
    </Animated.View>
  );
}

type HistoryEntry = {
  id: string;
  weight_kg: number | null;
  reps: number | null;
  recorded_at: string;
  notes: string | null;
};

type Props = {
  history: HistoryEntry[];
  unit: WeightUnit;
  onAddMax?: () => void;
  onDeleteMax?: (id: string) => void;
  addButtonLabel?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
  isLoading?: boolean;
};

export function HistoryTab({
  history,
  unit,
  onAddMax,
  onDeleteMax,
  addButtonLabel,
  refreshing,
  onRefresh,
  isLoading,
}: Props) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();
  const sortedHistory = useMemo(
    () =>
      [...history].sort(
        (a, b) =>
          new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime(),
      ),
    [history],
  );

  const isRepsMode =
    sortedHistory.length > 0 && sortedHistory[0].weight_kg == null;
  const hasHistory = sortedHistory.length > 0;

  const prWeightKg = isRepsMode
    ? 0
    : sortedHistory.reduce((best, m) => Math.max(best, m.weight_kg ?? 0), 0);
  const prReps = isRepsMode
    ? sortedHistory.reduce((best, m) => Math.max(best, m.reps ?? 0), 0)
    : 0;

  const addLabel = isRepsMode
    ? "Log Max Reps"
    : (addButtonLabel ?? "Add New Max");
  const recordEntry = hasHistory
    ? (sortedHistory.find((m) =>
        isRepsMode
          ? m.reps === prReps && prReps > 0
          : m.weight_kg === prWeightKg,
      ) ?? sortedHistory[0])
    : null;

  function displayWeightValue(weightKg: number | null): string {
    if (weightKg == null || weightKg <= 0) return "—";
    const converted = fromKg(weightKg, unit);
    return Number.isInteger(converted) ? `${converted}` : converted.toFixed(1);
  }

  const trendValues = useMemo(() => {
    const values = [...sortedHistory]
      .reverse()
      .map((entry) =>
        isRepsMode ? (entry.reps ?? 0) : fromKg(entry.weight_kg ?? 0, unit),
      )
      .filter((v) => v > 0);
    return values;
  }, [sortedHistory, isRepsMode, unit]);

  const sparkline = useMemo(() => {
    if (trendValues.length < 2) return null;
    const width = 360;
    const height = 88;
    const min = Math.min(...trendValues);
    const max = Math.max(...trendValues);
    const range = Math.max(max - min, 1);
    const stepX = width / (trendValues.length - 1);
    const points = trendValues.map((value, index) => ({
      x: index * stepX,
      y: height - ((value - min) / range) * (height - 6) - 3,
    }));
    const linePath = points
      .map((p, index) => `${index === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ");
    const fillPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;
    return { width, height, points, linePath, fillPath };
  }, [trendValues]);

  const renderItem = ({
    item,
    index,
  }: {
    item: HistoryEntry;
    index: number;
  }) => {
    const isPR = isRepsMode
      ? item.reps === prReps && prReps > 0
      : item.weight_kg === prWeightKg && prWeightKg > 0;

    const prev = sortedHistory[index + 1];
    const delta =
      !isRepsMode && prev && item.weight_kg != null && prev.weight_kg != null
        ? fromKg(item.weight_kg, unit) - fromKg(prev.weight_kg, unit)
        : null;
    const repsDelta =
      isRepsMode && prev && item.reps != null && prev.reps != null
        ? item.reps - prev.reps
        : null;

    const date = new Date(item.recorded_at);
    const monthLabel = format(date, "MMM").toUpperCase();
    const dayLabel = format(date, "dd");
    const yearLabel = format(date, "yyyy");
    const primaryDisplay = isRepsMode
      ? item.reps != null && item.reps > 0
        ? `${item.reps}`
        : "—"
      : item.weight_kg != null && item.weight_kg > 0
        ? displayWeightValue(item.weight_kg)
        : "—";
    const unitLabel = isRepsMode ? "REPS" : unit.toUpperCase();

    return (
      <Animated.View
        entering={
          reducedMotion
            ? undefined
            : FadeIn.delay(Math.min(index, 8) * 40).duration(300)
        }
      >
        <Swipeable
          renderRightActions={(progress, _drag, swipeableMethods) =>
            onDeleteMax ? (
              <DeleteAction
                progress={progress}
                onDelete={() => {
                  swipeableMethods.close();
                  setPendingDeleteId(item.id);
                }}
              />
            ) : null
          }
          overshootFriction={8}
          friction={2}
        >
          <View
            className="mx-5 px-1 py-4"
            style={{ borderTopWidth: 1, borderTopColor: colors.hairline }}
          >
            <View className="flex-row items-center">
              <View style={{ width: 64 }}>
                <Text className="text-muted text-[13px] tracking-[1.5px]">
                  {monthLabel}
                </Text>
                <Text
                  style={{
                    fontFamily: "CormorantGaramond-Regular",
                    color: colors.foreground,
                    fontSize: 24,
                    lineHeight: 24,
                    marginTop: 2,
                  }}
                >
                  {dayLabel}
                </Text>
                <Text className="text-muted text-[13px] tracking-[1px]">
                  {yearLabel}
                </Text>
              </View>

              <View className="flex-1 mr-3">
                <View className="flex-row items-center gap-2">
                  <Text
                    style={{
                      fontFamily: "CormorantGaramond-Regular",
                      fontSize: 30,
                      lineHeight: 30,
                      color: colors.foreground,
                      letterSpacing: -0.6,
                    }}
                  >
                    {primaryDisplay}
                  </Text>
                  <Text className="text-muted text-[12px] tracking-[1.5px]">
                    {unitLabel}
                  </Text>
                  {isPR && (
                    <View
                      className="px-2 py-0.5 rounded-full"
                      style={{ borderWidth: 1, borderColor: colors.accent }}
                    >
                      <Text
                        style={{
                          fontFamily: "CormorantGaramond-Regular",
                          fontSize: 13,
                          lineHeight: 13,
                          color: colors.accent,
                        }}
                      >
                        Record
                      </Text>
                    </View>
                  )}
                </View>
                {item.notes ? (
                  <Text className="text-muted mt-1 text-[13px]">
                    {item.notes}
                  </Text>
                ) : null}
              </View>

              <View className="items-end">
                {delta !== null && delta !== 0 && (
                  <Text
                    className={`${delta > 0 ? "text-accent" : "text-error"} text-[14px] tracking-[0.5px]`}
                  >
                    {delta > 0 ? "▲ +" : "▼ "}
                    {Math.abs(delta).toFixed(1)}
                  </Text>
                )}
                {repsDelta !== null && repsDelta !== 0 && (
                  <Text
                    className={`${repsDelta > 0 ? "text-accent" : "text-error"} text-[14px] tracking-[0.5px]`}
                  >
                    {repsDelta > 0 ? "▲ +" : "▼ "}
                    {Math.abs(repsDelta)}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </Swipeable>
      </Animated.View>
    );
  };

  return (
    <>
      <FlatList
        data={sortedHistory}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{
          paddingTop: 0,
          paddingBottom: 100,
          flexGrow: 1,
        }}
        ListHeaderComponent={
          hasHistory && recordEntry ? (
            <View className="px-5 pt-3 pb-4">
              <Text className="text-muted text-[11px] uppercase tracking-[2px] mb-2">
                All-Time Record
              </Text>
              <View className="flex-row items-start gap-1.5 mb-2">
                <Text
                  style={{
                    fontFamily: "CormorantGaramond-Regular",
                    fontSize: 58,
                    lineHeight: 58,
                    color: colors.foreground,
                    letterSpacing: -1,
                  }}
                >
                  {isRepsMode
                    ? `${recordEntry.reps ?? 0}`
                    : displayWeightValue(recordEntry.weight_kg)}
                </Text>
                <Text
                  style={{
                    fontFamily: "CormorantGaramond-Regular",
                    fontSize: 24,
                    lineHeight: 26,
                    color: colors.accent,
                    marginTop: 12,
                  }}
                >
                  {isRepsMode ? "reps" : unit}
                </Text>
              </View>
              {sparkline && (
                <View className="mt-1 mb-2">
                  <Svg
                    width="100%"
                    height={sparkline.height + 20}
                    viewBox={`0 0 ${sparkline.width} ${sparkline.height + 20}`}
                  >
                    <Defs>
                      <LinearGradient
                        id="historyFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <Stop
                          offset="0%"
                          stopColor={colors.accent}
                          stopOpacity="0.22"
                        />
                        <Stop
                          offset="100%"
                          stopColor={colors.accent}
                          stopOpacity="0"
                        />
                      </LinearGradient>
                    </Defs>
                    <Path
                      d={sparkline.fillPath}
                      fill="url(#historyFill)"
                      transform="translate(0,10)"
                    />
                    <Path
                      d={sparkline.linePath}
                      fill="none"
                      stroke={colors.accent}
                      strokeWidth={1.1}
                      transform="translate(0,10)"
                    />
                    {sparkline.points.map((p, i) => (
                      <Circle
                        key={i}
                        cx={p.x}
                        cy={p.y + 10}
                        r={i === sparkline.points.length - 1 ? 2 : 1.5}
                        fill={colors.bg}
                        stroke={colors.accent}
                        strokeWidth={1}
                      />
                    ))}
                  </Svg>
                  <View className="flex-row justify-between mt-0.5">
                    <Text className="text-muted text-[11px] tracking-[1.5px]">
                      {format(
                        new Date(
                          sortedHistory[sortedHistory.length - 1].recorded_at,
                        ),
                        "MMM",
                      ).toUpperCase()}
                    </Text>
                    <Text className="text-muted text-[11px] tracking-[1.5px]">
                      {format(
                        new Date(sortedHistory[0].recorded_at),
                        "MMM",
                      ).toUpperCase()}
                    </Text>
                  </View>
                  <View
                    className="flex-row items-center mt-2 pt-2"
                    style={{
                      borderTopWidth: 1,
                      borderTopColor: colors.hairline,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "CormorantGaramond-Regular",
                        fontSize: 18,
                        lineHeight: 18,
                        color: colors.accent,
                      }}
                    >
                      The Record
                    </Text>
                  </View>
                </View>
              )}
            </View>
          ) : null
        }
        ListEmptyComponent={
          isLoading ? (
            <View className="flex-1 items-center justify-center py-16">
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : (
            <View className="flex-1 justify-center">
              <EmptyState
                icon="time-outline"
                title="No history yet"
                description="Start tracking to see your progress here"
                action={
                  onAddMax ? (
                    <Button label={addLabel} onPress={onAddMax} />
                  ) : undefined
                }
              />
            </View>
          )
        }
        ListFooterComponent={
          sortedHistory.length > 0 && onAddMax ? (
            <View className="mx-5 mt-2">
              <Button
                label={addLabel}
                variant="secondary"
                onPress={onAddMax}
                icon={
                  <Ionicons
                    name="add-circle-outline"
                    size={20}
                    color={colors.accent}
                  />
                }
              />
            </View>
          ) : null
        }
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={!!refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
            />
          ) : undefined
        }
      />
      <ConfirmModal
        visible={pendingDeleteId !== null}
        title="Delete Entry"
        message="Remove this entry from your history?"
        confirmLabel="Delete"
        variant="destructive"
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (pendingDeleteId) onDeleteMax?.(pendingDeleteId);
          setPendingDeleteId(null);
        }}
      />
    </>
  );
}
