"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type ChildRow = {
  id: string;
  name: string;
};

type ParentGoalRow = {
  id: string;
  child_id: string;
  title: string;
  target_points: number;
  reward: string | null;
  achieved: boolean;
  achieved_at: string | null;
  reward_given: boolean;
  reward_given_at: string | null;
  created_at: string;
};

type ChildGoalRow = {
  id: string;
  child_id: string;
  title: string;
  description: string | null;
  reason: string | null;
  reward_note: string | null;
  status: "active" | "completed" | "paused";
  is_shared: boolean;
  created_at: string;
  updated_at: string;
};

type Props = {
  children: ChildRow[];
  goals: ParentGoalRow[];
  childGoals: ChildGoalRow[];
  pointTotals: Record<string, number>;
};

function statusLabel(status: ChildGoalRow["status"]) {
  if (status === "completed") return "완료";
  if (status === "paused") return "잠시 보류";
  return "도전 중";
}

function statusClassName(status: ChildGoalRow["status"]) {
  if (status === "completed") {
    return "bg-emerald-50 text-emerald-700";
  }
  if (status === "paused") {
    return "bg-amber-50 text-amber-700";
  }
  return "bg-violet-50 text-violet-700";
}

export default function ParentGoalClient({
  children,
  goals,
  childGoals,
  pointTotals,
}: Props) {
  const router = useRouter();

  const [childId, setChildId] = useState(children[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [reward, setReward] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const childNameMap = useMemo(() => {
    const map = new Map<string, string>();
    children.forEach((child) => map.set(child.id, child.name));
    return map;
  }, [children]);

  const needRewardGoals = goals.filter((goal) => goal.achieved && !goal.reward_given);
  const completedRewardGoals = goals.filter((goal) => goal.achieved && goal.reward_given);
  const activeChildGoals = childGoals.filter((goal) => goal.status === "active");
  const completedChildGoals = childGoals.filter((goal) => goal.status === "completed");

  const handleCreate = async () => {
    setMessage("");

    if (!childId) {
      setMessage("자녀를 먼저 선택해 주세요.");
      return;
    }

    if (!title.trim()) {
      setMessage("목표 이름을 입력해 주세요.");
      return;
    }

    const targetNumber = Number(target);

    if (!Number.isFinite(targetNumber) || targetNumber <= 0) {
      setMessage("목표 포인트를 올바르게 입력해 주세요.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("point_goals").insert({
      child_id: childId,
      title: title.trim(),
      target_points: targetNumber,
      reward: reward.trim() || null,
    });

    setSaving(false);

    if (error) {
      console.error(error);
      setMessage(`목표 추가에 실패했어요. (${error.message})`);
      return;
    }

    setTitle("");
    setTarget("");
    setReward("");
    setMessage("부모 목표를 추가했어요.");
    router.refresh();
  };

  const handleRewardGiven = async (goalId: string) => {
    setMessage("");
    setProcessingId(goalId);

    const { error } = await supabase
      .from("point_goals")
      .update({
        reward_given: true,
        reward_given_at: new Date().toISOString(),
      })
      .eq("id", goalId);

    setProcessingId(null);

    if (error) {
      console.error(error);
      setMessage(`보상 지급 처리에 실패했어요. (${error.message})`);
      return;
    }

    setMessage("보상 지급 완료로 표시했어요.");
    router.refresh();
  };

  const handleDelete = async (goalId: string) => {
    const ok = window.confirm("이 부모 목표를 삭제할까요?");
    if (!ok) return;

    const { error } = await supabase.from("point_goals").delete().eq("id", goalId);

    if (error) {
      console.error(error);
      setMessage(`목표 삭제에 실패했어요. (${error.message})`);
      return;
    }

    setMessage("목표를 삭제했어요.");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">목표 관리</h1>
        <p className="mt-2 text-sm text-gray-600">
          부모가 정해주는 포인트 목표와 아이가 직접 적은 목표를 한 곳에서 볼 수 있어요.
        </p>
      </section>

      {message ? (
        <section className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-700">
          {message}
        </section>
      ) : null}

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">부모 목표 추가</h2>

        {children.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">먼저 자녀를 등록해 주세요.</p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">자녀 선택</label>
              <select
                value={childId}
                onChange={(e) => setChildId(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-sky-500"
              >
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
              <p className="text-gray-500">현재 포인트</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{pointTotals[childId] ?? 0}P</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">목표 이름</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 3000P 모아 레고 사기"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">목표 포인트</label>
              <input
                type="number"
                min={1}
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="예: 3000"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-sky-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">보상 내용</label>
              <input
                value={reward}
                onChange={(e) => setReward(e.target.value)}
                placeholder="예: 레고 한 세트"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-sky-500"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="button"
                onClick={handleCreate}
                disabled={saving}
                className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
              >
                {saving ? "추가 중..." : "부모 목표 추가"}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">아이가 직접 적은 목표</h2>
          <div className="flex gap-2">
            <span className="rounded-full bg-violet-50 px-2 py-1 text-xs text-violet-700">
              도전 중 {activeChildGoals.length}
            </span>
            <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
              완료 {completedChildGoals.length}
            </span>
          </div>
        </div>

        {childGoals.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">아직 아이가 직접 적은 목표가 없어요.</p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {childGoals.map((goal) => (
              <div key={goal.id} className="rounded-2xl border border-violet-100 bg-violet-50/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {childNameMap.get(goal.child_id) ?? "자녀"}
                    </p>
                    <p className="mt-1 text-base font-semibold text-gray-900">{goal.title}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs ${statusClassName(goal.status)}`}>
                    {statusLabel(goal.status)}
                  </span>
                </div>

                {goal.description ? (
                  <p className="mt-3 text-sm text-gray-700">{goal.description}</p>
                ) : null}

                {goal.reason ? (
                  <p className="mt-2 text-sm text-gray-600">이유: {goal.reason}</p>
                ) : null}

                {goal.reward_note ? (
                  <p className="mt-1 text-sm text-gray-600">원하는 보상: {goal.reward_note}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">보상 지급이 필요한 부모 목표</h2>
          <span className="rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-700">
            {needRewardGoals.length}건
          </span>
        </div>

        {needRewardGoals.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">지금은 보상 지급이 필요한 목표가 없어요.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {needRewardGoals.map((goal) => (
              <div key={goal.id} className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {childNameMap.get(goal.child_id) ?? "자녀"}
                    </p>
                    <p className="mt-1 text-base font-medium text-gray-900">{goal.title}</p>
                    <p className="mt-1 text-sm text-gray-600">
                      목표 {goal.target_points}P
                      {goal.reward ? ` · 보상 ${goal.reward}` : ""}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRewardGiven(goal.id)}
                    disabled={processingId === goal.id}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {processingId === goal.id ? "처리 중..." : "보상 지급 완료"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">전체 부모 목표 목록</h2>

        {goals.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">등록된 부모 목표가 없어요.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {goals.map((goal) => (
              <div key={goal.id} className="rounded-xl border border-gray-200 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {childNameMap.get(goal.child_id) ?? "자녀"}
                    </p>
                    <p className="mt-1 text-base font-medium text-gray-900">{goal.title}</p>
                    <p className="mt-1 text-sm text-gray-600">
                      목표 {goal.target_points}P
                      {goal.reward ? ` · 보상 ${goal.reward}` : ""}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {goal.achieved ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                          목표 달성
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                          진행 중
                        </span>
                      )}

                      {goal.reward_given ? (
                        <span className="rounded-full bg-sky-50 px-2 py-1 text-xs text-sky-700">
                          보상 지급 완료
                        </span>
                      ) : goal.achieved ? (
                        <span className="rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-700">
                          보상 지급 필요
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(goal.id)}
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

      {completedRewardGoals.length > 0 ? (
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">보상 지급 완료</h2>

          <div className="mt-4 space-y-3">
            {completedRewardGoals.map((goal) => (
              <div key={goal.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-900">
                  {childNameMap.get(goal.child_id) ?? "자녀"}
                </p>
                <p className="mt-1 text-base font-medium text-gray-800">{goal.title}</p>
                <p className="mt-1 text-sm text-gray-600">
                  {goal.reward ? `보상 ${goal.reward}` : "보상 지급 완료"}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
