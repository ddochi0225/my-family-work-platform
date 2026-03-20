import { requireChild } from "@/lib/auth/requireChild";
import { createServerSupabase } from "@/lib/supabase/server";
import ChildTimetableClient from "./ChildTimetableClient";

export const dynamic = "force-dynamic";

type TimetableRow = {
  id: string;
  child_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  subject: string;
  location: string | null;
  color: string | null;
  repeat_type: string | null;
};

export default async function ChildTimetablePage() {
  const profile = await requireChild();
  const supabase = await createServerSupabase();

  if (!profile.child_id) {
    return (
      <div className="space-y-4">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">내 시간표</h1>
          <p className="mt-2 text-sm text-slate-500">
            아직 연결된 자녀 프로필이 없어요.
          </p>
        </section>
      </div>
    );
  }

  const { data, error } = await supabase
    .from("timetables")
    .select(
      "id, child_id, day_of_week, start_time, end_time, subject, location, color, repeat_type"
    )
    .eq("child_id", profile.child_id)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  return (
    <ChildTimetableClient
      initialItems={(data as TimetableRow[]) ?? []}
      pageMessage={error ? `시간표 조회 오류: ${error.message ?? "알 수 없는 오류"}` : ""}
    />
  );
}