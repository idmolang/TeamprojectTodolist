import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { generateInviteCode } from "../lib/inviteCode";
import { loadSession, saveSession } from "../lib/session";
import type { CurrentMember, Team } from "../types";

export type Stage =
  | { kind: "loading" }
  | { kind: "create" }
  | { kind: "join"; team: Team }
  | { kind: "board"; team: Team; member: CurrentMember }
  | { kind: "error"; message: string };

function getInviteCodeFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get("team");
}

function setInviteCodeInUrl(code: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("team", code);
  window.history.replaceState(null, "", url.toString());
}

export function useTeamResolver() {
  const [stage, setStage] = useState<Stage>({ kind: "loading" });

  const resolve = useCallback(async () => {
    const code = getInviteCodeFromUrl();
    if (!code) {
      setStage({ kind: "create" });
      return;
    }

    const { data, error } = await supabase.rpc("get_team_by_invite_code", { p_invite_code: code });
    if (error) {
      setStage({ kind: "error", message: "팀 정보를 불러오는 중 오류가 발생했습니다: " + error.message });
      return;
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      setStage({ kind: "error", message: "유효하지 않은 초대 링크입니다. 링크를 다시 확인해주세요." });
      return;
    }
    const team: Team = { id: row.id, name: row.name, invite_code: code, created_at: "" };

    const session = loadSession(code);
    if (session) {
      setStage({ kind: "board", team, member: session });
    } else {
      setStage({ kind: "join", team });
    }
  }, []);

  useEffect(() => {
    resolve();
  }, [resolve]);

  const createTeam = useCallback(async (teamName: string, memberNames: string[]) => {
    // teams 테이블은 초대 코드 전체 스캔을 막기 위해 SELECT 정책을 두지 않았으므로,
    // INSERT 후 .select()로 되읽지 않도록 id를 클라이언트에서 미리 생성해 사용한다.
    const teamId = crypto.randomUUID();
    const inviteCode = generateInviteCode();
    const { error: teamError } = await supabase
      .from("teams")
      .insert({ id: teamId, name: teamName, invite_code: inviteCode });
    if (teamError) {
      setStage({ kind: "error", message: "팀 생성에 실패했습니다: " + teamError.message });
      return;
    }

    const uniqueNames = [...new Set(memberNames.map((n) => n.trim()).filter(Boolean))];
    if (uniqueNames.length > 0) {
      const { error: memberError } = await supabase
        .from("members")
        .insert(uniqueNames.map((name) => ({ team_id: teamId, name })));
      if (memberError) {
        setStage({ kind: "error", message: "팀원 등록에 실패했습니다: " + memberError.message });
        return;
      }
    }

    setInviteCodeInUrl(inviteCode);
    const team: Team = { id: teamId, name: teamName, invite_code: inviteCode, created_at: new Date().toISOString() };
    setStage({ kind: "join", team });
  }, []);

  const joinAsMember = useCallback(async (team: Team, name: string, options?: { asNewMember?: boolean }) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const { data: existing } = await supabase
      .from("members")
      .select("*")
      .eq("team_id", team.id)
      .ilike("name", trimmed);

    let memberId: string;
    if (existing && existing.length > 0 && !options?.asNewMember) {
      memberId = existing[0].id;
    } else {
      const { data: created, error: createError } = await supabase
        .from("members")
        .insert({ team_id: team.id, name: trimmed })
        .select()
        .single();
      if (createError?.code === "23505") {
        // 그 사이 다른 사람(또는 다른 탭)이 같은 이름으로 먼저 등록한 경우: 새로 만들지 않고 기존 행을 사용한다.
        const { data: raceWinner } = await supabase
          .from("members")
          .select("*")
          .eq("team_id", team.id)
          .ilike("name", trimmed);
        if (!raceWinner || raceWinner.length === 0) {
          setStage({ kind: "error", message: "팀원 등록에 실패했습니다." });
          return;
        }
        memberId = raceWinner[0].id;
      } else if (createError || !created) {
        setStage({ kind: "error", message: "팀원 등록에 실패했습니다: " + (createError?.message ?? "") });
        return;
      } else {
        memberId = created.id;
      }
    }

    const member: CurrentMember = { id: memberId, name: trimmed };
    saveSession(team.invite_code, member);
    setStage({ kind: "board", team, member });
  }, []);

  return { stage, setStage, createTeam, joinAsMember };
}
