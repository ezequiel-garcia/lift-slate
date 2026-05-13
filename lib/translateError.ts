import i18n from "@/lib/i18n";

const BLOCK_TYPE_KEYS = new Set([
  "warmup",
  "strength",
  "conditioning",
  "accessory",
  "custom",
]);

/** Maps known English service/DB error messages to translated UI copy. */
export function translateError(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) return i18n.t("common.error_generic");

  const lower = trimmed.toLowerCase();

  if (trimmed.includes("Only image files are allowed"))
    return i18n.t("errors.invalid_image_type");
  if (trimmed.includes("Image must be smaller than 5 MB"))
    return i18n.t("errors.image_too_large");
  if (trimmed === "Not authenticated")
    return i18n.t("errors.not_authenticated");
  if (trimmed === "Failed to delete account")
    return i18n.t("errors.delete_account_failed");
  if (lower.includes("delete or transfer your gym"))
    return i18n.t("errors.gym_owner_must_delete");
  if (trimmed === "Invalid invite link")
    return i18n.t("errors.invalid_invite_link");
  if (trimmed === "Invalid or expired code")
    return i18n.t("errors.invalid_or_expired_code");
  if (lower.includes("too many attempts"))
    return i18n.t("errors.too_many_attempts");
  if (lower.includes("already") && lower.includes("gym"))
    return i18n.t("join_gym.error_already_in_gym");
  if (lower.includes("limit") || lower.includes("full"))
    return i18n.t("join_gym.error_gym_full");
  if (lower.includes("invalid") && lower.includes("invite"))
    return i18n.t("join_gym.error_invalid_link");
  if (lower.includes("invalid") && lower.includes("code"))
    return i18n.t("join_gym.error_invalid_code");

  return trimmed;
}

export function translateBlockType(
  blockType: string | null | undefined,
): string {
  if (!blockType || !BLOCK_TYPE_KEYS.has(blockType)) return blockType ?? "";
  return i18n.t(`workout.block_${blockType}`);
}
