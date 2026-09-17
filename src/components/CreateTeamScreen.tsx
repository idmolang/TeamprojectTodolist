import { useState } from "react";

export function CreateTeamScreen({
  onCreate,
}: {
  onCreate: (teamName: string, memberNames: string[]) => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [memberNamesRaw, setMemberNamesRaw] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!teamName.trim()) return;
    setSubmitting(true);
    const names = memberNamesRaw
      .split(/[,\n]/)
      .map((n) => n.trim())
      .filter(Boolean);
    await onCreate(teamName.trim(), names);
    setSubmitting(false);
  }

  if (!showForm) {
    return (
      <div className="landing-screen">
        <div className="landing-card">
          <h1>팀 프로젝트 역할 분담 보드</h1>
          <p className="landing-desc">
            카카오톡 대화에 묻히던 담당자와 마감일을 한 곳에 모아 칸반 보드로 관리하세요. 회원가입 없이 링크 하나로
            팀원과 공유할 수 있어요.
          </p>
          <div className="onboarding-flow">
            <span className="flow-step">할 일</span>
            <span className="flow-arrow">→</span>
            <span className="flow-step">진행 중</span>
            <span className="flow-arrow">→</span>
            <span className="flow-step">완료</span>
          </div>
          <p className="landing-desc">세 칼럼으로 팀의 진행 상황을 한눈에 확인하고, 마감이 지난 카드는 자동으로 강조돼요.</p>
          <button type="button" className="btn btn-primary btn-block" onClick={() => setShowForm(true)}>
            새 팀 만들기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-screen">
      <div className="landing-card">
        <button type="button" className="link-btn back-link" onClick={() => setShowForm(false)}>
          ← 이전
        </button>
        <h1>팀 프로젝트 보드 만들기</h1>
        <p className="landing-desc">
          회원가입 없이 팀 이름과 팀원만 등록하면 바로 시작할 수 있어요. 생성 후 받는 초대 링크를 팀원에게 공유하세요.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="teamName">팀(프로젝트) 이름 *</label>
            <input
              id="teamName"
              type="text"
              required
              maxLength={30}
              placeholder="예: 캡스톤 3조"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="memberNames">팀원 이름 (선택, 쉼표 또는 줄바꿈 구분)</label>
            <textarea
              id="memberNames"
              rows={4}
              placeholder={"지민, 하윤, 준호, 서연"}
              value={memberNamesRaw}
              onChange={(e) => setMemberNamesRaw(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? "생성 중..." : "보드 만들기"}
          </button>
        </form>
      </div>
    </div>
  );
}
