import "./LandingScreen.css";
import { useScrollReveal } from "../hooks/useScrollReveal";

export function LandingScreen({ onStart }: { onStart: () => void }) {
  useScrollReveal();

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="al">
      <nav className="al-nav">
        <button className="al-nav-brand" onClick={() => scrollTo("al-top")}>
          TeamBoard
        </button>
        <ul className="al-nav-links">
          <li className="al-nav-only-desktop">
            <button className="al-nav-link" onClick={() => scrollTo("al-features")}>
              기능
            </button>
          </li>
          <li className="al-nav-only-desktop">
            <button className="al-nav-link" onClick={() => scrollTo("al-steps")}>
              시작 방법
            </button>
          </li>
          <li>
            <button className="al-btn al-btn-dark-utility" onClick={onStart}>
              시작하기
            </button>
          </li>
        </ul>
      </nav>

      {/* Hero */}
      <section id="al-top" className="al-tile al-tile-light al-reveal">
        <div className="al-tile-stack" style={{ maxWidth: 720 }}>
          <p className="al-tile-eyebrow al-caption-strong">조별과제 협업 보드</p>
          <h1 className="al-hero-display">단톡방 대화 대신,
            <br />
            보드 하나로 끝내는 팀 프로젝트</h1>
          <p className="al-lead">회원가입 없이, 링크 하나로 팀원과 할 일을 한눈에.</p>
          <div className="al-cta-row">
            <button className="al-btn al-btn-primary" onClick={onStart}>
              무료로 시작하기
            </button>
            <button className="al-btn al-btn-secondary" onClick={() => scrollTo("al-features")}>
              기능 살펴보기
            </button>
          </div>
        </div>

        <div className="al-tile-visual" style={{ display: "flex", justifyContent: "center" }}>
          <div className="al-board-mock">
            <div className="al-board-col">
              <span className="al-board-col-title">할 일</span>
              <div className="al-mini-card">
                <div className="al-mini-card-title">발표 자료 초안</div>
                <span className="al-mini-badge al-mini-badge-normal">D-5</span>
                <div className="al-mini-avatars">
                  <span>재형</span>
                  <span>도현</span>
                </div>
              </div>
              <div className="al-mini-card">
                <div className="al-mini-card-title">참고 문헌 정리</div>
                <span className="al-mini-badge al-mini-badge-warning">D-1</span>
                <div className="al-mini-avatars">
                  <span>준혁</span>
                </div>
              </div>
            </div>
            <div className="al-board-col">
              <span className="al-board-col-title">진행 중</span>
              <div className="al-mini-card">
                <div className="al-mini-card-title">설문 데이터 분석</div>
                <span className="al-mini-badge al-mini-badge-overdue">지연</span>
                <div className="al-mini-avatars">
                  <span>지훈</span>
                </div>
              </div>
            </div>
            <div className="al-board-col">
              <span className="al-board-col-title">완료</span>
              <div className="al-mini-card">
                <div className="al-mini-card-title">주제 선정</div>
                <span className="al-mini-badge al-mini-badge-done">완료</span>
                <div className="al-mini-avatars">
                  <span>재형</span>
                  <span>도현</span>
                  <span>준혁</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 1 — realtime sync */}
      <section id="al-features" className="al-tile al-tile-dark al-reveal">
        <div className="al-split">
          <div className="al-split-copy">
            <p className="al-tile-eyebrow al-caption-strong">실시간 동기화</p>
            <h2 className="al-display-lg">누가 뭘 하는지, 실시간으로 보여요</h2>
            <p className="al-lead-airy">
              카드를 옮기면 팀원 화면에도 2초 안에 그대로 반영돼요. <br /> 지난 대화를 일일이 찾아보지 않아도
              지금 누가 무엇을 하고 있는지 바로 알 수 있어요.
            </p>
            <button className="al-text-link al-text-link-on-dark" onClick={onStart}>
              지금 시작하기 →
            </button>
          </div>
          <div className="al-split-visual" style={{ display: "flex", justifyContent: "center" }}>
            <div
              className="al-board-mock"
              style={{ background: "var(--al-tile-2)", boxShadow: "3px 5px 30px rgba(0,0,0,0.4)" }}
            >
              <div className="al-board-col">
                <span className="al-board-col-title">진행 중</span>
                <div className="al-mini-card">
                  <div className="al-mini-card-title">역할 배정 확정</div>
                  <span className="al-mini-badge al-mini-badge-normal">D-3</span>
                  <div className="al-mini-avatars">
                    <span>지훈</span>
                  </div>
                </div>
              </div>
              <div className="al-board-col">
                <span className="al-board-col-title">완료</span>
                <div className="al-mini-card">
                  <div className="al-mini-card-title">자료 조사</div>
                  <span className="al-mini-badge al-mini-badge-done">완료</span>
                  <div className="al-mini-avatars">
                    <span>지훈</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 2 — deadline highlight */}
      <section className="al-tile al-tile-parchment al-reveal">
        <div className="al-split al-split-reverse">
          <div className="al-split-visual" style={{ display: "flex", justifyContent: "center" }}>
            <div className="al-chip-row">
              <div className="al-deadline-chip al-deadline-chip-overdue">
                <span className="al-body-strong">발표 자료 작성</span>
                <span className="al-mini-badge al-mini-badge-overdue">지연</span>
              </div>
              <div className="al-deadline-chip al-deadline-chip-warning">
                <span className="al-body-strong">설문지 배포</span>
                <span className="al-mini-badge al-mini-badge-warning">D-1</span>
              </div>
              <div className="al-deadline-chip al-deadline-chip-ok">
                <span className="al-body-strong">주제 선정</span>
                <span className="al-mini-badge al-mini-badge-done">완료</span>
              </div>
            </div>
          </div>
          <div className="al-split-copy">
            <p className="al-tile-eyebrow al-caption-strong">마감일 자동 강조</p>
            <h2 className="al-display-lg">마감을 놓치기 전에, 색으로 미리 보여줘요</h2>
            <p className="al-lead-airy">
              마감이 지난 카드는 빨간색, 하루 남은 카드는 노란색으로 표시돼요. 완료한 카드는 마감이
              지났어도 강조가 사라져요.
            </p>
          </div>
        </div>
      </section>

      {/* Feature 3 — no signup */}
      <section className="al-tile al-tile-dark-2 al-reveal">
        <div className="al-tile-stack">
          <p className="al-tile-eyebrow al-caption-strong">회원가입 없이 시작</p>
          <h2 className="al-display-lg">팀 이름과 팀원만 입력하면 끝</h2>
          <p className="al-lead-airy">
            보드를 만들면 초대 링크가 바로 생겨요. <br/>팀원에게 링크만 공유하면, 이름만 입력하고 바로 참여할 수
            있어요.
          </p>
          <div className="al-cta-row">
            <button className="al-btn al-btn-primary" onClick={onStart}>
              무료로 시작하기
            </button>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section id="al-steps" className="al-tile al-tile-light al-reveal">
        <p className="al-tile-eyebrow al-caption-strong">시작 방법</p>
        <h2 className="al-display-lg">3단계로 시작하기</h2>
        <div className="al-steps-grid">
          <div className="al-step-card">
            <span className="al-step-num">1</span>
            <h3 className="al-body-strong">보드 만들기</h3>
            <p className="al-body">팀(프로젝트) 이름을 입력하고 보드를 생성해요.</p>
          </div>
          <div className="al-step-card">
            <span className="al-step-num">2</span>
            <h3 className="al-body-strong">팀원 초대하기</h3>
            <p className="al-body">생성된 초대 링크를 팀원에게 공유해요. <br/> 이름만 입력하면 바로 참여돼요.</p>
          </div>
          <div className="al-step-card">
            <span className="al-step-num">3</span>
            <h3 className="al-body-strong">카드로 역할 분담</h3>
            <p className="al-body">할 일 카드를 만들어 담당자와 마감일을 정하고 보드에서 진행 상태를 옮겨요.</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="al-tile al-tile-parchment al-reveal">
        <div className="al-tile-stack">
          <h2 className="al-display-lg">지금 바로 시작해보세요</h2>
          <p className="al-lead">가입도, 설치도 필요 없어요. 1분이면 충분해요.</p>
          <button className="al-btn al-btn-store-hero" onClick={onStart}>
            무료로 보드 만들기
          </button>
        </div>
      </section>

      <footer className="al-footer">
        <div className="al-footer-inner">
          <div className="al-footer-links">
            <button className="al-caption" onClick={() => scrollTo("al-top")}>
              홈
            </button>
            <button className="al-caption" onClick={() => scrollTo("al-features")}>
              기능
            </button>
            <button className="al-caption" onClick={() => scrollTo("al-steps")}>
              시작 방법
            </button>
            <button className="al-caption" onClick={onStart}>
              보드 만들기
            </button>
          </div>
          <p className="al-fine-print al-footer-legal">
            TeamBoard는 이름 외의 개인정보를 수집하지 않으며, 별도 회원가입 없이 초대 링크와 이름만으로
            참여할 수 있습니다.
          </p>
        </div>
      </footer>
    </div>
  );
}
