"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CalendarDays, Clock3, LayoutGrid, List } from "lucide-react";
import ChildPageHeader from "../ChildPageHeader";

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

type Props = {
  initialItems: TimetableRow[];
  pageMessage?: string;
};

const DAYS = [
  { value: "sunday", label: "일요일", shortLabel: "일" },
  { value: "monday", label: "월요일", shortLabel: "월" },
  { value: "tuesday", label: "화요일", shortLabel: "화" },
  { value: "wednesday", label: "수요일", shortLabel: "수" },
  { value: "thursday", label: "목요일", shortLabel: "목" },
  { value: "friday", label: "금요일", shortLabel: "금" },
  { value: "saturday", label: "토요일", shortLabel: "토" },
] as const;

const WEEKDAY_HEADERS = ["일", "월", "화", "수", "목", "금", "토"];
const WEEKDAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];
const WEEKEND_KEYS = ["sunday", "saturday"];

function getColorCardClass(color: string | null, subject?: string) {
  const isSchool = subject?.trim() === "학교";

  if (isSchool) {
    return "border-slate-200 bg-slate-100";
  }

  switch (color) {
    case "sky":
      return "border-sky-200 bg-sky-50";
    case "violet":
      return "border-violet-200 bg-violet-50";
    case "emerald":
      return "border-emerald-200 bg-emerald-50";
    case "amber":
      return "border-amber-200 bg-amber-50";
    case "rose":
      return "border-rose-200 bg-rose-50";
    case "slate":
      return "border-slate-200 bg-slate-50";
    default:
      return "border-gray-200 bg-gray-50";
  }
}

function getColorCardClassMuted(color: string | null, subject?: string) {
  const isSchool = subject?.trim() === "학교";

  if (isSchool) {
    return "border-slate-200 bg-gradient-to-b from-slate-100 to-slate-50";
  }

  switch (color) {
    case "sky":
      return "border-sky-100 bg-sky-50/60";
    case "violet":
      return "border-violet-100 bg-violet-50/60";
    case "emerald":
      return "border-emerald-100 bg-emerald-50/60";
    case "amber":
      return "border-amber-100 bg-amber-50/60";
    case "rose":
      return "border-rose-100 bg-rose-50/60";
    case "slate":
      return "border-slate-100 bg-slate-50/60";
    default:
      return "border-gray-100 bg-gray-50/70";
  }
}

function getRepeatTypeLabel(repeatType: string | null) {
  switch (repeatType) {
    case "weekday":
      return "평일 반복";
    case "weekend":
      return "주말 반복";
    case "once":
      return "1회성 표시";
    case "weekly":
    default:
      return "매주 반복";
  }
}

function buildCalendarDays(baseMonth: Date) {
  const startOfMonth = new Date(baseMonth.getFullYear(), baseMonth.getMonth(), 1);
  const endOfMonth = new Date(baseMonth.getFullYear(), baseMonth.getMonth() + 1, 0);

  const startDay = new Date(startOfMonth);
  startDay.setDate(startOfMonth.getDate() - startOfMonth.getDay());

  const endDay = new Date(endOfMonth);
  endDay.setDate(endOfMonth.getDate() + (6 - endOfMonth.getDay()));

  const days: { key: string; date: Date; isCurrentMonth: boolean }[] = [];
  const cursor = new Date(startDay);

  while (cursor <= endDay) {
    const current = new Date(cursor);
    days.push({
      key: `${current.getFullYear()}-${`${current.getMonth() + 1}`.padStart(2, "0")}-${`${current.getDate()}`.padStart(2, "0")}`,
      date: current,
      isCurrentMonth: current.getMonth() === baseMonth.getMonth(),
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

function getDayKeyFromDate(date: Date) {
  const day = date.getDay();
  switch (day) {
    case 0:
      return "sunday";
    case 1:
      return "monday";
    case 2:
      return "tuesday";
    case 3:
      return "wednesday";
    case 4:
      return "thursday";
    case 5:
      return "friday";
    case 6:
      return "saturday";
    default:
      return "monday";
  }
}

function matchesDateByRepeat(item: TimetableRow, date: Date) {
  const dateDay = getDayKeyFromDate(date);

  if (item.repeat_type === "weekday") {
    return WEEKDAY_KEYS.includes(dateDay);
  }
  if (item.repeat_type === "weekend") {
    return WEEKEND_KEYS.includes(dateDay);
  }
  return item.day_of_week === dateDay;
}

export default function ChildTimetableClient({
  initialItems,
  pageMessage = "",
}: Props) {
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const groupedItems = useMemo(
    () =>
      DAYS.map((day) => ({
        ...day,
        items: initialItems
          .filter((item) => item.day_of_week === day.value)
          .sort((a, b) => a.start_time.localeCompare(b.start_time)),
      })),
    [initialItems]
  );

  const calendarDays = useMemo(() => buildCalendarDays(currentMonth), [currentMonth]);

  const monthLabel = useMemo(
    () => `${currentMonth.getFullYear()}년 ${currentMonth.getMonth() + 1}월`,
    [currentMonth]
  );

  const monthSchedules = useMemo(
    () =>
      calendarDays.map((day) => ({
        ...day,
        schedules: initialItems
          .filter((item) => matchesDateByRepeat(item, day.date))
          .sort((a, b) => a.start_time.localeCompare(b.start_time)),
      })),
    [calendarDays, initialItems]
  );

  const weekdayCount = useMemo(() => {
    return initialItems.filter((item) => WEEKDAY_KEYS.includes(item.day_of_week)).length;
  }, [initialItems]);

  const weekendCount = useMemo(() => {
    return initialItems.filter((item) => WEEKEND_KEYS.includes(item.day_of_week)).length;
  }, [initialItems]);

  return (
    <div className="space-y-6">
      {pageMessage ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          {pageMessage}
        </section>
      ) : null}

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <ChildPageHeader
          title="내 시간표"
          description="주간 시간표와 월간 달력에서 한눈에 확인해요."
          tone="timetable"
          dateLabel="주간 / 월간 보기"
          rightSlot={
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setViewMode("week")}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  viewMode === "week"
                    ? "border border-sky-500 bg-sky-500 text-white"
                    : "border border-slate-200 bg-white/80 text-slate-700 hover:bg-slate-50"
                }`}
              >
                주간 보기
              </button>

              <button
                type="button"
                onClick={() => setViewMode("month")}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  viewMode === "month"
                    ? "border border-violet-500 bg-violet-500 text-white"
                    : "border border-slate-200 bg-white/80 text-slate-700 hover:bg-slate-50"
                }`}
              >
                월간 보기
              </button>
            </div>
          }
        />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          icon={<CalendarDays className="h-5 w-5" />}
          title="등록된 시간표"
          value={`${initialItems.length}개`}
        />
        <SummaryCard
          icon={<Clock3 className="h-5 w-5" />}
          title="평일 일정"
          value={`${weekdayCount}개`}
        />
        <SummaryCard
          icon={<LayoutGrid className="h-5 w-5" />}
          title="주말 일정"
          value={`${weekendCount}개`}
        />
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        {viewMode === "week" ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">주간 시간표</h2>
                <p className="text-sm text-slate-500">요일별 시간표를 확인해요.</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {groupedItems.map((day) => (
                <div key={day.value} className="rounded-xl border border-gray-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">{day.label}</h3>
                    <span className="text-xs text-slate-400">{day.items.length}개</span>
                  </div>

                  {day.items.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-400">등록된 시간표가 없어요.</p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {day.items.map((item) => (
                        <div
                          key={item.id}
                          className={`rounded-xl border px-3 py-3 ${getColorCardClass(
                            item.color,
                            item.subject
                          )}`}
                        >
                          <p className={`text-sm font-semibold ${
                            item.subject?.trim() === "학교"
                              ? "text-slate-700"
                              : "text-slate-900"
                          }`}>
                            {item.subject}
                          </p>
                          <p className="mt-1 text-xs text-slate-600">
                            {item.start_time} ~ {item.end_time}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {getRepeatTypeLabel(item.repeat_type)}
                          </p>
                          {item.location ? (
                            <p className="mt-1 text-xs text-slate-500">{item.location}</p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <LayoutGrid className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">월간 시간표</h2>
                  <p className="text-sm text-slate-500">한 달 전체 흐름을 달력에서 확인해요.</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentMonth(
                      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
                    )
                  }
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-slate-50"
                >
                  이전달
                </button>
                <div className="min-w-[110px] text-center text-base font-semibold text-slate-900">
                  {monthLabel}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentMonth(
                      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
                    )
                  }
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-slate-50"
                >
                  다음달
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {WEEKDAY_HEADERS.map((label) => (
                <div
                  key={label}
                  className="rounded-lg bg-slate-50 px-2 py-2 text-center text-xs font-semibold text-slate-500"
                >
                  {label}
                </div>
              ))}

              {monthSchedules.map((day) => {
                const isMuted = !day.isCurrentMonth;

                return (
                  <div
                    key={day.key}
                    className={`min-h-[120px] rounded-xl border p-2 ${
                      day.isCurrentMonth
                        ? "border-gray-200 bg-white"
                        : "border-gray-100 bg-slate-50"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span
                        className={`text-sm font-semibold ${
                          day.isCurrentMonth ? "text-slate-900" : "text-slate-300"
                        }`}
                      >
                        {day.date.getDate()}
                      </span>
                      {day.schedules.length > 0 ? (
                        <span
                          className={`text-[10px] ${
                            day.isCurrentMonth ? "text-slate-300" : "text-slate-200"
                          }`}
                        >
                          {day.schedules.length}개
                        </span>
                      ) : null}
                    </div>

                    <div className="space-y-1.5">
                      {day.schedules.slice(0, 4).map((item) => {
                        const isSchool = item.subject?.trim() === "학교";

                        return (
                          <div
                            key={`${day.key}-${item.id}`}
                            className={`rounded-lg border px-2 py-1.5 ${
                              isMuted
                                ? getColorCardClassMuted(item.color, item.subject)
                                : getColorCardClass(item.color, item.subject)
                            }`}
                          >
                            <p
                              className={`truncate text-[11px] font-semibold ${
                                isMuted
                                  ? isSchool
                                    ? "text-slate-400"
                                    : "text-slate-500"
                                  : isSchool
                                  ? "text-slate-600"
                                  : "text-slate-900"
                              }`}
                            >
                              {item.subject}
                            </p>
                            <p
                              className={`mt-0.5 text-[10px] ${
                                isMuted ? "text-slate-300" : "text-slate-600"
                              }`}
                            >
                              {item.start_time} ~ {item.end_time}
                            </p>
                          </div>
                        );
                      })}

                      {day.schedules.length > 4 ? (
                        <p
                          className={`text-[10px] ${
                            day.isCurrentMonth ? "text-slate-400" : "text-slate-300"
                          }`}
                        >
                          + {day.schedules.length - 4}개 더 있음
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
              월간 보기에서는 반복 유형에 맞춰 해당 달의 날짜에 시간표가 펼쳐져 보여요.
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  icon,
  title,
  value,
}: {
  icon: ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
        {icon}
      </div>
      <p className="mt-3 text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}