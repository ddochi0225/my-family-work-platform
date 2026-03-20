import { requireParent } from "@/lib/auth/requireParent";
import ParentTimetableClient from "./ParentTimetableClient";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ParentTimetablePage() {
  const profile = await requireParent();
  const supabase = await createServerSupabase();

  const { data: children, error: childrenError } = await supabase
    .from("children")
    .select("id, name, parent_id")
    .eq("parent_id", profile.id)
    .order("created_at", { ascending: true });

  if (childrenError) {
    console.error("자녀 목록 조회 오류:", childrenError);
  }

  return (
    <ParentTimetableClient
      parentId={profile.id}
      initialChildren={children ?? []}
    />
  );
}