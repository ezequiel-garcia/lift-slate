import { Database } from "./database.types";

export type ExerciseReference =
  Database["public"]["Tables"]["exercise_references"]["Row"];
export type ReferenceType = Database["public"]["Enums"]["reference_type"];
export type ReferenceSource = Database["public"]["Enums"]["max_source"];
export type PrescriptionMode = Database["public"]["Enums"]["prescription_mode"];
