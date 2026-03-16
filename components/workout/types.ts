export type ItemFormData = {
  localId: string;
  itemType: "structured" | "free_text";
  // structured
  exerciseId?: string;
  exerciseName?: string;
  sets?: string;
  reps?: string;
  weightMode: "percentage" | "none";
  percentage?: string;
  maxTypeReference?: string;
  weightKg?: string;
  // free_text
  content?: string;
  // shared
  notes?: string;
};

export type SectionFormData = {
  localId: string;
  title: string;
  items: ItemFormData[];
};
