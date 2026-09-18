import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import type { CardInput, CardRecord, CardStatus, ChecklistItem, Member } from "../types";

interface UseBoardDataResult {
  members: Member[];
  cards: CardRecord[];
  loading: boolean;
  error: string | null;
  createCard: (status: CardStatus, input: CardInput) => Promise<void>;
  updateCard: (id: string, patch: CardInput) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  moveCard: (cardId: string, newStatus: CardStatus, newIndex: number) => void;
  addMembers: (names: string[]) => Promise<Member[]>;
  removeMember: (id: string) => Promise<void>;
  updateChecklist: (cardId: string, checklist: ChecklistItem[]) => Promise<void>;
}

export function useBoardData(teamId: string | null): UseBoardDataResult {
  const [members, setMembers] = useState<Member[]>([]);
  const [cards, setCards] = useState<CardRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cardsRef = useRef<CardRecord[]>([]);

  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);

  useEffect(() => {
    if (!teamId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      const [membersRes, cardsRes] = await Promise.all([
        supabase.from("members").select("*").eq("team_id", teamId).order("created_at"),
        supabase.from("cards").select("*").eq("team_id", teamId).order("position"),
      ]);
      if (cancelled) return;
      if (membersRes.error || cardsRes.error) {
        setError(membersRes.error?.message ?? cardsRes.error?.message ?? "데이터를 불러오지 못했습니다.");
      } else {
        setMembers(membersRes.data ?? []);
        setCards(cardsRes.data ?? []);
      }
      setLoading(false);
    }

    load();

    const channel = supabase
      .channel(`board-${teamId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cards", filter: `team_id=eq.${teamId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as CardRecord;
            setCards((prev) => (prev.some((c) => c.id === row.id) ? prev : [...prev, row]));
          } else if (payload.eventType === "UPDATE") {
            const row = payload.new as CardRecord;
            setCards((prev) => prev.map((c) => (c.id === row.id ? row : c)));
          } else if (payload.eventType === "DELETE") {
            const row = payload.old as { id: string };
            setCards((prev) => prev.filter((c) => c.id !== row.id));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "members", filter: `team_id=eq.${teamId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as Member;
            setMembers((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
          } else if (payload.eventType === "DELETE") {
            const row = payload.old as { id: string };
            setMembers((prev) => prev.filter((m) => m.id !== row.id));
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [teamId]);

  const createCard = useCallback(
    async (status: CardStatus, input: CardInput) => {
      if (!teamId) return;
      const position = cardsRef.current.filter((c) => c.status === status).length;
      const { data, error: insertError } = await supabase
        .from("cards")
        .insert({ team_id: teamId, status, position, ...input })
        .select()
        .single();
      if (insertError) {
        setError(insertError.message);
        return;
      }
      if (data) {
        setCards((prev) => (prev.some((c) => c.id === data.id) ? prev : [...prev, data as CardRecord]));
      }
    },
    [teamId]
  );

  const updateCard = useCallback(async (id: string, patch: CardInput) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    const { error: updateError } = await supabase.from("cards").update(patch).eq("id", id);
    if (updateError) setError(updateError.message);
  }, []);

  const deleteCard = useCallback(async (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
    const { error: deleteError } = await supabase.from("cards").delete().eq("id", id);
    if (deleteError) setError(deleteError.message);
  }, []);

  const moveCard = useCallback((cardId: string, newStatus: CardStatus, newIndex: number) => {
    const current = cardsRef.current;
    const moving = current.find((c) => c.id === cardId);
    if (!moving) return;
    const oldStatus = moving.status;

    const targetGroup = current
      .filter((c) => c.status === newStatus && c.id !== cardId)
      .sort((a, b) => a.position - b.position);
    const clampedIndex = Math.max(0, Math.min(newIndex, targetGroup.length));
    targetGroup.splice(clampedIndex, 0, { ...moving, status: newStatus });

    const updates: Array<{ id: string; status: CardStatus; position: number }> = targetGroup.map((c, idx) => ({
      id: c.id,
      status: newStatus,
      position: idx,
    }));

    if (oldStatus !== newStatus) {
      const sourceGroup = current
        .filter((c) => c.status === oldStatus && c.id !== cardId)
        .sort((a, b) => a.position - b.position);
      sourceGroup.forEach((c, idx) => updates.push({ id: c.id, status: oldStatus, position: idx }));
    }

    setCards((prev) =>
      prev.map((c) => {
        const u = updates.find((u) => u.id === c.id);
        return u ? { ...c, status: u.status, position: u.position } : c;
      })
    );

    Promise.all(
      updates.map((u) => supabase.from("cards").update({ status: u.status, position: u.position }).eq("id", u.id))
    ).catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  const updateChecklist = useCallback(
    async (cardId: string, checklist: ChecklistItem[]) => {
      setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, checklist } : c)));
      const { error: updateError } = await supabase.from("cards").update({ checklist }).eq("id", cardId);
      if (updateError) {
        setError(updateError.message);
        return;
      }

      // 체크리스트 항목이 1개 이상이고 전부 완료되면 자동으로 '완료' 칼럼으로 이동한다.
      const current = cardsRef.current.find((c) => c.id === cardId);
      const allDone = checklist.length > 0 && checklist.every((item) => item.done);
      if (allDone && current && current.status !== "done") {
        moveCard(cardId, "done", Number.MAX_SAFE_INTEGER);
      }
    },
    [moveCard]
  );

  const addMembers = useCallback(
    async (names: string[]) => {
      if (!teamId) return [];
      const existingLower = new Set(members.map((m) => m.name.trim().toLowerCase()));
      const uniqueNew = [...new Set(names.map((n) => n.trim()).filter(Boolean))].filter(
        (n) => !existingLower.has(n.toLowerCase())
      );
      if (uniqueNew.length === 0) return [];
      const { data, error: insertError } = await supabase
        .from("members")
        .insert(uniqueNew.map((name) => ({ team_id: teamId, name })))
        .select();
      if (insertError) {
        // 23505 = unique_violation: 다른 요청이 그 사이 같은 이름을 먼저 등록한 경우로,
        // 사용자에게 에러로 보여줄 필요 없이 실시간 구독이 최신 목록을 채워준다.
        if (insertError.code !== "23505") setError(insertError.message);
        return [];
      }
      const rows = (data ?? []) as Member[];
      setMembers((prev) => [...prev, ...rows.filter((r) => !prev.some((m) => m.id === r.id))]);
      return rows;
    },
    [teamId, members]
  );

  const removeMember = useCallback(async (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    const { error: deleteError } = await supabase.from("members").delete().eq("id", id);
    if (deleteError) setError(deleteError.message);
  }, []);

  return {
    members,
    cards,
    loading,
    error,
    createCard,
    updateCard,
    deleteCard,
    moveCard,
    addMembers,
    removeMember,
    updateChecklist,
  };
}
