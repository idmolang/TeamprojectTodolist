import type { CardRecord, Member } from "../types";
import { getUrgency } from "../lib/urgency";
import { toSafeHttpUrl } from "../lib/url";
import { AvatarStack } from "./Avatar";

const PRIORITY_LABEL: Record<string, string> = { high: "높음", medium: "보통", low: "낮음" };

export function CardView({
  card,
  members,
  onClick,
  onStart,
  onComplete,
}: {
  card: CardRecord;
  members: Member[];
  onClick?: () => void;
  onStart?: (cardId: string) => void;
  onComplete?: (cardId: string) => void;
}) {
  const urgency = getUrgency(card);
  const checklist = card.checklist ?? [];
  const doneCount = checklist.filter((item) => item.done).length;
  const progressPercent = checklist.length > 0 ? Math.round((doneCount / checklist.length) * 100) : null;
  const assigneeNames = card.assignee_ids
    .map((id) => members.find((m) => m.id === id)?.name)
    .filter((n): n is string => Boolean(n));

  const badgeClass =
    urgency.level === "overdue"
      ? "badge-overdue"
      : urgency.level === "warning"
        ? "badge-warning"
        : urgency.level === "done"
          ? "badge-done"
          : urgency.level === "no-date"
            ? "badge-nodate"
            : "badge-normal";

  const cardUrgencyClass =
    urgency.level === "overdue" ? "urgency-overdue" : urgency.level === "warning" ? "urgency-warning" : urgency.level === "done" ? "urgency-done" : "";

  return (
    <div className={`card ${cardUrgencyClass}`} onClick={onClick} role="button" tabIndex={0}>
      <div className="card-top">
        <p className="card-title">{card.title}</p>
      </div>
      {card.priority && (
        <span className={`priority-badge priority-badge-${card.priority}`}>
          {PRIORITY_LABEL[card.priority]}
        </span>
      )}
      {card.description && <p className="card-desc">{card.description}</p>}
      {progressPercent !== null && (
        <div className="checklist-progress">
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <span className="progress-text">
            {doneCount}/{checklist.length} ({progressPercent}%)
          </span>
        </div>
      )}
      <div className="card-bottom">
        <AvatarStack names={assigneeNames} />
        <span className={`badge ${badgeClass}`}>{urgency.badgeText}</span>
      </div>
      {card.status === "todo" && onStart && (
        <button
          type="button"
          className="start-card-btn"
          onClick={(e) => {
            e.stopPropagation();
            onStart(card.id);
          }}
        >
          ▶ 시작하기
        </button>
      )}
      {card.status === "in_progress" && onComplete && (
        <button
          type="button"
          className="complete-card-btn"
          onClick={(e) => {
            e.stopPropagation();
            onComplete(card.id);
          }}
        >
          ✓ 완료
        </button>
      )}
      {card.link &&
        (() => {
          const safeUrl = toSafeHttpUrl(card.link);
          return safeUrl ? (
            <a
              className="card-link"
              href={safeUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              🔗 참고 링크
            </a>
          ) : null;
        })()}
    </div>
  );
}
