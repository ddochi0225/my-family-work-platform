"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  CalendarDays,
  CheckSquare,
  Clock3,
  Coins,
  ChevronRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type ProfileRow = {
  id: string;
  child_id: string | null;
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

type TimetableRow = {
  id: string;
  child_id: string;
  title: string;
  day_of_week?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  location?: string | null;
  memo?: string | null;
};

type PointHistoryRow = {
  id: string;
  child_id: string;
  type?: string | null;
  points?: number | null;
  description?: string | null;
  created_at?: string | null;
};

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function toDateStringLocal(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTodayInfo() {
  const now = new Date();
  const dayIndex = now.getDay();

  return {
    dayLabel: DAY_LABELS[dayIndex],
    dayKey: DAY_KEYS[dayIndex],
    today: toDateStringLocal(now),
    dateText: `${now.getMonth() + 1}월 ${now.getDate()}일`,
  };
}

function normalizeDay(value?: string | null) {
  if (!value) return "";
  const v = value.trim().toLowerCase();

  if (["일", "일요일", "sun", "sunday"].includes(v)) return "sun";
  if (["월", "월요일", "mon", "monday"].includes(v)) return "mon";
  if (["화", "화요일", "tue", "tuesday"].includes(v)) return "tue";
  if (["수", "수요일", "wed", "wednesday"].includes(v)) return "wed";
  if (["목", "목요일", "thu", "thursday"].includes(v)) return "thu";
  if (["금", "금요일", "fri", "friday"].includes(v)) return "fri";
  if (["토", "토요일", "sat", "saturday"].includes(v)) return "sat";

  return v;
}

function formatTimeRange(start?: string | null, end?: string | null) {
  if (!start && !end) return "시간 미정";
  if (start && end) return `${start.slice(0, 5)} ~ ${end.slice(0, 5)}`;
  if (start) return `${start.slice(0, 5)} ~`;
  return `~ ${end?.slice(0, 5)}`;
}

function isAvailableToday(item: TodoRow, today: string) {
  return !item.due_date || item.due_date <= today;
}

function sortByDueDateAsc(a: TodoRow, b: TodoRow) {
  const aDate = a.due_date ?? "9999-12-31";
  const bDate = b.due_date ?? "9999-12-31";
  return aDate.localeCompare(bDate);
}

export default function ChildHomePage() {
  const [loading, setLoading] = useState(true);
  const [childId, setChildId] = useState<string | null>(null);
  const [todos, setTodos] = useState<TodoRow[]>([]);
  const [timetable, setTimetable] = useState<TimetableRow[]>([]);
  const [points, setPoints] = useState<PointHistoryRow[]>([]);

  const todayInfo = useMemo(() => getTodayInfo(), []);

  async function loadPage() {
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const userId = session?.user?.id;
    if (!userId) {
      setLoading(false);
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, child_id")
      .eq("id", userId)
      .single();

    const profile = profileData as ProfileRow | null;
    if (!profile?.child_id) {
      setLoading(false);
      return;
    }

    setChildId(profile.child_id);

    const [todoRes, timetableRes, pointRes] = await Promise.all([
      supabase
        .from("todos")
        .select(
          "id, child_id, title, memo, due_date, reward_points, repeat_type, repeat_until, completed, completed_at, created_at"
        )
        .eq("child_id", profile.child_id)
        .order("created_at", { ascending: false }),
      supabase
        .from("timetables")
        .select("id, child_id, title, day_of_week, start_time, end_time, location, memo")
        .eq("child_id", profile.child_id),
      supabase
        .from("point_histories")
        .select("id, child_id, type, points, description, created_at")
        .eq("child_id", profile.child_id)
        .order("created_at", { ascending: false }),
    ]);

    setTodos((todoRes.data as TodoRow[]) ?? []);
    setTimetable((timetableRes.data as TimetableRow[]) ?? []);
    setPoints((pointRes.data as PointHistoryRow[]) ?? []);

    setLoading(false);
  }

  useEffect(() => {
    loadPage();
  }, []);

  const todayTodos = useMemo(() => {
    return [...todos]
      .filter((item) => !item.completed)
      .filter((item) => isAvailableToday(item, todayInfo.today))
      .sort(sortByDueDateAsc)
      .slice(0, 5);
  }, [todos, todayInfo.today]);

  const todaySchedules = useMemo(() => {
    return [...timetable]
      .filter((item) => normalizeDay(item.day_of_week) === todayInfo.dayKey)
      .sort((a, b) => (a.start_time ?? "99:99").localeCompare(b.start_time ?? "99:99"))
      .slice(0, 4);
  }, [timetable, todayInfo.dayKey]);

  const totalPoint = useMemo(() => {
    return points.reduce((sum, item) => sum + Number(item.points ?? 0), 0);
  }, [points]);

  const recentPoints = useMemo(() => {
    return points.slice(0, 4);
  }, [points]);

  if (loading) {
    return (
      <div className="space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">자녀 홈을 불러오는 중이에요...</p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wide text-sky-600">
              {todayInfo.dateText} · {todayInfo.dayLabel}요일
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              자녀 홈
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              오늘 해야 할 일과 시간표, 포인트를 한 번에 확인해요.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <ActionLink href="/personal/child/todo" label="할 일 보기" />
            <ActionLink href="/personal/child/timetable" label="시간표 보기" />
            <ActionLink href="/personal/child/allowance" label="포인트 / 용돈" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          icon={<CheckSquare className="h-5 w-5" />}
          title="할 일"
          value={`${todayTodos.length}개`}
          desc="오늘 바로 할 수 있는 일"
        />
        <SummaryCard
          icon={<Clock3 className="h-5 w-5" />}
          title="시간표"
          value={`${todaySchedules.length}개`}
          desc="오늘 등록된 일정"
        />
        <SummaryCard
          icon={<Coins className="h-5 w-5" />}
          title="포인트"
          value={`${totalPoint.toLocaleString()}P`}
          desc="현재 보유 포인트"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Panel
            title="오늘 할 일"
            icon={<CheckSquare className="h-5 w-5" />}
            href="/personal/child/todo"
            linkText="전체보기"
          >
            {todayTodos.length === 0 ? (
              <EmptyState text="오늘 할 일을 모두 완료했어요 🎉" />
            ) : (
              <div className="space-y-3">
                {todayTodos.map((item, index) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                          {index + 1}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {item.title}
                          </p>

                          {item.memo ? (
                            <p className="mt-1 truncate text-xs text-slate-500">
                              {item.memo}
                            </p>
                          ) : item.due_date ? (
                            <p className="mt-1 text-xs text-slate-400">
                              마감일 {item.due_date}
                            </p>
                          ) : (
                            <p className="mt-1 text-xs text-slate-400">오늘 가능한 할 일</p>
                          )}
                        </div>
                      </div>

                      {item.reward_points > 0 ? (
                        <div className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                          {item.reward_points.toLocaleString()}P
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel
            title="최근 포인트 내역"
            icon={<Coins className="h-5 w-5" />}
            href="/personal/child/allowance"
            linkText="전체보기"
          >
            {recentPoints.length === 0 ? (
              <EmptyState text="포인트 내역이 아직 없어요." />
            ) : (
              <div className="space-y-3">
                {recentPoints.map((item) => {
                  const point = Number(item.points ?? 0);
                  const isPlus = point >= 0;

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {item.description || "포인트 내역"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {item.created_at
                            ? new Date(item.created_at).toLocaleDateString("ko-KR")
                            : ""}
                        </p>
                      </div>

                      <div
                        className={`shrink-0 text-sm font-bold ${
                          isPlus ? "text-sky-600" : "text-rose-500"
                        }`}
                      >
                        {isPlus ? "+" : ""}
                        {point.toLocaleString()}P
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel
            title="오늘 시간표"
            icon={<CalendarDays className="h-5 w-5" />}
            href="/personal/child/timetable"
            linkText="전체보기"
          >
            {todaySchedules.length === 0 ? (
              <EmptyState text="오늘 등록된 시간표가 없어요." />
            ) : (
              <div className="space-y-3">
                {todaySchedules.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {item.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatTimeRange(item.start_time, item.end_time)}
                        </p>
                        {item.location ? (
                          <p className="mt-1 text-xs text-slate-400">
                            장소: {item.location}
                          </p>
                        ) : null}
                      </div>

                      <span className="shrink-0 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                        {todayInfo.dayLabel}요일
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <ChevronRight className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">빠른 이동</h2>
                <p className="text-sm text-slate-500">
                  자주 사용하는 메뉴로 바로 이동해요.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              <MenuLink
                href="/personal/child/todo"
                title="내 할 일"
                desc="오늘 해야 할 일을 확인해요."
              />
              <MenuLink
                href="/personal/child/schedule"
                title="내 일정"
                desc="등록된 일정을 확인해요."
              />
              <MenuLink
                href="/personal/child/timetable"
                title="내 시간표"
                desc="요일별 시간표를 확인해요."
              />
              <MenuLink
                href="/personal/child/allowance"
                title="포인트 / 용돈"
                desc="포인트와 요청 내역을 확인해요."
              />
            </div>

            {childId ? (
              <p className="mt-4 text-xs text-slate-400">연결된 자녀 ID: {childId}</p>
            ) : null}
          </section>
        </div>
      </section>
    </div>
  );
}

function ActionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
    >
      {label}
    </Link>
  );
}

function SummaryCard({
  icon,
  title,
  value,
  desc,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
        {icon}
      </div>
      <p className="mt-3 text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{desc}</p>
    </div>
  );
}

function Panel({
  title,
  icon,
  href,
  linkText,
  children,
}: {
  title: string;
  icon: ReactNode;
  href?: string;
  linkText?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            {icon}
          </div>
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        </div>

        {href && linkText ? (
          <Link
            href={href}
            className="text-sm font-semibold text-sky-600 transition hover:text-sky-700"
          >
            {linkText}
          </Link>
        ) : null}
      </div>

      <div className="mt-4">{children}</div>
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
      {text}
    </div>
  );
}

function MenuLink({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-4 transition hover:bg-slate-50"
    >
      <div>
        <p className="font-medium text-slate-900">{title}</p>
        <p className="mt-1 text-sm text-slate-500">{desc}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-slate-400" />
    </Link>
  );
}