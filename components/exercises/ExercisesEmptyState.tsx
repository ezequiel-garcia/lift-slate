import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

type Props = { onAdd: () => void };

export function ExercisesEmptyState({ onAdd }: Props) {
  return (
    <EmptyState
      icon="barbell-outline"
      title="No lifts yet"
      description={"Track your 1RMs to auto-calculate\ntraining weights"}
      action={<Button label="Add your first exercise" onPress={onAdd} />}
    />
  );
}
