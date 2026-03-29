export type ItemFormData = {
  localId: string;
  itemType: "exercise" | "custom_exercise";
  // exercise (catalog)
  exerciseId?: string;
  exerciseName?: string;
  // custom_exercise
  content?: string;
  // shared
  sets?: string;
  reps?: string;
  weightMode: "percentage" | "none";
  percentage?: string;
  maxTypeReference?: string;
  weightKg?: string;
  notes?: string;
};

export type SectionFormData = {
  localId: string;
  title: string;
  items: ItemFormData[];
};
