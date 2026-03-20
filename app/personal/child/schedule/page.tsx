import type { ReactNode } from "react";
import { CalendarDays, Clock3, MapPin, Repeat2 } from "lucide-react";
import { requireChild } from "@/lib/auth/requireChild";
import { createServerSupabase } from "@/lib/supabase/server";
import ChildPageHeader from "../ChildPageHeader";

export const dynamic = "force-dynamic";

type TimetableRow = {
  id: string;
  child_id: string;
  title?: string | null;
  subject?: string | null;
  name?: string | null;
  day_of_week?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  location?: string | null;
  memo?: string | null;
  color?: string | null;
};

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function normalizeDayKey(day?: string | null) {
  const value = (day ?? "").trim().toLowerCase();

  if (["sun", "sunday", "일", "일요일"].includes(value)) return "sun";
  if (["mon", "monday", "월", "월요일"].includes(value)) return "mon";
  if (["tue", "tuesday", "화", "화요일"].includes(value)) return "tue";
  if (["wed", "wednesday", "수", "수요일"].includes(value)) return "wed";
  if (["thu", "thursday", "목", "목요일"].includes(value)) return "thu";
  if (["fri", "friday", "금", "금요일"].includes(value)) return "fri";
  if (["sat", "saturday", "토", "토요일"].includes(value)) return "sat";

  return "";
}

function getDayLabelFromKey(day?: string | null) {
  switch (normalizeDayKey(day)) {
    case "sun":
      return "일요일";
    case "mon":
      return "월요일";
    case "tue":
      return "화요일";
    case "wed":
      return "수요일";
    case "thu":
      return "목요일";
    case "fri":
      return "금요일";
    case "sat":
      return "토요일";
    default:
      return "";
  }
}

function getDisplayTitle(item: TimetableRow) {
  return item.subject || item.title || item.name || "일정";
}

function formatTimeRange(start?: string | null, end?: string | null) {
  if (!start && !end) return "시간 미정";
  if (start && end) return `${start.slice(0, 5)} ~ ${end.slice(0, 5)}`;
  if (start) return `${start.slice(0, 5)} ~`;
  return `~ ${end?.slice(0, 5)}`;
}

function getColorClass(color?: string | null) {
  switch (color) {
    case "pink":
      return "border-pink-200 bg-pink-50";
    case "yellow":
      return "border-yellow-200 bg-yellow-50";
    case "blue":
      return "border-blue-200 bg-blue-50";
    case "green":
      return "border-green-200 bg-green-50";
    case "purple":
      return "border-purple-200 bg-purple-50";
    case "gray":
    default:
      return "border-gray-200 bg-gray-50";
  }
}

function getNextRecurringDate(dayOfWeek: string | null | undefined, now: Date) {
  const normalized = normalizeDayKey(dayOfWeek);
  const targetIndex = DAY_KEYS.indexOf(normalized as (typeof DAY_KEYS)[number]);

  if (targetIndex < 0) return null;

  const currentIndex = now.getDay();
  let diff = targetIndex - currentIndex;
  if (diff <= 0) diff += 7;

  const next = new Date(now);
  next.setHours(0, 0, 0, 0);
  next.setDate(now.getDate() + diff);
  return next;
}

function getDaysUntil(target: Date, now: Date) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(target);
  end.setHours(0, 0, 0, 0);

  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

type UpcomingTimetableRow = TimetableRow & {
  nextDate: Date | null;
  nextLabel: string;
  relativeLabel: string;
  recurringLabel: string;
};

function decorateUpcomingItem(
  item: TimetableRow,
  now: Date
): UpcomingTimetableRow | null {
  const nextDate = getNextRecurringDate(item.day_of_week, now);
  if (!nextDate) return null;

  const daysUntil = getDaysUntil(nextDate, now);
  const dayLabel = getDayLabelFromKey(item.day_of_week);

  return {
    ...item,
    nextDate,
    nextLabel: `다음 일정: ${dayLabel}`,
    relativeLabel: daysUntil === 1 ? "내일" : `${daysUntil}일 뒤`,
    recurringLabel: `${dayLabel} 반복`,
  };
}

function sortToday(a: TimetableRow, b: TimetableRow) {
  return (a.start_time ?? "99:99").localeCompare(b.start_time ?? "99:99");
}

function sortUpcoming(a: UpcomingTimetableRow, b: UpcomingTimetableRow) {
  const aTime = a.nextDate ? a.nextDate.getTime() : Number.MAX_SAFE_INTEGER;
  const bTime = b.nextDate ? b.nextDate.getTime() : Number.MAX_SAFE_INTEGER;

  if (aTime !== bTime) return aTime - bTime;
  return (a.start_time ?? "99:99").localeCompare(b.start_time ?? "99:99");
}

export default async function ChildSchedulePage() {
  const profile = await requireChild();
  const supabase = await createServerSupabase();

  if (!profile.child_id) {
    return (
      <div className="space-y-4">
        <ChildPageHeader
          title="내 일정"
          description="오늘 일정과 다가오는 일정을 한눈에 확인해요."
          tone="schedule"
        />
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">
            아직 연결된 자녀 프로필이 없어요.
          </p>
        </section>
      </div>
    );
  }

  const { data, error } = await supabase
    .from("timetables")
    .select("*")
    .eq("child_id", profile.child_id);

  const items = (data as TimetableRow[]) ?? [];
  const now = new Date();
  const todayDayKey = DAY_KEYS[now.getDay()];

  const todayItems = items
    .filter((item) => normalizeDayKey(item.day_of_week) === todayDayKey)
    .sort(sortToday);

  const upcomingItemsAll = items
    .filter((item) => normalizeDayKey(item.day_of_week) !== todayDayKey)
    .map((item) => decorateUpcomingItem(item, now))
    .filter((item): item is UpcomingTimetableRow => !!item)
    .sort(sortUpcoming);

  const upcomingItems = upcomingItemsAll.slice(0, 6);
  const recurringCount = items.length;

  return (
    <div className="space-y-6">
      <ChildPageHeader
        title="내 일정"
        description="오늘 일정과 다가오는 일정을 한눈에 확인해요."
        tone="schedule"
      />

      {error ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          일정 조회 오류: {error.message ?? "알 수 없는 오류"}
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          icon={<CalendarDays className="h-5 w-5" />}
          title="오늘 일정"
          value={`${todayItems.length}개`}
          desc="오늘 바로 확인할 일정"
        />
        <SummaryCard
          icon={<Clock3 className="h-5 w-5" />}
          title="다가오는 일정"
          value={`${upcomingItemsAll.length}개`}
          desc="가까운 순서대로 정리"
        />
        <SummaryCard
          icon={<Repeat2 className="h-5 w-5" />}
          title="반복 일정"
          value={`${recurringCount}개`}
          desc="매주 반복되는 일정"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel
          title="오늘 일정"
          icon={<CalendarDays className="h-5 w-5" />}
          badge={`${todayItems.length}개`}
        >
          {todayItems.length === 0 ? (
            <EmptyState text="오늘 등록된 일정이 없어요." />
          ) : (
            <div className="space-y-3">
              {todayItems.map((item) => (
                <TodayScheduleCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title="다가오는 일정"
          icon={<Clock3 className="h-5 w-5" />}
          badge={`${upcomingItems.length}개`}
        >
          {upcomingItems.length === 0 ? (
            <EmptyState text="다가오는 일정이 없어요." />
          ) : (
            <>
              <div className="space-y-3">
                {upcomingItems.map((item) => (
                  <UpcomingScheduleCard key={item.id} item={item} />
                ))}
              </div>
              {upcomingItemsAll.length > upcomingItems.length ? (
                <p className="mt-3 text-xs text-slate-400">
                  가까운 일정 6개만 보여줘요.
                </p>
              ) : null}
            </>
          )}
        </Panel>
      </section>
    </div>
  );
}

function TodayScheduleCard({ item }: { item: TimetableRow }) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${getColorClass(item.color)}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">{getDisplayTitle(item)}</p>

          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
            <span>{formatTimeRange(item.start_time, item.end_time)}</span>
            <span>{getDayLabelFromKey(item.day_of_week)} 반복</span>
          </div>

          {item.location ? (
            <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
              <MapPin className="h-3.5 w-3.5" />
              {item.location}
            </p>
          ) : null}

          {item.memo ? (
            <p className="mt-2 text-xs text-slate-500">{item.memo}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function UpcomingScheduleCard({ item }: { item: UpcomingTimetableRow }) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${getColorClass(item.color)}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-900">{getDisplayTitle(item)}</p>
            <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
              {item.relativeLabel}
            </span>
          </div>

          <p className="mt-1 text-xs font-semibold text-pink-600">{item.nextLabel}</p>

          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
            <span>{formatTimeRange(item.start_time, item.end_time)}</span>
            <span>{item.recurringLabel}</span>
          </div>

          {item.location ? (
            <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
              <MapPin className="h-3.5 w-3.5" />
              {item.location}
            </p>
          ) : null}

          {item.memo ? (
            <p className="mt-2 text-xs text-slate-500">{item.memo}</p>
          ) : null}
        </div>
      </div>
    </div>
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
      <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-400">{desc}</p>
    </div>
  );
}

function Panel({
  title,
  icon,
  badge,
  children,
}: {
  title: string;
  icon: ReactNode;
  badge?: string;
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

        {badge ? (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
            {badge}
          </span>
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