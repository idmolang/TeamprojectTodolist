import { useState } from "react";
import type { Member, Team } from "../types";

function splitNames(raw: string): string[] {
  return raw
    .split(/[,\n]/)
    .map((n) => n.trim())
    .filter(Boolean);
}

export function MemberModal({
  team,
  members,
  onClose,
  onAddMembers,
  onRemoveMember,
}: {
  team: Team;
  members: Member[];
  onClose: () => void;
  onAddMembers: (names: string[]) => Promise<Member[]>;
  onRemoveMember: (id: string) => Promise<void>;
}) {
  const [newNames, setNewNames] = useState("");
  const [copied, setCopied] = useState(false);

  const inviteUrl = (() => {
    const url = new URL(window.location.href);
    url.searchParams.set("team", team.invite_code);
    return url.toString();
  })();

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const names = splitNames(newNames);
    if (names.length === 0) return;
    await onAddMembers(names);
    setNewNames("");
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("아래 링크를 복사하세요", inviteUrl);
    }
  }

  async function handleRemove(id: string, name: string) {
    if (!window.confirm(`'${name}' 팀원을 삭제할까요?`)) return;
    await onRemoveMember(id);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>팀원 관리</h3>
          <button type="button" className="icon-btn" aria-label="닫기" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="member-modal-body">
          <ul className="member-list">
            {members.length === 0 && <p className="hint">등록된 팀원이 없습니다.</p>}
            {members.map((m) => (
              <li key={m.id} className="member-row">
                <span className="member-name">{m.name}</span>
                <button
                  type="button"
                  className="member-remove-btn"
                  aria-label={`${m.name} 삭제`}
                  onClick={() => handleRemove(m.id, m.name)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <form className="add-member-form" onSubmit={handleAdd}>
            <input
              type="text"
              placeholder="팀원 이름 (쉼표 또는 줄바꿈으로 여러 명 입력)"
              value={newNames}
              onChange={(e) => setNewNames(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">
              추가
            </button>
          </form>
          <div className="invite-section">
            <label htmlFor="inviteLinkInput">초대 링크</label>
            <div className="invite-row">
              <input id="inviteLinkInput" type="text" readOnly value={inviteUrl} />
              <button type="button" className="btn btn-secondary" onClick={handleCopy}>
                {copied ? "복사됨" : "복사"}
              </button>
            </div>
            <p className="hint">이 링크를 팀원에게 공유하면 로그인 없이 이름만으로 참여할 수 있습니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
