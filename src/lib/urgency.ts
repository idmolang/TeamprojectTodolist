import type { CardRecord } from "../types";

export type UrgencyLevel = "done" | "no-date" | "overdue" | "warning" | "normal";

export interface Urgency {
  level: UrgencyLevel;
  badgeText: string;
  diffDays: number | null;
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * 마감 초과 여부는 서버 배치 없이 매 렌더링 시 클라이언트에서 계산한다 (PRD 아키텍처 개요 참고).
 */
export function getUrgency(card: Pick<CardRecord, "status" | "due_date">): Urgency {
  if (card.status === "done") {
    return { level: "done", badgeText: "완료", diffDays: null };
  }
  if (!card.due_date) {
    return { level: "no-date", badgeText: "마감 미정", diffDays: null };
  }

  const today = startOfToday();
  const due = new Date(`${card.due_date}T00:00:00`);
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86_400_000);

  if (diffDays < 0) {
    return { level: "overdue", badgeText: `지연 D+${Math.abs(diffDays)}`, diffDays };
  }
  if (diffDays <= 1) {
    return { level: "warning", badgeText: diffDays === 0 ? "D-day" : "D-1", diffDays };
  }
  return { level: "normal", badgeText: `D-${diffDays}`, diffDays };
}
