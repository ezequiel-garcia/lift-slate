import { useTranslation } from "react-i18next";
import type { PrescriptionMode } from "@/types/exerciseReference";

export function usePrescriptionLabel() {
  const { t } = useTranslation();
  return (mode: PrescriptionMode) => t(`prescription.${mode}`);
}
