import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Member, Team } from "../types";

export function JoinTeamScreen({
  team,
  onJoin,
}: {
  team: Team;
  onJoin: (team: Team, name: string, options?: { asNewMember?: boolean }) => Promise<void>;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [name, setName] = useState("");
  const [confirmNew, setConfirmNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("members")
      .select("*")
      .eq("team_id", team.id)
      .order("created_at")
      .then(({ data }) => {
        if (!cancelled) setMembers(data ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [team.id]);

  const trimmed = name.trim();
  const matchesExisting = members.some((m) => m.name.toLowerCase() === trimmed.toLowerCase());

  async function submit(nameToUse: string, asNewMember?: boolean) {
    if (!nameToUse.trim()) return;
    setSubmitting(true);
    await onJoin(team, nameToUse, { asNewMember });
    setSubmitting(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!trimmed) return;
    if (!matchesExisting && members.length > 0 && !confirmNew) {
      // 팀원 목록에 없는 이름 → 신규 등록 여부 확인 (PRD 엣지 케이스)
      setConfirmNew(true);
      return;
    }
    submit(trimmed);
  }

  return (
    <div className="landing-screen">
      <div className="landing-card">
        <h1>{team.name}</h1>
        <p className="landing-desc">보드에 참여하려면 이름을 입력하세요.</p>

        {members.length > 0 && (
          <div className="member-quickpick">
            {members.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`chip-btn ${name === m.name ? "is-active" : ""}`}
                onClick={() => {
                  setName(m.name);
                  setConfirmNew(false);
                }}
              >
                {m.name}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="joinName">내 이름</label>
            <input
              id="joinName"
              type="text"
              required
              maxLength={20}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setConfirmNew(false);
              }}
              autoFocus
            />
          </div>

          {confirmNew && (
            <div className="confirm-box">
              <p>
                '<strong>{trimmed}</strong>'는 팀원 목록에 없는 이름이에요. 새 팀원으로 등록할까요?
              </p>
              <div className="confirm-actions">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setConfirmNew(false)}>
                  취소
                </button>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => submit(trimmed, true)}>
                  새 팀원으로 등록
                </button>
              </div>
            </div>
          )}

          {!confirmNew && (
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting || !trimmed}>
              {submitting ? "입장 중..." : "보드 입장하기"}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
