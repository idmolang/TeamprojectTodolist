import { useState } from "react";
import { isSupabaseConfigured } from "./lib/supabase";
import { useTeamResolver } from "./hooks/useTeamResolver";
import { LandingScreen } from "./components/LandingScreen";
import { CreateTeamScreen } from "./components/CreateTeamScreen";
import { JoinTeamScreen } from "./components/JoinTeamScreen";
import { BoardScreen } from "./components/BoardScreen";
import "./App.css";

function App() {
  const { stage, createTeam, joinAsMember } = useTeamResolver();
  const [showLanding, setShowLanding] = useState(true);

  if (!isSupabaseConfigured) {
    return (
      <div className="landing-screen">
        <div className="landing-card">
          <h1>Supabase 설정이 필요합니다</h1>
          <p className="landing-desc">
            프로젝트 루트에 <code>.env.local</code> 파일을 만들고 <code>VITE_SUPABASE_URL</code>,{" "}
            <code>VITE_SUPABASE_ANON_KEY</code> 값을 채워주세요. 스키마는 <code>supabase/schema.sql</code>을
            Supabase SQL Editor에서 실행하면 됩니다. 자세한 절차는 README.md를 참고하세요.
          </p>
        </div>
      </div>
    );
  }

  if (stage.kind === "loading") {
    return (
      <div className="landing-screen">
        <p className="landing-desc">불러오는 중...</p>
      </div>
    );
  }

  if (stage.kind === "error") {
    return (
      <div className="landing-screen">
        <div className="landing-card">
          <h1>문제가 발생했어요</h1>
          <p className="landing-desc">{stage.message}</p>
        </div>
      </div>
    );
  }

  if (stage.kind === "create") {
    if (showLanding) {
      return <LandingScreen onStart={() => setShowLanding(false)} />;
    }
    return <CreateTeamScreen onCreate={createTeam} />;
  }

  if (stage.kind === "join") {
    return <JoinTeamScreen team={stage.team} onJoin={joinAsMember} />;
  }

  return <BoardScreen team={stage.team} member={stage.member} />;
}

export default App;
