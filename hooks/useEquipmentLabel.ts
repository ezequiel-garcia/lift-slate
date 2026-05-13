import { useTranslation } from "react-i18next";
import type { EquipmentType } from "@/types/exercise";

export function useEquipmentLabel() {
  const { t } = useTranslation();
  return (type: EquipmentType) => t(`equipment.${type}`);
}
