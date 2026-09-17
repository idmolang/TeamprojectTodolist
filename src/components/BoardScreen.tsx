import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { supabase } from "../lib/supabase";
import { useBoardData } from "../hooks/useBoardData";
import type { CardRecord, CardStatus, CurrentMember, Team } from "../types";
import { STATUSES, STATUS_LABEL } from "../types";
import { Header } from "./Header";
import { Column } from "./Column";
import { CardView } from "./CardView";
import { CardModal } from "./CardModal";
import { MemberModal } from "./MemberModal";

type ColumnMap = Record<CardStatus, string[]>;

function buildColumns(cards: CardRecord[]): ColumnMap {
  const map: ColumnMap = { todo: [], in_progress: [], done: [] };
  for (const status of STATUSES) {
    map[status] = cards
      .filter((c) => c.status === status)
      .sort((a, b) => a.position - b.position)
      .map((c) => c.id);
  }
  return map;
}

type ModalState = { kind: "create"; status: CardStatus } | { kind: "edit"; cardId: string } | null;

export function BoardScreen({ team, member }: { team: Team; member: CurrentMember }) {
  const { members, cards, error, createCard, updateCard, deleteCard, moveCard, addMembers, removeMember, updateChecklist } =
    useBoardData(team.id);

  const [teamName, setTeamName] = useState(team.name);
  const [activeTab, setActiveTab] = useState<CardStatus>("todo");
  const [modal, setModal] = useState<ModalState>(null);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [columns, setColumns] = useState<ColumnMap>(() => buildColumns(cards));
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (isDraggingRef.current) return;
    setColumns(buildColumns(cards));
  }, [cards]);

  const cardsById = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function findContainer(id: string): CardStatus | undefined {
    if ((STATUSES as string[]).includes(id)) return id as CardStatus;
    return STATUSES.find((s) => columns[s].includes(id));
  }

  function handleDragStart(event: DragStartEvent) {
    isDraggingRef.current = true;
    setActiveDragId(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeContainer = findContainer(active.id as string);
    const overContainer = findContainer(over.id as string);
    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    setColumns((prev) => {
      const activeItems = prev[activeContainer];
      const overItems = prev[overContainer];
      const activeIndex = activeItems.indexOf(active.id as string);
      if (activeIndex === -1) return prev;
      let overIndex = overItems.indexOf(over.id as string);
      if (overIndex === -1) overIndex = overItems.length;
      return {
        ...prev,
        [activeContainer]: activeItems.filter((id) => id !== active.id),
        [overContainer]: [...overItems.slice(0, overIndex), active.id as string, ...overItems.slice(overIndex)],
      };
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    isDraggingRef.current = false;
    setActiveDragId(null);
    if (!over) return;

    const activeContainer = findContainer(active.id as string);
    const overContainer = findContainer(over.id as string);
    if (!activeContainer || !overContainer) return;

    let finalIndex: number;
    if (activeContainer === overContainer) {
      const items = columns[activeContainer];
      const oldIndex = items.indexOf(active.id as string);
      let newIndex = items.indexOf(over.id as string);
      if (newIndex === -1) newIndex = items.length - 1;
      if (oldIndex !== -1 && oldIndex !== newIndex) {
        setColumns((prev) => ({ ...prev, [activeContainer]: arrayMove(items, oldIndex, newIndex) }));
      }
      finalIndex = newIndex;
    } else {
      const items = columns[overContainer];
      finalIndex = items.indexOf(active.id as string);
      if (finalIndex === -1) finalIndex = items.length;
    }

    moveCard(active.id as string, overContainer, finalIndex);
  }

  async function handleRenameTeam(name: string) {
    setTeamName(name);
    const { error: updateError } = await supabase.from("teams").update({ name }).eq("id", team.id);
    if (updateError) console.error(updateError);
  }

  const activeDragCard = activeDragId ? cardsById.get(activeDragId) : undefined;

  return (
    <div className="app-shell">
      <Header team={{ ...team, name: teamName }} members={members} onRenameTeam={handleRenameTeam} onOpenMembers={() => setMemberModalOpen(true)} />

      <nav className="column-tabs" aria-label="칼럼 전환">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            className={`tab-btn ${activeTab === s ? "is-active" : ""}`}
            onClick={() => setActiveTab(s)}
          >
            {STATUS_LABEL[s]}
          </button>
        ))}
      </nav>

      {error && <p className="board-error">⚠ {error}</p>}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <main className="board" data-active-status={activeTab}>
          {STATUSES.map((status) => (
            <Column
              key={status}
              status={status}
              cardIds={columns[status]}
              cardsById={cardsById}
              members={members}
              onAddCard={(s) => setModal({ kind: "create", status: s })}
              onOpenCard={(card) => setModal({ kind: "edit", cardId: card.id })}
              onStartCard={(cardId) => moveCard(cardId, "in_progress", Number.MAX_SAFE_INTEGER)}
            />
          ))}
        </main>
        <DragOverlay>{activeDragCard ? <CardView card={activeDragCard} members={members} /> : null}</DragOverlay>
      </DndContext>

      {modal?.kind === "create" && (
        <CardModal
          mode="create"
          status={modal.status}
          members={members}
          onClose={() => setModal(null)}
          onSave={(input) => createCard(modal.status, input)}
          onQuickAddMembers={addMembers}
        />
      )}
      {modal?.kind === "edit" &&
        (() => {
          // 스냅샷을 들고 있지 않고 매 렌더마다 최신 카드를 조회한다 —
          // 칼럼 이동 직후 곧바로 카드를 열어도 불완전한 데이터를 보여주지 않기 위함.
          const editingCard = cardsById.get(modal.cardId);
          if (!editingCard) return null;
          return (
            <CardModal
              mode="edit"
              status={editingCard.status}
              card={editingCard}
              members={members}
              onClose={() => setModal(null)}
              onSave={(input) => updateCard(modal.cardId, input)}
              onDelete={() => deleteCard(modal.cardId)}
              onQuickAddMembers={addMembers}
              onUpdateChecklist={(checklist) => updateChecklist(modal.cardId, checklist)}
            />
          );
        })()}
      {memberModalOpen && (
        <MemberModal
          team={team}
          members={members}
          onClose={() => setMemberModalOpen(false)}
          onAddMembers={addMembers}
          onRemoveMember={removeMember}
        />
      )}

      <p className="current-member-hint">
        참여자: <strong>{member.name}</strong>
      </p>
    </div>
  );
}
