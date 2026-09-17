import { useEffect, useState } from "react";
import type { CardInput, CardRecord, CardStatus, ChecklistItem, Member, Priority } from "../types";
import { toSafeHttpUrl } from "../lib/url";

interface CardModalProps {
  mode: "create" | "edit";
  status: CardStatus;
  card?: CardRecord;
  members: Member[];
  onClose: () => void;
  onSave: (input: CardInput) => Promise<void>;
  onDelete?: () => Promise<void>;
  onQuickAddMembers: (names: string[]) => Promise<Member[]>;
  onUpdateChecklist?: (checklist: ChecklistItem[]) => Promise<void>;
}

function splitNames(raw: string): string[] {
  return raw
    .split(/[,\n]/)
    .map((n) => n.trim())
    .filter(Boolean);
}

export function CardModal({ mode, card, members, onClose, onSave, onDelete, onQuickAddMembers, onUpdateChecklist }: CardModalProps) {
  // 지연 초기화로 첫 렌더부터 값을 채워, 이펙트가 도는 한 프레임 동안 빈 폼이 보이는 것을 막는다.
  const [title, setTitle] = useState(() => card?.title ?? "");
  const [description, setDescription] = useState(() => card?.description ?? "");
  const [assigneeIds, setAssigneeIds] = useState<Set<string>>(() => new Set(card?.assignee_ids ?? []));
  const [dueDate, setDueDate] = useState(() => card?.due_date ?? "");
  const [priority, setPriority] = useState<Priority | "">(() => card?.priority ?? "");
  const [link, setLink] = useState(() => card?.link ?? "");
  const [assigneeError, setAssigneeError] = useState(false);
  const [linkError, setLinkError] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddText, setQuickAddText] = useState("");
  const [saving, setSaving] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(() => card?.checklist ?? []);
  const [newChecklistText, setNewChecklistText] = useState("");
  const [justAutoCompleted, setJustAutoCompleted] = useState(false);

  useEffect(() => {
    setTitle(card?.title ?? "");
    setDescription(card?.description ?? "");
    setAssigneeIds(new Set(card?.assignee_ids ?? []));
    setDueDate(card?.due_date ?? "");
    setPriority(card?.priority ?? "");
    setLink(card?.link ?? "");
    setAssigneeError(false);
    setLinkError(false);
    setQuickAddOpen(false);
    setQuickAddText("");
    setChecklist(card?.checklist ?? []);
    setNewChecklistText("");
    setJustAutoCompleted(false);
    // card?.id로만 의존: 같은 카드가 실시간으로 갱신돼도(체크리스트 조작 등) 폼을 리셋하지 않고,
    // 다른 카드로 전환될 때만 초기화한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card?.id]);

  const showChecklist = mode === "edit" && card && card.status !== "todo" && onUpdateChecklist;

  async function persistChecklist(next: ChecklistItem[]) {
    setChecklist(next);
    if (!onUpdateChecklist) return;
    const wasComplete = checklist.length > 0 && checklist.every((i) => i.done);
    const nowComplete = next.length > 0 && next.every((i) => i.done);
    await onUpdateChecklist(next);
    if (nowComplete && !wasComplete && card?.status !== "done") {
      setJustAutoCompleted(true);
    }
  }

  function handleAddChecklistItem() {
    const text = newChecklistText.trim();
    if (!text) return;
    persistChecklist([...checklist, { id: crypto.randomUUID(), text, done: false }]);
    setNewChecklistText("");
  }

  function handleToggleChecklistItem(id: string) {
    persistChecklist(checklist.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
  }

  function handleRemoveChecklistItem(id: string) {
    persistChecklist(checklist.filter((item) => item.id !== id));
  }

  function toggleAssignee(id: string) {
    setAssigneeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setAssigneeError(false);
  }

  async function handleQuickAdd() {
    const names = splitNames(quickAddText);
    if (names.length === 0) return;
    const created = await onQuickAddMembers(names);
    if (created.length > 0) {
      setAssigneeIds((prev) => {
        const next = new Set(prev);
        created.forEach((m) => next.add(m.id));
        return next;
      });
    }
    setQuickAddText("");
    setQuickAddOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    if (assigneeIds.size === 0) {
      setAssigneeError(true);
      return;
    }
    let safeLink: string | null = null;
    if (link.trim()) {
      safeLink = toSafeHttpUrl(link);
      if (!safeLink) {
        setLinkError(true);
        return;
      }
    }

    setSaving(true);
    await onSave({
      title: title.trim(),
      description: description.trim() || null,
      assignee_ids: [...assigneeIds],
      due_date: dueDate || null,
      priority: priority || null,
      link: safeLink,
    });
    setSaving(false);
    onClose();
  }

  async function handleDelete() {
    if (!onDelete) return;
    if (!window.confirm("이 카드를 삭제할까요? 되돌릴 수 없습니다.")) return;
    setSaving(true);
    await onDelete();
    setSaving(false);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{mode === "create" ? "카드 추가" : "할 일 수정"}</h3>
          <button type="button" className="icon-btn" aria-label="닫기" onClick={onClose}>
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="cardTitle">할 일 제목 *</label>
            <input
              id="cardTitle"
              type="text"
              maxLength={100}
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <div className="label-row">
              <label>담당자 * (1명 이상 선택)</label>
              <button type="button" className="link-btn" onClick={() => setQuickAddOpen((v) => !v)}>
                + 새 팀원
              </button>
            </div>
            <div className="assignee-checklist">
              {members.length === 0 && <p className="hint">등록된 팀원이 없습니다. 새 팀원을 추가해주세요.</p>}
              {members.map((m) => (
                <label key={m.id} className={`assignee-chip ${assigneeIds.has(m.id) ? "is-checked" : ""}`}>
                  <input type="checkbox" checked={assigneeIds.has(m.id)} onChange={() => toggleAssignee(m.id)} />
                  {m.name}
                </label>
              ))}
            </div>
            {quickAddOpen && (
              <div className="quick-add-box">
                <input
                  type="text"
                  placeholder="이름 입력 후 추가 (쉼표로 여러 명)"
                  value={quickAddText}
                  onChange={(e) => setQuickAddText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleQuickAdd();
                    }
                  }}
                />
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleQuickAdd}>
                  추가
                </button>
              </div>
            )}
            {assigneeError && <p className="error-text">담당자를 1명 이상 선택해주세요.</p>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cardDueDate">마감일</label>
              <input id="cardDueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="cardPriority">우선순위</label>
              <select id="cardPriority" value={priority} onChange={(e) => setPriority(e.target.value as Priority | "")}>
                <option value="">없음</option>
                <option value="high">높음</option>
                <option value="medium">보통</option>
                <option value="low">낮음</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="cardDescription">설명</label>
            <textarea
              id="cardDescription"
              rows={3}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {showChecklist && (
            <div className="form-group">
              <div className="label-row">
                <label>체크리스트 (서브 할일)</label>
                {checklist.length > 0 && (
                  <span className="checklist-percent">
                    {checklist.filter((i) => i.done).length}/{checklist.length} (
                    {Math.round((checklist.filter((i) => i.done).length / checklist.length) * 100)}%)
                  </span>
                )}
              </div>
              <ul className="modal-checklist">
                {checklist.length === 0 && <p className="hint">아직 체크리스트 항목이 없습니다.</p>}
                {checklist.map((item) => (
                  <li key={item.id} className="modal-checklist-item">
                    <label>
                      <input type="checkbox" checked={item.done} onChange={() => handleToggleChecklistItem(item.id)} />
                      <span className={item.done ? "is-done" : ""}>{item.text}</span>
                    </label>
                    <button
                      type="button"
                      className="checklist-remove-btn"
                      aria-label="항목 삭제"
                      onClick={() => handleRemoveChecklistItem(item.id)}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
              <div className="quick-add-box">
                <input
                  type="text"
                  placeholder="새 항목 입력 후 추가"
                  value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddChecklistItem();
                    }
                  }}
                />
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddChecklistItem}>
                  추가
                </button>
              </div>
              {justAutoCompleted && (
                <p className="hint checklist-auto-hint">
                  🎉 모든 항목을 완료해 카드가 자동으로 '완료' 칼럼으로 이동했어요.
                </p>
              )}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="cardLink">참고 링크</label>
            <input
              id="cardLink"
              type="text"
              placeholder="https://"
              value={link}
              onChange={(e) => {
                setLink(e.target.value);
                setLinkError(false);
              }}
            />
            {linkError && <p className="error-text">올바른 링크 형식이 아닙니다 (http/https만 허용).</p>}
          </div>

          <div className="modal-actions">
            {mode === "edit" && (
              <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={saving}>
                삭제
              </button>
            )}
            <div className="spacer" />
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              취소
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
