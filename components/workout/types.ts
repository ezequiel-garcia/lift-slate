import { EquipmentType } from "@/types/exercise";
import { PrescriptionMode } from "@/types/exerciseReference";

export type ItemFormData = {
  localId: string;
  itemType: "exercise" | "custom_exercise";
  // exercise (catalog)
  exerciseId?: string;
  exerciseName?: string;
  exerciseEquipment?: EquipmentType;
  // custom_exercise
  content?: string;
  // shared
  sets?: string;
  reps?: string;
  prescriptionMode?: PrescriptionMode;
  percentage?: string;
  weightKg?: string;
  notes?: string;
};

export type SectionFormData = {
  localId: string;
  title: string;
  items: ItemFormData[];
};

export const DEFAULT_PRESCRIPTION_BY_EQUIPMENT: Record<
  EquipmentType,
  PrescriptionMode
> = {
  barbell: "percentage",
  dumbbell: "working_weight",
  kettlebell: "working_weight",
  machine: "working_weight",
  bodyweight: "reps_only",
  other: "reps_only",
};

export const ALLOWED_PRESCRIPTIONS_BY_EQUIPMENT: Record<
  EquipmentType,
  PrescriptionMode[]
> = {
  barbell: ["percentage", "absolute", "reps_only"],
  dumbbell: ["working_weight", "heavy", "easy", "absolute", "reps_only"],
  kettlebell: ["working_weight", "heavy", "easy", "absolute", "reps_only"],
  machine: ["working_weight", "heavy", "easy", "absolute", "reps_only"],
  bodyweight: ["reps_only", "absolute", "bodyweight"],
  other: ["absolute", "reps_only"],
};

export const PRESCRIPTION_LABELS: Record<PrescriptionMode, string> = {
  percentage: "% of 1RM",
  working_weight: "Working Weight",
  heavy: "Heavy",
  easy: "Easy",
  absolute: "Exact kg",
  reps_only: "Reps only",
  bodyweight: "Bodyweight",
};
