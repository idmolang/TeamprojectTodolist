import type { CurrentMember } from "../types";

const keyFor = (inviteCode: string) => `team-board:session:${inviteCode}`;

export function loadSession(inviteCode: string): CurrentMember | null {
  try {
    const raw = localStorage.getItem(keyFor(inviteCode));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.id === "string" && typeof parsed.name === "string") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveSession(inviteCode: string, member: CurrentMember) {
  try {
    localStorage.setItem(keyFor(inviteCode), JSON.stringify(member));
  } catch {
    // localStorage를 쓸 수 없는 환경(프라이빗 모드 등)에서는 세션 기억을 건너뛴다.
  }
}

export function clearSession(inviteCode: string) {
  try {
    localStorage.removeItem(keyFor(inviteCode));
  } catch {
    // ignore
  }
}
