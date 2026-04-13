import { colors } from "@/lib/theme";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  visible: boolean;
  onCancel: () => void;
  onConfirmDelete: () => Promise<void>;
  isGymOwner?: boolean;
}

const SPRING = { damping: 28, stiffness: 200, mass: 0.8 };
const SHEET_OFFSET = 600;
const CONFIRM_WORD = "DELETE";

const CONSEQUENCES = [
  {
    icon: "barbell-outline" as const,
    label: "All your lifts and personal maxes",
  },
  { icon: "time-outline" as const, label: "Your complete training history" },
  { icon: "person-outline" as const, label: "Your account and profile data" },
];

export function DeleteAccountModal({
  visible,
  onCancel,
  onConfirmDelete,
  isGymOwner,
}: Props) {
  const insets = useSafeAreaInsets();
  const [confirmText, setConfirmText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const translateY = useSharedValue(SHEET_OFFSET);
  const backdropOpacity = useSharedValue(0);

  const isConfirmed = confirmText.trim().toUpperCase() === CONFIRM_WORD;
  const canDelete = isConfirmed && !isSubmitting && !isGymOwner;

  useEffect(() => {
    if (visible) {
      setConfirmText("");
      setError(null);
      backdropOpacity.value = withTiming(1, { duration: 220 });
      translateY.value = withSpring(0, SPRING);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [visible, backdropOpacity, translateY]);

  function handleClose() {
    if (isSubmitting) return;
    backdropOpacity.value = withTiming(0, { duration: 200 });
    translateY.value = withSpring(SHEET_OFFSET, SPRING, (finished) => {
      if (finished) runOnJS(onCancel)();
    });
  }

  async function handleConfirm() {
    if (!canDelete) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirmDelete();
      onCancel();
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      {/* Backdrop */}
      <Animated.View
        style={[
          {
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.65)",
          },
          backdropStyle,
        ]}
      >
        <Pressable style={{ flex: 1 }} onPress={handleClose} />
      </Animated.View>

      {/* Sheet */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, justifyContent: "flex-end" }}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            {
              backgroundColor: colors.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
            },
            sheetStyle,
          ]}
        >
          {/* Handle */}
          <View
            style={{ alignItems: "center", paddingTop: 12, paddingBottom: 20 }}
          >
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: colors.border,
              }}
            />
          </View>

          {/* Scrollable content — shrinks when keyboard is open */}
          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24 }}
          >
            {/* Title */}
            <Text
              style={{
                color: colors.foreground,
                fontSize: 20,
                fontWeight: "600",
                textAlign: "center",
                marginBottom: 6,
              }}
            >
              Delete account
            </Text>

            {isGymOwner ? (
              <>
                {/* Gym owner warning */}
                <View
                  style={{
                    backgroundColor: colors.surface2,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    flexDirection: "row",
                    gap: 12,
                    alignItems: "flex-start",
                  }}
                >
                  <Ionicons
                    name="alert-circle"
                    size={20}
                    color={colors.error}
                    style={{ marginTop: 1 }}
                  />
                  <Text
                    style={{
                      color: colors.foreground,
                      fontSize: 14,
                      lineHeight: 20,
                      flex: 1,
                    }}
                  >
                    You are the owner of a gym. You must delete or transfer your
                    gym before you can delete your account.
                  </Text>
                </View>
              </>
            ) : (
              <>
                {/* Subtitle */}
                <Text
                  style={{
                    color: colors.muted,
                    fontSize: 14,
                    lineHeight: 20,
                    textAlign: "center",
                    marginBottom: 16,
                  }}
                >
                  This is permanent and cannot be undone.{"\n"}All your lifts,
                  history, and account data will be lost.
                </Text>

                {/* Consequences list */}
                <View
                  style={{
                    backgroundColor: colors.surface2,
                    borderRadius: 12,
                    paddingVertical: 4,
                    marginBottom: 12,
                  }}
                >
                  {CONSEQUENCES.map((item, i) => (
                    <View
                      key={item.icon}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 16,
                        paddingVertical: 11,
                        gap: 12,
                        borderBottomWidth: i < CONSEQUENCES.length - 1 ? 1 : 0,
                        borderBottomColor: colors.border,
                      }}
                    >
                      <Ionicons
                        name={item.icon}
                        size={17}
                        color={colors.muted}
                      />
                      <Text
                        style={{
                          color: colors.foreground,
                          fontSize: 14,
                          flex: 1,
                        }}
                      >
                        {item.label}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Input */}
                <View style={{ position: "relative" }}>
                  <TextInput
                    ref={inputRef}
                    value={confirmText}
                    onChangeText={setConfirmText}
                    placeholder="Type DELETE to confirm"
                    placeholderTextColor={colors.muted}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    editable={!isSubmitting}
                    onSubmitEditing={handleConfirm}
                    returnKeyType="done"
                    style={{
                      backgroundColor: colors.surface2,
                      borderRadius: 12,
                      paddingLeft: 14,
                      paddingRight: isConfirmed ? 40 : 14,
                      color: colors.foreground,
                      fontSize: 15,
                      fontWeight: "500",
                      borderWidth: 1,
                      borderColor: colors.border,
                      height: 48,
                    }}
                  />
                  {isConfirmed && (
                    <View
                      style={{
                        position: "absolute",
                        right: 14,
                        top: 0,
                        bottom: 0,
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.muted}
                      />
                    </View>
                  )}
                </View>

                {error && (
                  <Text
                    style={{ color: colors.error, fontSize: 13, marginTop: 6 }}
                  >
                    {error}
                  </Text>
                )}
              </>
            )}

            {/* Spacer so content doesn't sit flush against the footer */}
            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Pinned footer — always visible above keyboard */}
          <View
            style={{
              paddingHorizontal: 24,
              paddingTop: 8,
              paddingBottom: Math.max(insets.bottom, 24),
              gap: 10,
            }}
          >
            {/* Primary action */}
            {isGymOwner ? (
              <Pressable
                onPress={handleClose}
                className="h-[52px] rounded-2xl items-center justify-center bg-surface2 active:opacity-85"
              >
                <Text className="text-base font-semibold text-foreground">
                  Got it
                </Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={handleConfirm}
                disabled={!canDelete}
                className={`h-[52px] rounded-2xl items-center justify-center active:opacity-85 ${isConfirmed ? "bg-error" : "bg-surface2"}`}
              >
                {isSubmitting ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <ActivityIndicator size="small" color="#fff" />
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 16,
                        fontWeight: "600",
                      }}
                    >
                      Deleting…
                    </Text>
                  </View>
                ) : (
                  <Text
                    className={`text-base font-semibold ${isConfirmed ? "text-white" : "text-muted"}`}
                  >
                    Delete account
                  </Text>
                )}
              </Pressable>
            )}

            {/* Secondary — Cancel (hidden for gym owners since "Got it" closes) */}
            {!isGymOwner && (
              <Pressable
                onPress={handleClose}
                disabled={isSubmitting}
                className={`h-[52px] rounded-2xl items-center justify-center bg-surface2 border border-border active:opacity-50 ${isSubmitting ? "opacity-50" : ""}`}
              >
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: 16,
                    fontWeight: "600",
                  }}
                >
                  Cancel
                </Text>
              </Pressable>
            )}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
