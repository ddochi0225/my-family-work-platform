import { requireParent } from "@/lib/auth/requireParent";
import { createServerSupabase } from "@/lib/supabase/server";
import ParentGoalClient from "./ParentGoalClient";

export const dynamic = "force-dynamic";

type ChildRow = {
  id: string;
  name: string;
};

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

export default async function ParentGoalsPage() {
  const profile = await requireParent();
  const supabase = await createServerSupabase();

  const { data: children } = await supabase
    .from("children")
    .select("id, name")
    .eq("parent_id", profile.id)
    .order("created_at", { ascending: true });

  const childItems = (children as ChildRow[]) ?? [];
  const childIds = childItems.map((child) => child.id);

  let goals: ParentGoalRow[] = [];
  let childGoals: ChildGoalRow[] = [];
  let pointTotals: Record<string, number> = {};

  if (childIds.length > 0) {
    const [{ data: goalRows }, { data: pointRows }, { data: childGoalRows }] = await Promise.all([
      supabase
        .from("point_goals")
        .select(
          "id, child_id, title, target_points, reward, achieved, achieved_at, reward_given, reward_given_at, created_at"
        )
        .in("child_id", childIds)
        .order("created_at", { ascending: false }),
      supabase.from("point_histories").select("child_id, points").in("child_id", childIds),
      supabase
        .from("child_goals")
        .select(
          "id, child_id, title, description, reason, reward_note, status, is_shared, created_at, updated_at"
        )
        .in("child_id", childIds)
        .eq("is_shared", true)
        .order("updated_at", { ascending: false }),
    ]);

    goals = (goalRows as ParentGoalRow[]) ?? [];
    childGoals = (childGoalRows as ChildGoalRow[]) ?? [];

    pointTotals = childIds.reduce<Record<string, number>>((acc, id) => {
      acc[id] = 0;
      return acc;
    }, {});

    (pointRows ?? []).forEach((row: any) => {
      pointTotals[row.child_id] = (pointTotals[row.child_id] ?? 0) + Number(row.points ?? 0);
    });
  }

  return (
    <ParentGoalClient
      children={childItems}
      goals={goals}
      childGoals={childGoals}
      pointTotals={pointTotals}
    />
  );
}
