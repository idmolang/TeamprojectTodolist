export type CardStatus = "todo" | "in_progress" | "done";

export type Priority = "high" | "medium" | "low";

export interface Team {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
}

export interface Member {
  id: string;
  team_id: string;
  name: string;
  created_at: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface CardRecord {
  id: string;
  team_id: string;
  title: string;
  description: string | null;
  assignee_ids: string[];
  due_date: string | null;
  priority: Priority | null;
  link: string | null;
  status: CardStatus;
  position: number;
  checklist: ChecklistItem[];
  created_at: string;
  updated_at: string;
}

export interface CardInput {
  title: string;
  description: string | null;
  assignee_ids: string[];
  due_date: string | null;
  priority: Priority | null;
  link: string | null;
}

export interface CurrentMember {
  id: string;
  name: string;
}

export const STATUSES: CardStatus[] = ["todo", "in_progress", "done"];

export const STATUS_LABEL: Record<CardStatus, string> = {
  todo: "할 일",
  in_progress: "진행 중",
  done: "완료",
};
