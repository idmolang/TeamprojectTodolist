import { useState } from "react";
import type { Member, Team } from "../types";
import { AvatarStack } from "./Avatar";

// 레이스 컨디션 등으로 같은 이름이 중복 등록되어도 프로필 아바타는 한 명당 하나만 보여준다.
function uniqueMemberNames(members: Member[]): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const m of members) {
    const key = m.name.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(m.name);
  }
  return names;
}

export function Header({
  team,
  members,
  onRenameTeam,
  onOpenMembers,
}: {
  team: Team;
  members: Member[];
  onRenameTeam: (name: string) => Promise<void>;
  onOpenMembers: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(team.name);

  async function commit() {
    setEditing(false);
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== team.name) {
      await onRenameTeam(trimmed);
    } else {
      setDraftName(team.name);
    }
  }

  return (
    <header className="app-header">
      <div className="header-left">
        {editing ? (
          <input
            className="team-name-input"
            value={draftName}
            maxLength={30}
            autoFocus
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") {
                setDraftName(team.name);
                setEditing(false);
              }
            }}
          />
        ) : (
          <h1 className="team-name">{team.name}</h1>
        )}
        <button type="button" className="icon-btn" aria-label="팀 이름 수정" onClick={() => setEditing(true)}>
          ✏️
        </button>
      </div>
      <div className="header-right">
        <AvatarStack names={uniqueMemberNames(members)} max={6} size={30} />
        <button type="button" className="btn btn-secondary" onClick={onOpenMembers}>
          팀원 관리
        </button>
      </div>
    </header>
  );
}
