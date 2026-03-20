"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type ChildRow = {
  id: string;
  name: string;
  parent_id: string;
};

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
  created_at?: string;
};

type Props = {
  parentId: string;
  initialChildren: ChildRow[];
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
const DAY_ORDER: string[] = DAYS.map((d) => d.value);
const MINUTES_PER_HOUR = 60;
const PX_PER_HOUR = 72;
const PX_PER_MINUTE = PX_PER_HOUR / MINUTES_PER_HOUR;
const GRID_TOP_PADDING = 16;

const dayLabelMap: Record<string, string> = {
  monday: "월요일",
  tuesday: "화요일",
  wednesday: "수요일",
  thursday: "목요일",
  friday: "금요일",
  saturday: "토요일",
  sunday: "일요일",
};

const COLOR_OPTIONS = [
  { value: "sky", label: "하늘", preview: "bg-sky-100 border-sky-300" },
  { value: "violet", label: "보라", preview: "bg-violet-100 border-violet-300" },
  { value: "emerald", label: "초록", preview: "bg-emerald-100 border-emerald-300" },
  { value: "amber", label: "노랑", preview: "bg-amber-100 border-amber-300" },
  { value: "rose", label: "분홍", preview: "bg-rose-100 border-rose-300" },
  { value: "slate", label: "회색", preview: "bg-slate-100 border-slate-300" },
] as const;

const REPEAT_OPTIONS = [
  { value: "weekly", label: "매주 반복" },
  { value: "weekday", label: "평일 반복" },
  { value: "weekend", label: "주말 반복" },
  { value: "once", label: "1회성 표시" },
] as const;

export default function ParentTimetableClient({ initialChildren }: Props) {
  const [children] = useState<ChildRow[]>(initialChildren);
  const [selectedChildId, setSelectedChildId] = useState(initialChildren[0]?.id ?? "");

  const [items, setItems] = useState<TimetableRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  const [viewMode, setViewMode] = useState<"list" | "month">("list");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingGroupIds, setEditingGroupIds] = useState<string[]>([]);

  const [dayOfWeek, setDayOfWeek] = useState("monday");
  const [selectedDays, setSelectedDays] = useState<string[]>(["monday"]);
  const [startTime, setStartTime] = useState("15:00");
  const [endTime, setEndTime] = useState("16:00");
  const [subject, setSubject] = useState("");
  const [location, setLocation] = useState("");
  const [color, setColor] = useState("sky");
  const [repeatType, setRepeatType] = useState("weekly");

  const [message, setMessage] = useState("");
  const [showDayList, setShowDayList] = useState(false);

  const selectedChild = useMemo(
    () => children.find((child) => child.id === selectedChildId) ?? null,
    [children, selectedChildId]
  );

  const groupedItems = useMemo(
    () =>
      DAYS.map((day) => ({
        ...day,
        items: items.filter((item) => item.day_of_week === day.value),
      })),
    [items]
  );

  const previewStyle = useMemo(() => getColorCardClass(color), [color]);
  const monthLabel = useMemo(
    () => `${currentMonth.getFullYear()}년 ${currentMonth.getMonth() + 1}월`,
    [currentMonth]
  );
  const calendarDays = useMemo(() => buildCalendarDays(currentMonth), [currentMonth]);

  const weeklyGridData = useMemo(() => buildWeeklyGridData(items), [items]);

  const loadItems = async () => {
    if (!selectedChildId) {
      setItems([]);
      return;
    }

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("timetables")
      .select(
        "id, child_id, day_of_week, start_time, end_time, subject, location, color, repeat_type, created_at"
      )
      .eq("child_id", selectedChildId)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      console.error(error);
      setMessage(`시간표를 불러오지 못했어요. (${error.message})`);
      setItems([]);
      setLoading(false);
      return;
    }

    setItems((data as TimetableRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadItems();
  }, [selectedChildId]);

  useEffect(() => {
    if (repeatType === "weekly" && selectedDays.length === 0) {
      setSelectedDays(["monday"]);
    }
    if (repeatType === "once") {
      setSelectedDays([dayOfWeek]);
    }
  }, [repeatType, dayOfWeek, selectedDays.length]);

  const resetForm = () => {
    setEditingId(null);
    setEditingGroupIds([]);
    setDayOfWeek("monday");
    setSelectedDays(["monday"]);
    setStartTime("15:00");
    setEndTime("16:00");
    setSubject("");
    setLocation("");
    setColor("sky");
    setRepeatType("weekly");
  };

  const findLinkedGroup = (target: TimetableRow) => {
    const targetLocation = (target.location ?? "").trim();
    return items.filter((item) => {
      const itemLocation = (item.location ?? "").trim();
      return (
        item.child_id === target.child_id &&
        item.subject === target.subject &&
        item.start_time === target.start_time &&
        item.end_time === target.end_time &&
        itemLocation === targetLocation &&
        (item.color ?? "sky") === (target.color ?? "sky") &&
        (item.repeat_type ?? "weekly") === (target.repeat_type ?? "weekly")
      );
    });
  };

  const handleEdit = (item: TimetableRow) => {
    const linked = findLinkedGroup(item);
    const linkedDays = linked.map((row) => row.day_of_week).filter(Boolean);

    setEditingId(item.id);
    setEditingGroupIds(linked.map((row) => row.id));
    setDayOfWeek(item.day_of_week);
    setSelectedDays(sortDays(linkedDays.length > 0 ? linkedDays : [item.day_of_week]));
    setStartTime(item.start_time);
    setEndTime(item.end_time);
    setSubject(item.subject);
    setLocation(item.location ?? "");
    setColor(item.color ?? "sky");
    setRepeatType(item.repeat_type ?? "weekly");
    setMessage(
      linked.length > 1
        ? `같은 루틴 ${linked.length}개를 함께 수정할 수 있어요.`
        : "수정할 내용을 변경한 뒤 저장해 주세요."
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleSelectedDay = (day: string) => {
    setSelectedDays((prev) => {
      const exists = prev.includes(day);
      if (exists) {
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== day);
      }
      return sortDays([...prev, day]);
    });
  };

  function isTimeOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
    return aStart < bEnd && aEnd > bStart;
  }

  function hasConflict({
    items,
    selectedDays,
    dayOfWeek,
    repeatType,
    startTime,
    endTime,
    editingId,
    editingGroupIds,
  }: {
    items: TimetableRow[];
    selectedDays: string[];
    dayOfWeek: string;
    repeatType: string;
    startTime: string;
    endTime: string;
    editingId: string | null;
    editingGroupIds: string[];
  }) {
    let targetDays: string[] = [];

    if (repeatType === "weekday") {
      targetDays = ["monday", "tuesday", "wednesday", "thursday", "friday"];
    } else if (repeatType === "weekend") {
      targetDays = ["saturday", "sunday"];
    } else if (repeatType === "weekly") {
      targetDays = selectedDays;
    } else {
      targetDays = [dayOfWeek];
    }

    return items.some((item) => {
      if (editingId && item.id === editingId) return false;
      if (editingGroupIds.includes(item.id)) return false;
      if (!targetDays.includes(item.day_of_week)) return false;

      return isTimeOverlap(startTime, endTime, item.start_time, item.end_time);
    });
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedChildId) {
      setMessage("자녀를 먼저 선택해 주세요.");
      return;
    }
    if (!subject.trim()) {
      setMessage("과목 또는 일정명을 입력해 주세요.");
      return;
    }
    if (startTime >= endTime) {
      setMessage("종료 시간은 시작 시간보다 늦어야 해요.");
      return;
    }
    if (
      hasConflict({
        items,
        selectedDays,
        dayOfWeek,
        repeatType,
        startTime,
        endTime,
        editingId,
        editingGroupIds,
      })
    ) {
      setMessage("같은 시간대에 이미 등록된 일정이 있어요.");
      setSubmitting(false);
      return;
    }
    if (repeatType === "weekly" && selectedDays.length === 0) {
      setMessage("반복할 요일을 1개 이상 선택해 주세요.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    if (editingId) {
      const nextRows = buildTimetableRows({
        childId: selectedChildId,
        dayOfWeek,
        selectedDays,
        startTime,
        endTime,
        subject: subject.trim(),
        location: location.trim() || null,
        color,
        repeatType,
      });

      const desiredByDay = new Map(nextRows.map((row) => [row.day_of_week, row]));
      const currentGroup = items.filter((item) => editingGroupIds.includes(item.id));
      const currentByDay = new Map(currentGroup.map((row) => [row.day_of_week, row]));

      for (const [day, row] of desiredByDay.entries()) {
        const existing = currentByDay.get(day);
        if (existing) {
          const { error } = await supabase
            .from("timetables")
            .update({
              day_of_week: row.day_of_week,
              start_time: row.start_time,
              end_time: row.end_time,
              subject: row.subject,
              location: row.location,
              color: row.color,
              repeat_type: row.repeat_type,
            })
            .eq("id", existing.id);

          if (error) {
            console.error(error);
            setMessage(`시간표 수정에 실패했어요. (${error.message})`);
            setSubmitting(false);
            return;
          }
        }
      }

      const rowsToInsert = [...desiredByDay.entries()]
        .filter(([day]) => !currentByDay.has(day))
        .map(([, row]) => row);

      if (rowsToInsert.length > 0) {
        const { error } = await supabase.from("timetables").insert(rowsToInsert);
        if (error) {
          console.error(error);
          setMessage(`시간표 수정에 실패했어요. (${error.message})`);
          setSubmitting(false);
          return;
        }
      }

      const idsToDelete = [...currentByDay.entries()]
        .filter(([day]) => !desiredByDay.has(day))
        .map(([, row]) => row.id);

      if (idsToDelete.length > 0) {
        const { error } = await supabase.from("timetables").delete().in("id", idsToDelete);
        if (error) {
          console.error(error);
          setMessage(`시간표 수정에 실패했어요. (${error.message})`);
          setSubmitting(false);
          return;
        }
      }

      resetForm();
      setMessage("시간표를 수정했어요.");
      setSubmitting(false);
      await loadItems();
      return;
    }

    const rows = buildTimetableRows({
      childId: selectedChildId,
      dayOfWeek,
      selectedDays,
      startTime,
      endTime,
      subject: subject.trim(),
      location: location.trim() || null,
      color,
      repeatType,
    });

    const { error } = await supabase.from("timetables").insert(rows);
    if (error) {
      console.error(error);
      setMessage(`시간표 등록에 실패했어요. (${error.message})`);
      setSubmitting(false);
      return;
    }

    resetForm();
    if (repeatType === "weekly" && rows.length > 1) {
      setMessage(`${rows.length}개 요일에 시간표를 등록했어요.`);
    } else if (repeatType === "weekday") {
      setMessage("평일 시간표를 등록했어요.");
    } else if (repeatType === "weekend") {
      setMessage("주말 시간표를 등록했어요.");
    } else {
      setMessage("시간표를 등록했어요.");
    }

    setSubmitting(false);
    await loadItems();
  };

  const handleDelete = async (id: string) => {
    const ok = window.confirm("이 시간표를 삭제할까요?");
    if (!ok) return;

    const { error } = await supabase.from("timetables").delete().eq("id", id);
    if (error) {
      console.error(error);
      setMessage("삭제에 실패했어요.");
      return;
    }

    if (editingGroupIds.includes(id)) resetForm();
    setMessage("삭제했어요.");
    await loadItems();
  };

  const handleDeleteAll = async () => {
    if (!selectedChildId) {
      setMessage("자녀를 먼저 선택해 주세요.");
      return;
    }

    const ok = window.confirm(
      `${selectedChild?.name ?? "선택한 자녀"}의 기존 시간표를 전부 삭제할까요?\n삭제 후 다시 등록하면 돼요.`
    );
    if (!ok) return;

    setDeletingAll(true);
    setMessage("");

    const { error } = await supabase.from("timetables").delete().eq("child_id", selectedChildId);
    if (error) {
      console.error(error);
      setMessage(`전체 삭제에 실패했어요. (${error.message})`);
      setDeletingAll(false);
      return;
    }

    resetForm();
    setMessage("기존 시간표를 모두 삭제했어요.");
    setDeletingAll(false);
    await loadItems();
  };

  const monthSchedules = useMemo(
    () =>
      calendarDays.map((day) => ({
        ...day,
        schedules: items
          .filter((item) => matchesDateByRepeat(item, day.date))
          .sort((a, b) => a.start_time.localeCompare(b.start_time)),
      })),
    [calendarDays, items]
  );

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-bold text-gray-900">시간표 관리</h2>
        <p className="mt-1 text-sm text-gray-600">자녀별 시간표를 등록하고 관리할 수 있어요.</p>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <label className="mb-2 block text-sm font-medium text-gray-700">자녀 선택</label>
        <select
          value={selectedChildId}
          onChange={(e) => setSelectedChildId(e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-sky-500"
        >
          {children.length === 0 ? <option value="">등록된 자녀가 없어요</option> : null}
          {children.map((child) => (
            <option key={child.id} value={child.id}>
              {child.name}
            </option>
          ))}
        </select>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{editingId ? "시간표 수정" : "시간표 등록"}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {selectedChild
                ? editingId
                  ? `${selectedChild.name}의 시간표를 수정해요.`
                  : `${selectedChild.name}의 시간표를 등록해요.`
                : "자녀를 먼저 선택해 주세요."}
            </p>
          </div>

          <button
            type="button"
            onClick={handleDeleteAll}
            disabled={!selectedChildId || deletingAll}
            className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            {deletingAll ? "전체 삭제 중..." : "기존 시간표 모두 삭제"}
          </button>
        </div>

        <form onSubmit={handleCreate} className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">반복 설정</label>
            <select
              value={repeatType}
              onChange={(e) => setRepeatType(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-sky-500"
            >
              {REPEAT_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-gray-500">매주 반복은 요일 여러 개를 선택할 수 있어요.</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">과목 / 일정명</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="예: 영어학원"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-sky-500"
            />
          </div>

          {repeatType === "weekly" ? (
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">요일 여러 개 선택</label>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                {DAYS.map((day) => {
                  const active = selectedDays.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleSelectedDay(day.value)}
                      className={`rounded-xl border px-3 py-3 text-sm font-medium transition ${
                        active
                          ? "border-sky-500 bg-sky-50 text-sky-700"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {day.shortLabel}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-gray-500">선택된 요일마다 같은 시간표가 각각 등록돼요.</p>
            </div>
          ) : (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">요일</label>
              <select
                value={dayOfWeek}
                onChange={(e) => {
                  setDayOfWeek(e.target.value);
                  if (repeatType === "once") setSelectedDays([e.target.value]);
                }}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-sky-500"
              >
                {DAYS.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">시작 시간</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">종료 시간</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">장소</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="예: A학원 3층"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">선택 요일 요약</label>
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
              {getSelectedDaysSummary(repeatType, selectedDays, dayOfWeek)}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-gray-700">색상 선택</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {COLOR_OPTIONS.map((item) => {
                const active = color === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setColor(item.value)}
                    className={`rounded-xl border px-3 py-3 text-sm font-medium transition ${
                      active ? "border-gray-900 ring-2 ring-gray-200" : "border-gray-200 hover:border-gray-300"
                    } ${item.preview}`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-gray-700">색상 미리보기</label>
            <div className={`rounded-2xl border p-4 ${previewStyle}`}>
              <p className="text-sm font-semibold text-gray-900">{subject.trim() || "영어학원"}</p>
              <p className="mt-1 text-sm text-gray-700">
                {getRepeatPreviewLabel(repeatType, selectedDays, dayOfWeek)} · {startTime} ~ {endTime}
              </p>
              {location.trim() ? (
                <p className="mt-1 text-xs text-gray-500">{location.trim()}</p>
              ) : (
                <p className="mt-1 text-xs text-gray-500">장소 미입력</p>
              )}
            </div>
          </div>

          {message ? (
            <div className="md:col-span-2 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700">{message}</div>
          ) : null}

          <div className="md:col-span-2 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={submitting || !selectedChildId}
              className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (editingId ? "수정 중..." : "등록 중...") : editingId ? "시간표 수정 저장" : "시간표 등록"}
            </button>

            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                수정 취소
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">시간표 보기</h3>
            <p className="mt-1 text-sm text-gray-500">요일별 시간표와 월간 보기를 전환할 수 있어요.</p>
          </div>

          <div className="inline-flex rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${viewMode === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"}`}
            >
              요일별 시간표
            </button>
            <button
              type="button"
              onClick={() => setViewMode("month")}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${viewMode === "month" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"}`}
            >
              월간 보기
            </button>
          </div>
        </div>

        {viewMode === "list" ? (
          <div className="mt-6 space-y-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h4 className="text-base font-semibold text-gray-900">요일별 시간표</h4>
                <p className="mt-1 text-sm text-gray-500">
                  반복되는 요일별 일정을 실제 시작·종료 시간 기준으로 확인할 수 있어요.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {selectedChild ? <span className="text-sm text-gray-500">{selectedChild.name}</span> : null}
                <button
                  type="button"
                  onClick={() => setShowDayList((prev) => !prev)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  {showDayList ? "상세 목록 숨기기" : "상세 목록 보기"}
                </button>
              </div>
            </div>

            {loading ? (
              <p className="text-sm text-gray-500">불러오는 중...</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-gray-500">등록된 시간표가 없어요.</p>
            ) : (
              <>
                <div className="overflow-x-auto rounded-2xl border border-gray-200">
                  <div className="min-w-[980px] bg-white">
                    <div
                      className="grid border-b border-gray-200 bg-gray-50"
                      style={{ gridTemplateColumns: "72px repeat(7, minmax(0, 1fr))" }}
                    >
                      <div className="border-r border-gray-200 px-3 py-3 text-center text-xs font-semibold text-gray-500">
                        시간
                      </div>
                      {DAYS.map((day) => (
                        <div
                          key={day.value}
                          className={`border-r border-gray-200 px-2 py-3 text-center text-sm font-semibold last:border-r-0 ${
                            day.value === "sunday" || day.value === "saturday" ? "bg-gray-50 text-gray-600" : "text-gray-700"
                          }`}
                        >
                          {day.shortLabel}
                        </div>
                      ))}
                    </div>

                    <div
                      className="grid"
                      style={{ gridTemplateColumns: "72px repeat(7, minmax(0, 1fr))", minHeight: `${weeklyGridData.totalHeight + GRID_TOP_PADDING}px` }}
                    >
                      <div className="relative border-r border-gray-200 bg-gray-50" style={{ height: `${weeklyGridData.totalHeight + GRID_TOP_PADDING}px` }}>
                        {weeklyGridData.hourLines.map((minute, index) => {
                          const top = (minute - weeklyGridData.startMinute) * PX_PER_MINUTE + GRID_TOP_PADDING;
                          return (
                            <div
                              key={minute}
                              className="absolute left-0 right-0 border-t border-gray-200"
                              style={{ top: `${top}px` }}
                            >
                              <span
                                className={`absolute left-2 -translate-y-1/2 bg-gray-50 pr-1 text-xs ${
                                  index === 0 ? "text-gray-400" : "text-gray-500"
                                }`}
                              >
                                {formatMinutes(minute)}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {DAYS.map((day) => {
                        const dayItems = items
                          .filter((item) => item.day_of_week === day.value)
                          .sort((a, b) => a.start_time.localeCompare(b.start_time));

                        return (
                          <div
                            key={day.value}
                            className={`relative border-r border-gray-200 last:border-r-0 ${
                              day.value === "sunday" || day.value === "saturday" ? "bg-gray-50/50" : "bg-white"
                            }`}
                            style={{ height: `${weeklyGridData.totalHeight + GRID_TOP_PADDING}px` }}
                          >
                            {weeklyGridData.hourLines.map((minute) => {
                              const top = (minute - weeklyGridData.startMinute) * PX_PER_MINUTE + GRID_TOP_PADDING;
                              return (
                                <div
                                  key={`${day.value}-${minute}`}
                                  className="absolute left-0 right-0 border-t border-gray-200"
                                  style={{ top: `${top}px` }}
                                />
                              );
                            })}

                            {weeklyGridData.halfHourLines.map((minute) => {
                              const top = (minute - weeklyGridData.startMinute) * PX_PER_MINUTE + GRID_TOP_PADDING;
                              return (
                                <div
                                  key={`${day.value}-${minute}-half`}
                                  className="absolute left-0 right-0 border-t border-dashed border-gray-100"
                                  style={{ top: `${top}px` }}
                                />
                              );
                            })}

                            {dayItems.map((item) => {
                              const top = (timeToMinutes(item.start_time) - weeklyGridData.startMinute) * PX_PER_MINUTE + GRID_TOP_PADDING;
                              const height = Math.max(
                                (timeToMinutes(item.end_time) - timeToMinutes(item.start_time)) * PX_PER_MINUTE,
                                52
                              );

                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => handleEdit(item)}
                                  className={`absolute left-1.5 right-1.5 overflow-hidden rounded-xl border p-2 text-left shadow-sm transition hover:shadow-md ${getColorCardClass(item.color)}`}
                                  style={{ top: `${top}px`, height: `${height}px` }}
                                >
                                  <div className="pr-10">
                                    <p className="truncate text-xs font-semibold text-gray-900">{item.subject}</p>
                                    <p className="mt-1 text-[11px] text-gray-700">
                                      {item.start_time} ~ {item.end_time}
                                    </p>
                                    {item.location ? (
                                      <p className="mt-1 truncate text-[10px] text-gray-500">{item.location}</p>
                                    ) : null}
                                  </div>

                                  <div className="absolute right-1.5 top-1.5 flex gap-1">
                                    <span className="rounded-md border border-white/80 bg-white/80 px-1.5 py-0.5 text-[10px] text-gray-600">
                                      수정
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {showDayList ? (
                  <div className="space-y-3">
                    <div className="rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-500">
                      블록형 시간표 아래에서 요일별 상세 목록을 함께 확인할 수 있어요.
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      {groupedItems.map((day) => (
                        <div key={day.value} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                          <div className="flex items-center justify-between">
                            <h5 className="text-sm font-semibold text-gray-800">{day.label}</h5>
                            <span className="text-xs text-gray-400">{day.items.length}개</span>
                          </div>

                          {day.items.length === 0 ? (
                            <p className="mt-3 text-sm text-gray-400">등록된 일정이 없어요.</p>
                          ) : (
                            <div className="mt-3 space-y-2">
                              {day.items.map((item) => (
                                <div
                                  key={`${day.value}-${item.id}`}
                                  className={`rounded-xl border p-3 ${getColorCardClass(item.color)}`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="text-sm font-semibold text-gray-900">{item.subject}</p>
                                      <p className="mt-1 text-xs text-gray-700">{item.start_time} ~ {item.end_time}</p>
                                      {item.location ? <p className="mt-1 text-xs text-gray-500">{item.location}</p> : null}
                                    </div>
                                    <div className="flex gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleEdit(item)}
                                        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-50"
                                      >
                                        수정
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDelete(item.id)}
                                        className="rounded-md border border-red-200 bg-white px-2 py-1 text-[11px] text-red-600 hover:bg-red-50"
                                      >
                                        삭제
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>
        ) : (
          <div className="mt-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
                >
                  이전달
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
                >
                  다음달
                </button>
              </div>

              <div className="text-base font-semibold text-gray-900">{monthLabel}</div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {WEEKDAY_HEADERS.map((label) => (
                <div key={label} className="rounded-lg bg-gray-50 px-2 py-2 text-center text-xs font-semibold text-gray-500">
                  {label}
                </div>
              ))}

              {monthSchedules.map((day) => (
                <div
                  key={day.key}
                  className={`min-h-[150px] rounded-xl border p-2 ${day.isCurrentMonth ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50"}`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className={`text-sm font-semibold ${day.isCurrentMonth ? "text-gray-900" : "text-gray-400"}`}>
                      {day.date.getDate()}
                    </span>
                    {day.schedules.length > 0 ? <span className="text-[10px] text-gray-400">{day.schedules.length}개</span> : null}
                  </div>

                  <div className="space-y-1.5">
                    {day.schedules.slice(0, 4).map((item) => (
                      <div key={`${day.key}-${item.id}`} className={`rounded-lg border px-2 py-2 ${getColorCardClass(item.color)}`}>
                        <p className="truncate text-[11px] font-semibold text-gray-900">{item.subject}</p>
                        <p className="mt-0.5 text-[10px] text-gray-600">{item.start_time} ~ {item.end_time}</p>
                        <div className="mt-1 flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleEdit(item)}
                            className="rounded border border-gray-300 px-1.5 py-0.5 text-[10px] text-gray-700 hover:bg-white"
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="rounded border border-red-200 px-1.5 py-0.5 text-[10px] text-red-600 hover:bg-red-50"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ))}

                    {day.schedules.length > 4 ? (
                      <p className="text-[10px] text-gray-400">+ {day.schedules.length - 4}개 더 있음</p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-500">
              월간 보기에서는 반복 유형에 맞춰 해당 달의 날짜에 시간표가 펼쳐져 보여요.
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function buildTimetableRows({
  childId,
  dayOfWeek,
  selectedDays,
  startTime,
  endTime,
  subject,
  location,
  color,
  repeatType,
}: {
  childId: string;
  dayOfWeek: string;
  selectedDays: string[];
  startTime: string;
  endTime: string;
  subject: string;
  location: string | null;
  color: string;
  repeatType: string;
}) {
  const base = {
    child_id: childId,
    start_time: startTime,
    end_time: endTime,
    subject,
    location,
    color,
    repeat_type: repeatType,
  };

  if (repeatType === "weekday") {
    return ["monday", "tuesday", "wednesday", "thursday", "friday"].map((day) => ({ ...base, day_of_week: day }));
  }
  if (repeatType === "weekend") {
    return ["saturday", "sunday"].map((day) => ({ ...base, day_of_week: day }));
  }
  if (repeatType === "weekly") {
    return selectedDays.map((day) => ({ ...base, day_of_week: day }));
  }
  return [{ ...base, day_of_week: dayOfWeek }];
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
      key: current.toISOString().slice(0, 10),
      date: current,
      isCurrentMonth: current.getMonth() === baseMonth.getMonth(),
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

function matchesDateByRepeat(item: TimetableRow, date: Date) {
  const dateDay = getDayKeyFromDate(date);

  if (item.repeat_type === "weekday") {
    return ["monday", "tuesday", "wednesday", "thursday", "friday"].includes(dateDay);
  }
  if (item.repeat_type === "weekend") {
    return ["saturday", "sunday"].includes(dateDay);
  }
  return item.day_of_week === dateDay;
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

function sortDays(days: string[]) {
  return [...new Set(days)].sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));
}

function timeToMinutes(t: string) {
  const [hour, minute] = t.split(":").map(Number);
  return hour * 60 + minute;
}

function formatMinutes(totalMinutes: number) {
  const hour = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minute = (totalMinutes % 60).toString().padStart(2, "0");
  return `${hour}:${minute}`;
}

function buildWeeklyGridData(items: TimetableRow[]) {
  if (items.length === 0) {
    const startMinute = 8 * 60;
    const endMinute = 20 * 60;
    return {
      startMinute,
      endMinute,
      totalHeight: (endMinute - startMinute) * PX_PER_MINUTE,
      hourLines: buildHourLines(startMinute, endMinute),
      halfHourLines: buildHalfHourLines(startMinute, endMinute),
    };
  }

  const minutes = items.flatMap((item) => [timeToMinutes(item.start_time), timeToMinutes(item.end_time)]);
  const minMinute = Math.min(...minutes);
  const maxMinute = Math.max(...minutes);
  const startMinute = Math.max(Math.floor((minMinute - 30) / 60) * 60, 6 * 60);
  const endMinute = Math.min(Math.ceil((maxMinute + 30) / 60) * 60, 24 * 60);

  return {
    startMinute,
    endMinute,
    totalHeight: Math.max((endMinute - startMinute) * PX_PER_MINUTE, 480),
    hourLines: buildHourLines(startMinute, endMinute),
    halfHourLines: buildHalfHourLines(startMinute, endMinute),
  };
}

function buildHourLines(startMinute: number, endMinute: number) {
  const lines: number[] = [];
  for (let minute = startMinute; minute <= endMinute; minute += 60) {
    lines.push(minute);
  }
  return lines;
}

function buildHalfHourLines(startMinute: number, endMinute: number) {
  const lines: number[] = [];
  for (let minute = startMinute + 30; minute < endMinute; minute += 60) {
    lines.push(minute);
  }
  return lines;
}

function getColorCardClass(color: string | null) {
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

function getSelectedDaysSummary(repeatType: string, selectedDays: string[], dayOfWeek: string) {
  if (repeatType === "weekday") return "월요일, 화요일, 수요일, 목요일, 금요일";
  if (repeatType === "weekend") return "토요일, 일요일";
  if (repeatType === "once") return dayLabelMap[dayOfWeek] ?? "선택 요일";

  return selectedDays.map((day) => dayLabelMap[day]).filter(Boolean).join(", ");
}

function getRepeatPreviewLabel(repeatType: string, selectedDays: string[], dayOfWeek: string) {
  if (repeatType === "weekday") return "평일 반복";
  if (repeatType === "weekend") return "주말 반복";
  if (repeatType === "once") return `${dayLabelMap[dayOfWeek] ?? "선택 요일"} 1회성`;

  const labels = selectedDays
    .map((day) => DAYS.find((item) => item.value === day)?.shortLabel)
    .filter(Boolean)
    .join("/");

  return labels ? `${labels} 매주` : "요일 선택";
}
