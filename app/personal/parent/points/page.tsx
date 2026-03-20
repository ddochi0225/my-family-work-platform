import { requireParent } from "@/lib/auth/requireParent";
import { createServerSupabase } from "@/lib/supabase/server";
import ParentPointsClient from "./ParentPointsClient";

export const dynamic = "force-dynamic";

type ChildRow = {
  id: string;
  name: string;
};

type PointHistoryRow = {
  id: string;
  child_id: string;
  type: string;
  points: number;
  description: string | null;
  created_at: string;
};

type AllowanceRequestRow = {
  id: string;
  child_id: string;
  points: number;
  amount: number | null;
  status: string;
  created_at: string;
  processed_at: string | null;
};

export default async function ParentPointsPage() {
  const profile = await requireParent();
  const supabase = await createServerSupabase();

  const { data: children } = await supabase
    .from("children")
    .select("id, name")
    .eq("parent_id", profile.id)
    .order("created_at", { ascending: true });

  const childItems = (children as ChildRow[]) ?? [];
  const childIds = childItems.map((child) => child.id);

  let pointItems: PointHistoryRow[] = [];
  let requestItems: AllowanceRequestRow[] = [];

  if (childIds.length > 0) {
    const [{ data: pointHistories }, { data: requests }] = await Promise.all([
      supabase
        .from("point_histories")
        .select("id, child_id, type, points, description, created_at")
        .in("child_id", childIds)
        .order("created_at", { ascending: false }),
      supabase
        .from("allowance_requests")
        .select("id, child_id, points, amount, status, created_at, processed_at")
        .in("child_id", childIds)
        .order("created_at", { ascending: false }),
    ]);

    pointItems = (pointHistories as PointHistoryRow[]) ?? [];
    requestItems = (requests as AllowanceRequestRow[]) ?? [];
  }

  return (
    <ParentPointsClient
      children={childItems}
      pointItems={pointItems}
      requestItems={requestItems}
    />
  );
}