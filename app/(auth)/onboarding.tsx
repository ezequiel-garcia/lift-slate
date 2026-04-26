import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  useReducedMotion,
} from "react-native-reanimated";
import * as profileService from "@/services/profile.service";
import * as exerciseReferencesService from "@/services/exerciseReferences.service";
import { getExercisesByNames } from "@/services/exercises.service";
import { colors, animation } from "@/lib/theme";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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
  const reduceMotion = useReducedMotion();
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
    if (reduceMotion) {
      setStep(nextStep);
      return;
    }
    const dur = animation.duration.fast;
    translateX.value = withTiming(-24, { duration: dur });
    opacity.value = withTiming(0, { duration: dur }, (done) => {
      if (!done) return;
      runOnJS(setStep)(nextStep);
      translateX.value = 24;
      translateX.value = withTiming(0, { duration: dur + 20 });
      opacity.value = withTiming(1, { duration: dur + 20 });
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
        (ex) => weights[ex] && parseFloat(weights[ex]) > 0,
      );

      if (exercisesToSave.length > 0) {
        const exercises = await getExercisesByNames(exercisesToSave);

        if (exercises) {
          await Promise.all(
            exercises.map((ex) =>
              exerciseReferencesService.createExerciseReference({
                exerciseId: ex.id,
                weight: parseFloat(weights[ex.name]),
                unit,
              }),
            ),
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
    <SafeAreaView className="flex-1 bg-bg">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        {/* Step dots */}
        <View className="flex-row justify-center gap-1.5 pt-6 pb-4">
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              className={`h-2 rounded-full ${step === i ? "w-6 bg-accent" : "w-2 bg-border"}`}
            />
          ))}
        </View>

        <Animated.View style={[{ flex: 1 }, animatedStyle]}>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 24,
              paddingBottom: 32,
            }}
            keyboardShouldPersistTaps="handled"
          >
            {step === 1 && (
              <View className="flex-1 pt-8 gap-6">
                <View className="gap-2">
                  <Text
                    className="text-[30px] font-extrabold text-foreground"
                    style={{ letterSpacing: -0.5, lineHeight: 36 }}
                  >
                    What&apos;s your name?
                  </Text>
                  <Text className="text-[15px] text-muted leading-relaxed">
                    We&apos;ll use this to personalise your experience.
                  </Text>
                </View>
                <Input
                  placeholder="Your name"
                  value={name}
                  onChangeText={setName}
                  autoFocus
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={handleNext}
                />
                {!!error && <Text className="text-error text-sm">{error}</Text>}
                <Button label="Continue" onPress={handleNext} />
              </View>
            )}

            {step === 2 && (
              <View className="flex-1 pt-8 gap-6">
                <View className="gap-2">
                  <Text
                    className="text-[30px] font-extrabold text-foreground"
                    style={{ letterSpacing: -0.5, lineHeight: 36 }}
                  >
                    How do you{"\n"}measure weight?
                  </Text>
                  <Text className="text-[15px] text-muted leading-relaxed">
                    You can change this anytime in settings.
                  </Text>
                </View>
                <View className="flex-row gap-4">
                  {(["kg", "lbs"] as WeightUnit[]).map((u) => (
                    <Pressable
                      key={u}
                      className={`flex-1 py-7 rounded-2xl items-center border-2 ${
                        unit === u
                          ? "border-accent bg-surface2"
                          : "border-border bg-surface"
                      }`}
                      onPress={() => setUnit(u)}
                    >
                      <Text
                        className={`text-[22px] font-bold uppercase ${
                          unit === u ? "text-accent" : "text-muted"
                        }`}
                        style={{ letterSpacing: 1 }}
                      >
                        {u}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Button label="Continue" onPress={handleNext} />
              </View>
            )}

            {step === 3 && (
              <View className="flex-1 pt-8 gap-6">
                <View className="gap-2">
                  <Text
                    className="text-[30px] font-extrabold text-foreground"
                    style={{ letterSpacing: -0.5, lineHeight: 36 }}
                  >
                    Add your first lifts
                  </Text>
                  <Text className="text-[15px] text-muted leading-relaxed">
                    Enter your current 1RM for any lifts you track. Skip if
                    you&apos;re just getting started.
                  </Text>
                </View>

                <View className="gap-2">
                  {POPULAR_EXERCISES.map((ex) => (
                    <View
                      key={ex}
                      className="flex-row items-center justify-between bg-surface border border-border rounded-xl px-4 py-2.5"
                    >
                      <Text className="text-[15px] font-semibold text-foreground flex-1">
                        {ex}
                      </Text>
                      <View className="flex-row items-center gap-2">
                        <TextInput
                          className="text-foreground text-[16px] font-semibold text-right"
                          style={{ minWidth: 56, padding: 0 }}
                          placeholder="—"
                          placeholderTextColor={colors.muted}
                          value={weights[ex] ?? ""}
                          onChangeText={(v) =>
                            setWeights({
                              ...weights,
                              [ex]: v.replace(/[^0-9.]/g, ""),
                            })
                          }
                          keyboardType="decimal-pad"
                        />
                        <Text className="text-sm text-muted w-7">{unit}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                {!!error && <Text className="text-error text-sm">{error}</Text>}

                <View className="flex-row gap-4 mt-1">
                  <View className="flex-1">
                    <Button
                      label="Skip"
                      variant="secondary"
                      onPress={handleSkip}
                      disabled={loading}
                    />
                  </View>
                  <View className="flex-[2]">
                    <Button
                      label="Done"
                      onPress={handleDone}
                      loading={loading}
                      disabled={loading}
                    />
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
