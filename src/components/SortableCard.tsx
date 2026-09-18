import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CardRecord, Member } from "../types";
import { CardView } from "./CardView";

export function SortableCard({
  card,
  members,
  onOpen,
  onStart,
  onComplete,
}: {
  card: CardRecord;
  members: Member[];
  onOpen: (card: CardRecord) => void;
  onStart: (cardId: string) => void;
  onComplete: (cardId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <CardView card={card} members={members} onClick={() => onOpen(card)} onStart={onStart} onComplete={onComplete} />
    </div>
  );
}
