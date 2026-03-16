import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useCreateGym } from "@/hooks/useGym";
import { uploadGymLogo } from "@/services/storage.service";
import { useAppStore } from "@/stores/appStore";
import { colors } from "@/lib/theme";

export default function CreateGymScreen() {
  const router = useRouter();
  const createGym = useCreateGym();
  const showToast = useAppStore((s) => s.showToast);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setError("Photo library permission is required to pick a logo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0]);
    }
  };

  const handleCreate = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Gym name is required.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      let logoUrl: string | undefined;

      if (image?.base64) {
        logoUrl = await uploadGymLogo(
          image.base64,
          image.fileName ?? "logo.jpg",
          image.mimeType ?? "image/jpeg"
        );
      }

      const gym = await createGym.mutateAsync({
        name: trimmedName,
        description: description.trim() || undefined,
        address: address.trim() || undefined,
        logoUrl,
      });

      showToast("Gym created successfully!");
      router.replace("/(tabs)/gym");
    } catch (e: any) {
      const raw = e?.message || e?.error_description || "";
      if (raw.includes("gym_memberships_user_id_key")) {
        setError("You already belong to a gym. Leave your current gym before creating a new one.");
      } else {
        setError(raw || "Failed to create gym.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3">
        <Pressable
          onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/gym")}
          className="w-9 h-9 rounded-full bg-surface items-center justify-center"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <Text className="flex-1 text-center text-foreground text-lg font-bold -ml-9">
          Create Gym
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pt-2 pb-8"
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo picker */}
          <Pressable
            className="self-center mb-8"
            onPress={pickImage}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            {image ? (
              <Image
                source={{ uri: image.uri }}
                style={{ width: 96, height: 96, borderRadius: 16 }}
                contentFit="cover"
              />
            ) : (
              <View className="w-24 h-24 rounded-2xl bg-surface border border-border items-center justify-center">
                <Ionicons name="camera-outline" size={28} color={colors.muted} />
                <Text className="text-muted text-xs mt-1">Add Logo</Text>
              </View>
            )}
          </Pressable>

          {/* Form */}
          <View className="gap-4">
            <View className="gap-1.5">
              <Text className="text-muted text-xs uppercase tracking-wider font-semibold">
                Gym Name *
              </Text>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-3.5 text-foreground text-base"
                placeholder="e.g. Iron Temple"
                placeholderTextColor={colors.muted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoFocus
              />
            </View>

            <View className="gap-1.5">
              <Text className="text-muted text-xs uppercase tracking-wider font-semibold">
                Description
              </Text>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-3.5 text-foreground text-base min-h-[100px]"
                placeholder="Tell athletes about your gym..."
                placeholderTextColor={colors.muted}
                value={description}
                onChangeText={setDescription}
                multiline
                textAlignVertical="top"
              />
            </View>

            <View className="gap-1.5">
              <Text className="text-muted text-xs uppercase tracking-wider font-semibold">
                Address
              </Text>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-3.5 text-foreground text-base"
                placeholder="123 Main St, City"
                placeholderTextColor={colors.muted}
                value={address}
                onChangeText={setAddress}
                autoCapitalize="words"
              />
            </View>
          </View>

          {!!error && (
            <Text className="text-error text-sm mt-4">{error}</Text>
          )}

          {/* Submit */}
          <Pressable
            className={`bg-accent rounded-2xl py-4 items-center mt-6 ${loading ? "opacity-45" : ""}`}
            onPress={handleCreate}
            disabled={loading}
            style={({ pressed }) => (!loading && pressed ? { opacity: 0.85 } : {})}
          >
            {loading ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <Text className="text-bg font-bold text-base">Create Gym</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
