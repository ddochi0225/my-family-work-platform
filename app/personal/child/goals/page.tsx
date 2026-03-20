import { createServerSupabase } from "@/lib/supabase/server";
import { requireChild } from "@/lib/auth/requireChild";
import ChildGoalClient from "./ChildGoalClient";

export const dynamic = "force-dynamic";

type ParentGoalRow = {
  id: string;
  child_id: string;
  title: string;
  target_points: number;
  reward: string | null;
  achieved: boolean;
  achieved_at: string | null;
  reward_given: boolean;
  reward_given_at: string | null;
  created_at: string;
};

type ChildGoalRow = {
  id: string;
  child_id: string;
  title: string;
  description: string | null;
  reason: string | null;
  reward_note: string | null;
  status: "active" | "completed" | "paused";
  is_shared: boolean;
  created_at: string;
  updated_at: string;
};

export default async function ChildGoalsPage() {
  const profile = await requireChild();
  const supabase = await createServerSupabase();

  // 현재 프로젝트에서 child 계정의 profile.id를 child_id로 사용하는 구조 기준
  const childId = profile.id;

  const [{ data: parentGoals }, { data: childGoals }, { data: pointRows }] = await Promise.all([
    supabase
      .from("point_goals")
      .select(
        "id, child_id, title, target_points, reward, achieved, achieved_at, reward_given, reward_given_at, created_at"
      )
      .eq("child_id", childId)
      .order("created_at", { ascending: false }),
    supabase
      .from("child_goals")
      .select(
        "id, child_id, title, description, reason, reward_note, status, is_shared, created_at, updated_at"
      )
      .eq("child_id", childId)
      .order("updated_at", { ascending: false }),
    supabase.from("point_histories").select("points").eq("child_id", childId),
  ]);

  const pointTotal = (pointRows ?? []).reduce((sum: number, row: any) => {
    return sum + Number(row.points ?? 0);
  }, 0);

  return (
    <ChildGoalClient
      childId={childId}
      pointTotal={pointTotal}
      parentGoals={(parentGoals as ParentGoalRow[]) ?? []}
      childGoals={(childGoals as ChildGoalRow[]) ?? []}
    />
  );
}
