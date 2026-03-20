"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  CheckSquare,
  Clock3,
  Coins,
  CalendarDays,
  ChevronRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import ChildPageHeader from "../ChildPageHeader";

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

type Props = {
  childId: string;
  initialItems: TodoRow[];
};

const repeatLabelMap: Record<string, string> = {
  none: "반복 없음",
  daily: "매일 반복",
  weekly: "매주 반복",
};

function toDateStringLocal(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTodayInfo() {
  const now = new Date();
  const dayLabel = ["일", "월", "화", "수", "목", "금", "토"][now.getDay()];

  return {
    today: toDateStringLocal(now),
    dateText: `${now.getMonth() + 1}월 ${now.getDate()}일`,
    dayLabel,
  };
}

function addDays(dateString: string, days: number) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toDateStringLocal(date);
}

function sortByDueDateAsc(a: TodoRow, b: TodoRow) {
  const aDate = a.due_date ?? "9999-12-31";
  const bDate = b.due_date ?? "9999-12-31";
  return aDate.localeCompare(bDate);
}

function formatDate(dateString?: string | null) {
  if (!dateString) return "";
  const date = new Date(`${dateString}T00:00:00`);
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function formatDateTime(dateString?: string | null) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleString("ko-KR", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChildTodoClient({ childId, initialItems }: Props) {
  const router = useRouter();
  const todayInfo = useMemo(() => getTodayInfo(), []);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [showAllCompleted, setShowAllCompleted] = useState(false);

  const pendingItems = useMemo(
    () => initialItems.filter((item) => !item.completed),
    [initialItems]
  );

  const availableItems = useMemo(
    () =>
      pendingItems
        .filter((item) => !item.due_date || item.due_date <= todayInfo.today)
        .sort(sortByDueDateAsc),
    [pendingItems, todayInfo.today]
  );

  const upcomingItems = useMemo(
    () =>
      pendingItems
        .filter((item) => item.due_date && item.due_date > todayInfo.today)
        .sort(sortByDueDateAsc),
    [pendingItems, todayInfo.today]
  );

  const completedItems = useMemo(
    () =>
      [...initialItems]
        .filter((item) => item.completed)
        .sort((a, b) => {
          const aDate = a.completed_at ?? a.created_at;
          const bDate = b.completed_at ?? b.created_at;
          return bDate.localeCompare(aDate);
        }),
    [initialItems]
  );

  const visibleCompletedItems = useMemo(() => {
    return showAllCompleted ? completedItems : completedItems.slice(0, 5);
  }, [completedItems, showAllCompleted]);

  const totalEarnableToday = useMemo(() => {
    return availableItems.reduce(
      (sum, item) => sum + (item.reward_points ?? 0),
      0
    );
  }, [availableItems]);

  async function handleComplete(item: TodoRow) {
    if (item.due_date && item.due_date > todayInfo.today) {
      setMessage("아직 오늘 완료할 수 있는 할 일이 아니에요.");
      return;
    }

    const ok = window.confirm(`"${item.title}" 할 일을 완료할까요?`);
    if (!ok) return;

    setCompletingId(item.id);
    setMessage("");

    const completedAt = new Date().toISOString();

    const { data: updatedRows, error: todoError } = await supabase
      .from("todos")
      .update({
        completed: true,
        completed_at: completedAt,
      })
      .eq("id", item.id)
      .eq("completed", false)
      .select("id");

    if (todoError) {
      console.error(todoError);
      setMessage(`할 일 완료 처리에 실패했어요. (${todoError.message})`);
      setCompletingId(null);
      return;
    }

    if (!updatedRows || updatedRows.length === 0) {
      setMessage("이미 완료된 할 일이에요.");
      setCompletingId(null);
      router.refresh();
      return;
    }

    if (item.reward_points > 0) {
      const { error: pointError } = await supabase.from("point_histories").insert({
        child_id: childId,
        type: "earn",
        points: item.reward_points,
        description: `할 일 완료: ${item.title}`,
      });

      if (pointError) {
        console.error(pointError);
        setMessage(
          `완료는 되었지만 포인트 적립에 실패했어요. (${pointError.message})`
        );
        setCompletingId(null);
        router.refresh();
        return;
      }
    }

    if (item.repeat_type !== "none" && item.due_date) {
      let nextDueDate = item.due_date;

      if (item.repeat_type === "daily") {
        nextDueDate = addDays(item.due_date, 1);
      } else if (item.repeat_type === "weekly") {
        nextDueDate = addDays(item.due_date, 7);
      }

      const shouldCreateNext =
        !item.repeat_until || nextDueDate <= item.repeat_until;

      if (shouldCreateNext) {
        const { error: nextTodoError } = await supabase.from("todos").insert({
          child_id: item.child_id,
          title: item.title,
          memo: item.memo,
          due_date: nextDueDate,
          reward_points: item.reward_points,
          repeat_type: item.repeat_type,
          repeat_until: item.repeat_until,
          completed: false,
        });

        if (nextTodoError) {
          console.error(nextTodoError);
          setMessage(
            `완료는 되었지만 다음 반복 할 일 생성에 실패했어요. (${nextTodoError.message})`
          );
          setCompletingId(null);
          router.refresh();
          return;
        }
      }
    }

    setMessage(
      item.reward_points > 0
        ? `${item.title} 완료! ${item.reward_points}P가 적립되었어요.`
        : `${item.title} 완료!`
    );

    setCompletingId(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <ChildPageHeader
        title="내 할 일"
        description="오늘 가능한 할 일부터 차근차근 완료해요."
        tone="todo"
        rightSlot={
          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[520px]">
            <MiniSummaryCard
              icon={<CheckSquare className="h-4 w-4" />}
              title="오늘 가능한 할 일"
              value={`${availableItems.length}개`}
            />
            <MiniSummaryCard
              icon={<Clock3 className="h-4 w-4" />}
              title="예정된 할 일"
              value={`${upcomingItems.length}개`}
            />
            <MiniSummaryCard
              icon={<Coins className="h-4 w-4" />}
              title="오늘 받을 수 있는 포인트"
              value={
                totalEarnableToday > 0
                  ? `${totalEarnableToday.toLocaleString()}P`
                  : "오늘은 포인트 없음"
              }
            />
          </div>
        }
      />

      {message ? (
        <section className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
          {message}
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          icon={<CheckSquare className="h-5 w-5" />}
          title="진행 중"
          value={`${availableItems.length}개`}
          desc="오늘 바로 완료 가능"
        />
        <SummaryCard
          icon={<CalendarDays className="h-5 w-5" />}
          title="예정됨"
          value={`${upcomingItems.length}개`}
          desc="앞으로 할 예정"
        />
        <SummaryCard
          icon={<CheckSquare className="h-5 w-5" />}
          title="완료함"
          value={`${completedItems.length}개`}
          desc="지금까지 완료한 할 일"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Panel
            title="오늘 진행 중인 할 일"
            icon={<CheckSquare className="h-5 w-5" />}
            badge={`${availableItems.length}개`}
          >
            {availableItems.length === 0 ? (
              <EmptyState
                text={
                  upcomingItems.length > 0
                    ? "오늘 가능한 할 일은 없어요. 예정된 할 일을 기다려 주세요."
                    : "오늘 할 일을 모두 완료했어요 🎉"
                }
              />
            ) : (
              <div className="space-y-3">
                {availableItems.map((item, index) => {
                  const isCompleting = completingId === item.id;

                  return (
                    <TodoCard
                      key={item.id}
                      index={index + 1}
                      title={item.title}
                      memo={item.memo}
                      dueDate={item.due_date}
                      rewardPoints={item.reward_points}
                      repeatType={item.repeat_type}
                      action={
                        <button
                          type="button"
                          onClick={() => handleComplete(item)}
                          disabled={isCompleting}
                          className="w-full rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isCompleting ? "완료 처리 중..." : "완료했어요"}
                        </button>
                      }
                    />
                  );
                })}
              </div>
            )}
          </Panel>

          <Panel
            title="완료한 할 일"
            icon={<CheckSquare className="h-5 w-5" />}
            badge={`${completedItems.length}개`}
          >
            {completedItems.length === 0 ? (
              <EmptyState text="아직 완료한 할 일이 없어요." />
            ) : (
              <div className="space-y-3">
                {visibleCompletedItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                          {item.title}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
                          {item.completed_at ? (
                            <span>완료 {formatDateTime(item.completed_at)}</span>
                          ) : null}
                          {item.repeat_type !== "none" ? (
                            <span>
                              {repeatLabelMap[item.repeat_type] ?? item.repeat_type}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {item.reward_points > 0 ? (
                        <div className="shrink-0 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                          +{item.reward_points.toLocaleString()}P
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}

                {completedItems.length > 5 ? (
                  <button
                    type="button"
                    onClick={() => setShowAllCompleted((prev) => !prev)}
                    className="w-full rounded-xl border border-gray-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                  >
                    {showAllCompleted
                      ? "접기"
                      : `완료한 할 일 ${completedItems.length - 5}개 더보기`}
                  </button>
                ) : null}
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel
            title="예정된 할 일"
            icon={<Clock3 className="h-5 w-5" />}
            badge={`${upcomingItems.length}개`}
          >
            {upcomingItems.length === 0 ? (
              <EmptyState text="예정된 할 일이 없어요." />
            ) : (
              <div className="space-y-3">
                {upcomingItems.map((item, index) => (
                  <TodoCard
                    key={item.id}
                    index={index + 1}
                    title={item.title}
                    memo={item.memo}
                    dueDate={item.due_date}
                    rewardPoints={item.reward_points}
                    repeatType={item.repeat_type}
                    muted
                    action={
                      <button
                        type="button"
                        disabled
                        className="w-full rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-500"
                      >
                        {item.due_date
                          ? `${formatDate(item.due_date)}에 완료할 수 있어요`
                          : "해당 날짜에 완료할 수 있어요"}
                      </button>
                    }
                  />
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
                <h2 className="text-lg font-bold text-slate-900">도움말</h2>
                <p className="text-sm text-slate-500">할 일 사용 방법을 확인해요.</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <InfoBox
                title="오늘 가능한 일만 완료할 수 있어요"
                desc="예정된 할 일은 날짜가 되면 완료 버튼이 활성화돼요."
              />
              <InfoBox
                title="반복 할 일은 다음 일정이 자동으로 생겨요"
                desc="매일/매주 반복으로 등록된 할 일은 완료 후 다음 할 일이 만들어져요."
              />
              <InfoBox
                title="포인트는 완료 후 바로 적립돼요"
                desc="보상이 있는 할 일은 완료하면 포인트 내역에 바로 반영돼요."
              />
            </div>
          </section>
        </div>
      </section>
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
      <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{desc}</p>
    </div>
  );
}

function MiniSummaryCard({
  icon,
  title,
  value,
}: {
  icon: ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
      <div className="flex items-center gap-2 text-slate-600">
        {icon}
        <span className="text-xs font-medium">{title}</span>
      </div>
      <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>
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

function TodoCard({
  index,
  title,
  memo,
  dueDate,
  rewardPoints,
  repeatType,
  action,
  muted = false,
}: {
  index: number;
  title: string;
  memo: string | null;
  dueDate: string | null;
  rewardPoints: number;
  repeatType: string;
  action: ReactNode;
  muted?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 ${
        muted ? "border-gray-200 bg-slate-50" : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
          {index}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{title}</p>

              {memo ? (
                <p className="mt-1 truncate text-xs text-slate-500">{memo}</p>
              ) : (
                <p className="mt-1 text-xs text-slate-400">할 일 메모 없음</p>
              )}

              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
                {dueDate ? <span>날짜 {formatDate(dueDate)}</span> : <span>날짜 자유</span>}
                {repeatType !== "none" ? (
                  <span>{repeatLabelMap[repeatType] ?? repeatType}</span>
                ) : null}
              </div>
            </div>

            {rewardPoints > 0 ? (
              <div className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                {rewardPoints.toLocaleString()}P
              </div>
            ) : null}
          </div>

          <div className="mt-3">{action}</div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
      {text}
    </div>
  );
}

function InfoBox({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-gray-200 px-4 py-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{desc}</p>
    </div>
  );
}