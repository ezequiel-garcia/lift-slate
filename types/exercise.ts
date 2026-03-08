import { Database } from "./database.types";

export type ExerciseCategory = Database["public"]["Enums"]["exercise_category"];
export type Exercise = Database["public"]["Tables"]["exercises"]["Row"];

export type ExerciseTrend = "up" | "down" | "same";

export type ExerciseSummary = {
  exerciseId: string;
  name: string;
  category: ExerciseCategory | null;
  currentWeightKg: number;
  trend: ExerciseTrend;
};
