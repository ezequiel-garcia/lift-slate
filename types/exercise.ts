import { Database } from "./database.types";

export type EquipmentType = Database["public"]["Enums"]["equipment_type"];
export type Exercise = Database["public"]["Tables"]["exercises"]["Row"];

export type ExerciseTrend = "up" | "down" | "same";

export type ExerciseSummary = {
  exerciseId: string;
  name: string;
  equipmentType: EquipmentType;
  referenceType: Database["public"]["Enums"]["reference_type"];
  currentWeightKg: number | null;
  currentReps: number | null;
  trend: ExerciseTrend;
};
