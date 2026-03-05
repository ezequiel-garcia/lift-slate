import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import * as profileService from "@/services/profile.service";
import * as maxesService from "@/services/maxes.service";
import { supabase } from "@/lib/supabase";
import { colors, spacing, radius } from "@/lib/theme";
import type { WeightUnit } from "@/lib/units";

const POPULAR_EXERCISES = [
  "Back Squat",
  "Deadlift",
  "Bench Press",
  "Overhead Press",
  "Clean",
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState<WeightUnit>("kg");
  const [weights, setWeights] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  const transitionTo = (nextStep: number) => {
    translateX.value = withTiming(-24, { duration: 180 });
    opacity.value = withTiming(0, { duration: 180 }, (done) => {
      if (!done) return;
      runOnJS(setStep)(nextStep);
      translateX.value = 24;
      translateX.value = withTiming(0, { duration: 200 });
      opacity.value = withTiming(1, { duration: 200 });
    });
  };

  const handleNext = () => {
    if (step === 1) {
      if (!name.trim()) {
        setError("Please enter your name.");
        return;
      }
      setError("");
      transitionTo(2);
    } else if (step === 2) {
      transitionTo(3);
    }
  };

  const handleDone = async () => {
    setLoading(true);
    setError("");
    try {
      await profileService.updateProfile({
        display_name: name.trim(),
        unit_preference: unit,
      });

      const exercisesToSave = POPULAR_EXERCISES.filter(
        (ex) => weights[ex] && parseFloat(weights[ex]) > 0
      );

      if (exercisesToSave.length > 0) {
        const { data: exercises } = await supabase
          .from("exercises")
          .select("id, name")
          .in("name", exercisesToSave);

        if (exercises) {
          await Promise.all(
            exercises.map((ex) =>
              maxesService.createMax({
                exerciseId: ex.id,
                weight: parseFloat(weights[ex.name]),
                unit,
              })
            )
          );
        }
      }

      router.replace("/(tabs)");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      await profileService.updateProfile({
        display_name: name.trim() || "Athlete",
        unit_preference: unit,
      });
      router.replace("/(tabs)");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        {/* Step dots */}
        <View style={styles.dots}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={[styles.dot, step === i && styles.dotActive]} />
          ))}
        </View>

        <Animated.View style={[{ flex: 1 }, animatedStyle]}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {step === 1 && (
              <Step1
                name={name}
                setName={setName}
                error={error}
                onNext={handleNext}
              />
            )}
            {step === 2 && (
              <Step2 unit={unit} setUnit={setUnit} onNext={handleNext} />
            )}
            {step === 3 && (
              <Step3
                unit={unit}
                weights={weights}
                setWeights={setWeights}
                onDone={handleDone}
                onSkip={handleSkip}
                loading={loading}
                error={error}
              />
            )}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Step components ─────────────────────────────────────────────────────────

function Step1({
  name,
  setName,
  error,
  onNext,
}: {
  name: string;
  setName: (v: string) => void;
  error: string;
  onNext: () => void;
}) {
  return (
    <View style={styles.step}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>What's your name?</Text>
        <Text style={styles.stepSubtitle}>
          We'll use this to personalise your experience.
        </Text>
      </View>
      <TextInput
        style={styles.input}
        placeholder="Your name"
        placeholderTextColor={colors.muted}
        value={name}
        onChangeText={setName}
        autoFocus
        autoCapitalize="words"
        returnKeyType="next"
        onSubmitEditing={onNext}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity style={styles.primaryBtn} onPress={onNext}>
        <Text style={styles.primaryBtnText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

function Step2({
  unit,
  setUnit,
  onNext,
}: {
  unit: WeightUnit;
  setUnit: (v: WeightUnit) => void;
  onNext: () => void;
}) {
  return (
    <View style={styles.step}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>How do you{"\n"}measure weight?</Text>
        <Text style={styles.stepSubtitle}>
          You can change this anytime in settings.
        </Text>
      </View>
      <View style={styles.unitRow}>
        {(["kg", "lbs"] as WeightUnit[]).map((u) => (
          <TouchableOpacity
            key={u}
            style={[styles.unitBtn, unit === u && styles.unitBtnActive]}
            onPress={() => setUnit(u)}
          >
            <Text
              style={[styles.unitBtnText, unit === u && styles.unitBtnTextActive]}
            >
              {u}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.primaryBtn} onPress={onNext}>
        <Text style={styles.primaryBtnText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

function Step3({
  unit,
  weights,
  setWeights,
  onDone,
  onSkip,
  loading,
  error,
}: {
  unit: WeightUnit;
  weights: Record<string, string>;
  setWeights: (v: Record<string, string>) => void;
  onDone: () => void;
  onSkip: () => void;
  loading: boolean;
  error: string;
}) {
  return (
    <View style={styles.step}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Add your first lifts</Text>
        <Text style={styles.stepSubtitle}>
          Enter your current 1RM for any lifts you track. Skip if you're just
          getting started.
        </Text>
      </View>

      <View style={styles.exerciseList}>
        {POPULAR_EXERCISES.map((ex) => (
          <View key={ex} style={styles.exerciseRow}>
            <Text style={styles.exerciseName}>{ex}</Text>
            <View style={styles.weightInputRow}>
              <TextInput
                style={styles.weightInput}
                placeholder="—"
                placeholderTextColor={colors.muted}
                value={weights[ex] ?? ""}
                onChangeText={(v) =>
                  setWeights({ ...weights, [ex]: v.replace(/[^0-9.]/g, "") })
                }
                keyboardType="decimal-pad"
              />
              <Text style={styles.weightUnit}>{unit}</Text>
            </View>
          </View>
        ))}
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.doneRow}>
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={onSkip}
          disabled={loading}
        >
          <Text style={styles.skipBtnText}>Skip</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryBtn, styles.doneBtn, loading && styles.dimmed]}
          onPress={onDone}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.bg} />
          ) : (
            <Text style={styles.primaryBtnText}>Done</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.accent,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  step: { flex: 1, paddingTop: spacing.xl, gap: spacing.lg },
  stepHeader: { gap: spacing.sm },
  stepTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  stepSubtitle: { fontSize: 15, color: colors.muted, lineHeight: 21 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 15,
    color: colors.text,
    fontSize: 18,
  },
  error: { color: colors.error, fontSize: 14 },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryBtnText: { color: colors.bg, fontSize: 16, fontWeight: "700" },
  dimmed: { opacity: 0.45 },

  // Step 2
  unitRow: { flexDirection: "row", gap: spacing.md },
  unitBtn: {
    flex: 1,
    paddingVertical: 28,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
  },
  unitBtnActive: { borderColor: colors.accent, backgroundColor: colors.surface2 },
  unitBtnText: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  unitBtnTextActive: { color: colors.accent },

  // Step 3
  exerciseList: { gap: spacing.sm },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  exerciseName: { fontSize: 15, fontWeight: "600", color: colors.text, flex: 1 },
  weightInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  weightInput: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "right",
    minWidth: 56,
    padding: 0,
  },
  weightUnit: { fontSize: 14, color: colors.muted, width: 28 },
  doneRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm },
  skipBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: "center",
  },
  skipBtnText: { color: colors.muted, fontSize: 16, fontWeight: "600" },
  doneBtn: { flex: 2 },
});
