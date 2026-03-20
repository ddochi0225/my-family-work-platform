import { requireParent } from "@/lib/auth/requireParent";
import { createServerSupabase } from "@/lib/supabase/server";
import ParentChildrenClient from "./ParentChildrenClient";

export const dynamic = "force-dynamic";

type ChildRow = {
  id: string;
  name: string;
  parent_id: string;
  created_at?: string | null;
};

export default async function ParentChildrenPage() {
  const profile = await requireParent();
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("children")
    .select("id, name, parent_id, created_at")
    .eq("parent_id", profile.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("자녀 목록 조회 오류:", error);
  }

  return (
    <ParentChildrenClient
      parentId={profile.id}
      initialChildren={(data as ChildRow[]) ?? []}
    />
  );
}