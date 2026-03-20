import { requireParent } from "@/lib/auth/requireParent";
import { createServerSupabase } from "@/lib/supabase/server";
import ParentTodoClient from "./ParentTodoClient";

export const dynamic = "force-dynamic";

type ChildRow = {
  id: string;
  name: string;
};

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

export default async function ParentTodoPage() {
  const profile = await requireParent();
  const supabase = await createServerSupabase();

  const { data: children } = await supabase
    .from("children")
    .select("id, name")
    .eq("parent_id", profile.id)
    .order("created_at", { ascending: true });

  const childItems = (children as ChildRow[]) ?? [];
  const childIds = childItems.map((child) => child.id);

  let todoItems: TodoRow[] = [];

  if (childIds.length > 0) {
    const { data: todos } = await supabase
      .from("todos")
      .select(
        "id, child_id, title, memo, due_date, reward_points, repeat_type, repeat_until, completed, completed_at, created_at"
      )
      .in("child_id", childIds)
      .order("created_at", { ascending: false });

    todoItems = (todos as TodoRow[]) ?? [];
  }

  return <ParentTodoClient children={childItems} todoItems={todoItems} />;
}