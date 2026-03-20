import { requireChild } from "@/lib/auth/requireChild";
import { createServerSupabase } from "@/lib/supabase/server";
import ChildTodoClient from "./ChildTodoClient";

export const dynamic = "force-dynamic";

type TodoRow = {
  id: string;
  child_id: string;
  title: string;
  memo: string | null;
  due_date: string | null;
  reward_points: number;
  repeat_type: string;
  repeat_until: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
};

export default async function ChildTodoPage() {
  const profile = await requireChild();
  const supabase = await createServerSupabase();

  if (!profile.child_id) {
    return (
      <div className="space-y-4">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">내 할 일</h1>
          <p className="mt-2 text-sm text-slate-500">
            아직 연결된 자녀 프로필이 없어요.
          </p>
        </section>
      </div>
    );
  }

  const { data: todos } = await supabase
    .from("todos")
    .select(
      "id, child_id, title, memo, due_date, reward_points, repeat_type, repeat_until, completed, completed_at, created_at"
    )
    .eq("child_id", profile.child_id)
    .order("created_at", { ascending: false });

  return (
    <ChildTodoClient
      childId={profile.child_id}
      initialItems={(todos as TodoRow[]) ?? []}
    />
  );
}