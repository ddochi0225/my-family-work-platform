"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type ScheduleRow = {
  id: string;
  child_id: string;
  title: string;
  is_recurring: boolean;
  day_of_week: string | null;
  start_time: string | null;
  end_time: string | null;
  schedule_date: string | null;
  location: string | null;
  memo: string | null;
  color: string | null;
};

type TodoRow = {
  id: string;
  child_id: string;
  title: string;
  due_date: string | null;
  reward_points: number;
  completed: boolean;
};

type ChildRow = {
  id: string;
  name: string;
};

type AllowanceRequestRow = {
  allowance_amount: number;
};

type AllowanceExpenseRow = {
  amount: number;
};

type TodayDashboardProps = {
  childId: string;
  role?: "parent" | "child";
};

const dayMap = ["일", "월", "화", "수", "목", "금", "토"];

function formatTime(time: string | null) {
  if (!time) return "";
  const parts = time.split(":");
  if (parts.length < 2) return time;
  return `${parts[0]}:${parts[1]}`;
}

function timeToMinutes(time: string | null) {
  if (!time) return 0;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function getColorClass(color: string | null) {
  switch (color) {
    case "pink":
      return "bg-pink-100 text-pink-700 border-pink-200";
    case "yellow":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "blue":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "green":
      return "bg-green-100 text-green-700 border-green-200";
    case "purple":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "gray":
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

export default function TodayDashboard({
  childId,
  role = "parent",
}: TodayDashboardProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [child, setChild] = useState<ChildRow | null>(null);
  const [todaySchedules, setTodaySchedules] = useState<ScheduleRow[]>([]);
  const [todayTodos, setTodayTodos] = useState<TodoRow[]>([]);
  const [balance, setBalance] = useState(0);

  const today = useMemo(() => new Date(), []);
  const todayString = useMemo(() => {
    const year = today.getFullYear();
    const month = `${today.getMonth() + 1}`.padStart(2, "0");
    const day = `${today.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, [today]);

  const todayDay = useMemo(() => dayMap[today.getDay()], [today]);
  const todayLabel = useMemo(
    () => `${todayString} (${todayDay})`,
    [todayString, todayDay]
  );

  useEffect(() => {
    if (!childId) {
      setChild(null);
      setTodaySchedules([]);
      setTodayTodos([]);
      setBalance(0);
      setMessage("");
      return;
    }

    fetchDashboard();
  }, [childId]);

  async function fetchDashboard() {
    setLoading(true);
    setMessage("");

    try {
      const [
        { data: childData, error: childError },
        { data: scheduleData, error: scheduleError },
        { data: todoData, error: todoError },
        { data: requestData, error: requestError },
        { data: expenseData, error: expenseError },
      ] = await Promise.all([
        supabase
          .from("children")
          .select("id, name")
          .eq("id", childId)
          .maybeSingle(),

        supabase.from("schedules").select("*").eq("child_id", childId),

        supabase
          .from("todos")
          .select("id, child_id, title, due_date, reward_points, completed")
          .eq("child_id", childId)
          .eq("completed", false),

        supabase
          .from("allowance_requests")
          .select("allowance_amount")
          .eq("child_id", childId)
          .eq("status", "approved"),

        supabase
          .from("allowance_items")
          .select("amount")
          .eq("child_id", childId),
      ]);

      if (childError) throw childError;
      if (scheduleError) throw scheduleError;
      if (todoError) throw todoError;
      if (requestError) throw requestError;
      if (expenseError) throw expenseError;

      setChild((childData as ChildRow | null) ?? null);

      const allSchedules = (scheduleData as ScheduleRow[]) ?? [];
      const filteredTodaySchedules = allSchedules
        .filter((item) => {
          if (item.is_recurring) {
            return item.day_of_week === todayDay;
          }
          return item.schedule_date === todayString;
        })
        .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

      setTodaySchedules(filteredTodaySchedules);

      const allTodos = (todoData as TodoRow[]) ?? [];
      const filteredTodayTodos = allTodos.filter((item) => {
        if (!item.due_date) return true;
        return item.due_date === todayString;
      });

      setTodayTodos(filteredTodayTodos);

      const approvedTotal = ((requestData as AllowanceRequestRow[]) ?? []).reduce(
        (sum, item) => sum + Number(item.allowance_amount ?? 0),
        0
      );

      const expenseTotal = ((expenseData as AllowanceExpenseRow[]) ?? []).reduce(
        (sum, item) => sum + Number(item.amount ?? 0),
        0
      );

      setBalance(approvedTotal - expenseTotal);
    } catch (error) {
      console.error("TodayDashboard 조회 오류:", error);
      setMessage("오늘 현황을 불러오지 못했습니다.");
      setTodaySchedules([]);
      setTodayTodos([]);
      setBalance(0);
    } finally {
      setLoading(false);
    }
  }

  if (!childId) {
    return (
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <h2 className="text-xl font-semibold text-gray-900">
          {role === "child" ? "오늘 내 현황" : "오늘 아이 현황"}
        </h2>
        <p className="mt-3 text-sm text-gray-500">
          {role === "child"
            ? "연결된 자녀 정보를 확인해 주세요."
            : "자녀를 선택해 주세요."}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {role === "child" ? "오늘 내 현황" : "오늘 아이 현황"}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {child?.name ? `${child.name}` : "선택한 자녀"} · {todayLabel}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/personal/child/schedule"
            className="rounded-2xl border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          >
            일정 관리
          </Link>
          <Link
            href="/personal/child/allowance"
            className="rounded-2xl border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          >
            용돈 관리
          </Link>
          <Link
            href="/personal/child/todo"
            className="rounded-2xl border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          >
            할 일 관리
          </Link>
        </div>
      </div>

      {message ? (
        <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          {message}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-6 rounded-2xl bg-gray-50 px-4 py-8 text-sm text-gray-500">
          불러오는 중...
        </div>
      ) : (
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_1.1fr_0.8fr]">
          <div className="rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">📅 오늘 일정</h3>
              <span className="text-sm text-gray-500">{todaySchedules.length}건</span>
            </div>

            {todaySchedules.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">오늘 일정이 없어요.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {todaySchedules.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-2xl border px-4 py-4 ${getColorClass(item.color)}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{item.title}</p>
                        <p className="mt-1 text-sm opacity-90">
                          {formatTime(item.start_time) || "-"}
                          {item.end_time ? ` ~ ${formatTime(item.end_time)}` : ""}
                        </p>
                      </div>

                      <span className="rounded-full bg-white/70 px-2 py-1 text-[11px]">
                        {item.is_recurring ? "반복" : "일회성"}
                      </span>
                    </div>

                    {item.location ? (
                      <p className="mt-2 text-sm opacity-90">📍 {item.location}</p>
                    ) : null}

                    {item.memo ? (
                      <p className="mt-1 text-sm opacity-90">{item.memo}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">📝 오늘의 할 일</h3>
              <span className="text-sm text-gray-500">{todayTodos.length}건</span>
            </div>

            {todayTodos.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">오늘 할 일이 없어요.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {todayTodos.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4"
                  >
                    <p className="font-semibold text-gray-900">{item.title}</p>
                    <p className="mt-1 text-sm text-gray-500">
                      마감일: {item.due_date ?? "미지정"}
                    </p>
                    <p className="mt-1 text-sm text-blue-600">
                      보상: {item.reward_points}P
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 p-5">
              <h3 className="text-lg font-semibold text-gray-900">💰 현재 용돈</h3>
              <p className="mt-4 text-3xl font-bold text-gray-900">
                {balance.toLocaleString()}원
              </p>
              <p className="mt-2 text-sm text-gray-500">
                승인된 용돈과 지출 내역을 기준으로 계산한 현재 잔액이에요.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <h3 className="text-lg font-semibold text-gray-900">빠른 확인</h3>
              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <p>• 오늘 일정과 오늘의 할 일을 함께 보여줘요.</p>
                <p>• 현재 용돈은 승인된 용돈 요청만 반영해 계산해요.</p>
                <p>• 상세 수정은 각 관리 페이지에서 할 수 있어요.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}