"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

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

type Props = {
  children: ChildRow[];
  todoItems: TodoRow[];
};

const repeatLabelMap: Record<string, string> = {
  none: "반복 없음",
  daily: "매일 반복",
  weekly: "매주 반복",
};

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sortByDueDateAsc(a: TodoRow, b: TodoRow) {
  const aDate = a.due_date ?? "9999-12-31";
  const bDate = b.due_date ?? "9999-12-31";
  return aDate.localeCompare(bDate);
}

export default function ParentTodoClient({ children, todoItems }: Props) {
  const router = useRouter();

  const [selectedChildId, setSelectedChildId] = useState(children[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [memo, setMemo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [rewardPoints, setRewardPoints] = useState("100");
  const [repeatType, setRepeatType] = useState("none");
  const [repeatUntil, setRepeatUntil] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const today = getTodayString();

  const childNameMap = useMemo(() => {
    const map = new Map<string, string>();
    children.forEach((child) => map.set(child.id, child.name));
    return map;
  }, [children]);

  const handleCreate = async () => {
    setMessage("");

    if (!selectedChildId) {
      setMessage("자녀를 먼저 선택해 주세요.");
      return;
    }

    if (!title.trim()) {
      setMessage("할 일 제목을 입력해 주세요.");
      return;
    }

    const points = Number(rewardPoints);
    if (!Number.isFinite(points) || points < 0) {
      setMessage("보상 포인트를 올바르게 입력해 주세요.");
      return;
    }

    if ((repeatType === "daily" || repeatType === "weekly") && !dueDate) {
      setMessage("반복 할 일은 시작 기준이 되는 마감일을 입력해 주세요.");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("todos").insert({
      child_id: selectedChildId,
      title: title.trim(),
      memo: memo.trim() || null,
      due_date: dueDate || null,
      reward_points: points,
      repeat_type: repeatType,
      repeat_until: repeatUntil || null,
      completed: false,
    });

    if (error) {
      console.error(error);
      setMessage(`할 일 등록에 실패했어요. (${error.message})`);
      setSubmitting(false);
      return;
    }

    setTitle("");
    setMemo("");
    setDueDate("");
    setRewardPoints("100");
    setRepeatType("none");
    setRepeatUntil("");
    setSubmitting(false);
    setMessage("할 일을 등록했어요.");
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    const ok = window.confirm("이 할 일을 삭제할까요?");
    if (!ok) return;

    const { error } = await supabase.from("todos").delete().eq("id", id);

    if (error) {
      console.error(error);
      setMessage(`삭제에 실패했어요. (${error.message})`);
      return;
    }

    setMessage("할 일을 삭제했어요.");
    router.refresh();
  };

  const handleReset = async (id: string) => {
    const ok = window.confirm("완료 상태를 다시 미완료로 바꿀까요?");
    if (!ok) return;

    const { error } = await supabase
      .from("todos")
      .update({
        completed: false,
        completed_at: null,
      })
      .eq("id", id);

    if (error) {
      console.error(error);
      setMessage(`상태 변경에 실패했어요. (${error.message})`);
      return;
    }

    setMessage("미완료 상태로 되돌렸어요.");
    router.refresh();
  };

  const pendingItems = useMemo(
    () => todoItems.filter((item) => !item.completed),
    [todoItems]
  );

  const todayItems = useMemo(
    () =>
      pendingItems
        .filter((item) => !item.due_date || item.due_date <= today)
        .sort(sortByDueDateAsc),
    [pendingItems, today]
  );

  const upcomingItems = useMemo(
    () =>
      pendingItems
        .filter((item) => item.due_date && item.due_date > today)
        .sort(sortByDueDateAsc),
    [pendingItems, today]
  );

  const completedItems = useMemo(
    () => todoItems.filter((item) => item.completed),
    [todoItems]
  );

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">할 일 / 보상</h1>
        <p className="mt-2 text-sm text-gray-600">
          자녀별 할 일을 등록하고 오늘 할 일, 예정된 할 일, 완료된 할 일을 구분해서 볼 수 있어요.
        </p>
      </section>

      {message ? (
        <section className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-700">
          {message}
        </section>
      ) : null}

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">할 일 등록</h2>

        {children.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">먼저 자녀를 등록해 주세요.</p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                자녀 선택
              </label>
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-sky-500"
              >
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                보상 포인트
              </label>
              <input
                type="number"
                min={0}
                value={rewardPoints}
                onChange={(e) => setRewardPoints(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-sky-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                할 일 제목
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 영어 숙제하기"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-sky-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                메모
              </label>
              <input
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="예: 교재 12~14쪽"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                마감일
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                반복 설정
              </label>
              <select
                value={repeatType}
                onChange={(e) => setRepeatType(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-sky-500"
              >
                <option value="none">반복 없음</option>
                <option value="daily">매일 반복</option>
                <option value="weekly">매주 반복</option>
              </select>
            </div>

            {repeatType !== "none" ? (
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  반복 종료일 (선택)
                </label>
                <input
                  type="date"
                  value={repeatUntil}
                  onChange={(e) => setRepeatUntil(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-sky-500"
                />
                <p className="mt-2 text-xs text-gray-500">
                  비워두면 계속 반복돼요.
                </p>
              </div>
            ) : null}

            <div className="md:col-span-2">
              <button
                type="button"
                onClick={handleCreate}
                disabled={submitting}
                className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
              >
                {submitting ? "등록 중..." : "할 일 등록"}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">오늘 진행 중인 할 일</h2>
          <span className="rounded-full bg-violet-50 px-2 py-1 text-xs text-violet-600">
            {todayItems.length}개
          </span>
        </div>

        {todayItems.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">오늘 진행 중인 할 일이 없어요.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {todayItems.map((item) => (
              <div key={item.id} className="rounded-xl border border-gray-200 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {childNameMap.get(item.child_id) ?? "자녀"}
                    </p>
                    <p className="mt-1 text-base font-medium text-gray-900">{item.title}</p>
                    {item.memo ? (
                      <p className="mt-1 text-sm text-gray-600">{item.memo}</p>
                    ) : null}
                    <p className="mt-2 text-xs text-gray-500">
                      보상 {item.reward_points}P
                      {item.due_date ? ` · 마감일 ${item.due_date}` : ""}
                      {item.repeat_type !== "none"
                        ? ` · ${repeatLabelMap[item.repeat_type] ?? item.repeat_type}`
                        : ""}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="rounded-xl border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">예정된 할 일</h2>
          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
            {upcomingItems.length}개
          </span>
        </div>

        {upcomingItems.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">예정된 할 일이 없어요.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {upcomingItems.map((item) => (
              <div key={item.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {childNameMap.get(item.child_id) ?? "자녀"}
                    </p>
                    <p className="mt-1 text-base font-medium text-gray-800">{item.title}</p>
                    {item.memo ? (
                      <p className="mt-1 text-sm text-gray-600">{item.memo}</p>
                    ) : null}
                    <p className="mt-2 text-xs text-gray-500">
                      보상 {item.reward_points}P
                      {item.due_date ? ` · 예정일 ${item.due_date}` : ""}
                      {item.repeat_type !== "none"
                        ? ` · ${repeatLabelMap[item.repeat_type] ?? item.repeat_type}`
                        : ""}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="rounded-xl border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">완료된 할 일</h2>
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-600">
            {completedItems.length}개
          </span>
        </div>

        {completedItems.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">완료된 할 일이 없어요.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {completedItems.map((item) => (
              <div key={item.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {childNameMap.get(item.child_id) ?? "자녀"}
                    </p>
                    <p className="mt-1 text-base font-medium text-gray-700">{item.title}</p>
                    <p className="mt-2 text-xs text-gray-500">
                      보상 {item.reward_points}P
                      {item.completed_at
                        ? ` · 완료 ${new Date(item.completed_at).toLocaleString("ko-KR")}`
                        : ""}
                      {item.repeat_type !== "none"
                        ? ` · ${repeatLabelMap[item.repeat_type] ?? item.repeat_type}`
                        : ""}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleReset(item.id)}
                    className="rounded-xl border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-white"
                  >
                    미완료로 변경
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}