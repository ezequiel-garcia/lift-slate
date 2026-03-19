import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useCreateGym } from "@/hooks/useGym";
import { uploadGymLogo } from "@/services/storage.service";
import { useAppStore } from "@/stores/appStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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
          className="w-10 h-10 rounded-full bg-surface items-center justify-center"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Ionicons name="chevron-back" size={20} color={colors.foreground} />
        </Pressable>
        <Text className="flex-1 text-center text-foreground text-lg font-bold -ml-10">
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
            <Input
              label="Gym Name *"
              placeholder="e.g. Iron Temple"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoFocus
            />
            <Input
              label="Description"
              placeholder="Tell athletes about your gym..."
              value={description}
              onChangeText={setDescription}
              multiline
              style={{ minHeight: 100, textAlignVertical: "top" }}
            />
            <Input
              label="Address"
              placeholder="123 Main St, City"
              value={address}
              onChangeText={setAddress}
              autoCapitalize="words"
            />
          </View>

          {!!error && (
            <Text className="text-error text-sm mt-4">{error}</Text>
          )}

          <View className="mt-6">
            <Button
              label="Create Gym"
              onPress={handleCreate}
              loading={loading}
              disabled={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
