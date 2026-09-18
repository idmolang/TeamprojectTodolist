import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { CardRecord, CardStatus, Member } from "../types";
import { STATUS_LABEL } from "../types";
import { SortableCard } from "./SortableCard";

export function Column({
  status,
  cardIds,
  cardsById,
  members,
  onAddCard,
  onOpenCard,
  onStartCard,
  onCompleteCard,
}: {
  status: CardStatus;
  cardIds: string[];
  cardsById: Map<string, CardRecord>;
  members: Member[];
  onAddCard: (status: CardStatus) => void;
  onOpenCard: (card: CardRecord) => void;
  onStartCard: (cardId: string) => void;
  onCompleteCard: (cardId: string) => void;
}) {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <section className="column" data-status={status}>
      <div className="column-header">
        <h2>
          {STATUS_LABEL[status]} <span className="count">{cardIds.length}</span>
        </h2>
        <button type="button" className="add-card-btn" onClick={() => onAddCard(status)}>
          + 카드 추가
        </button>
      </div>
      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="card-list">
          {cardIds.length === 0 && <p className="empty-hint">카드가 없습니다</p>}
          {cardIds.map((id) => {
            const card = cardsById.get(id);
            if (!card) return null;
            return (
              <SortableCard
                key={id}
                card={card}
                members={members}
                onOpen={onOpenCard}
                onStart={onStartCard}
                onComplete={onCompleteCard}
              />
            );
          })}
        </div>
      </SortableContext>
    </section>
  );
}
