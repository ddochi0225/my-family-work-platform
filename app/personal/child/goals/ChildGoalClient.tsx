"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import ChildPageHeader from "../ChildPageHeader";

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
  childId: string;
  pointTotal: number;
  parentGoals: ParentGoalRow[];
  childGoals: ChildGoalRow[];
};

function statusLabel(status: ChildGoalRow["status"]) {
  if (status === "completed") return "완료";
  if (status === "paused") return "잠시 보류";
  return "도전 중";
}

function statusBadge(status: ChildGoalRow["status"]) {
  if (status === "completed") return "bg-emerald-50 text-emerald-700";
  if (status === "paused") return "bg-amber-50 text-amber-700";
  return "bg-violet-50 text-violet-700";
}

export default function ChildGoalClient({
  childId,
  pointTotal,
  parentGoals,
  childGoals,
}: Props) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reason, setReason] = useState("");
  const [rewardNote, setRewardNote] = useState("");
  const [isShared, setIsShared] = useState(true);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const summary = useMemo(() => {
    return {
      active: childGoals.filter((goal) => goal.status === "active").length,
      completed: childGoals.filter((goal) => goal.status === "completed").length,
      paused: childGoals.filter((goal) => goal.status === "paused").length,
    };
  }, [childGoals]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setReason("");
    setRewardNote("");
    setIsShared(true);
    setEditingId(null);
  };

  const handleCreateOrUpdate = async () => {
    setMessage("");

    if (!title.trim()) {
      setMessage("목표 제목을 적어 주세요.");
      return;
    }

    setSaving(true);

    const payload = {
      child_id: childId,
      title: title.trim(),
      description: description.trim() || null,
      reason: reason.trim() || null,
      reward_note: rewardNote.trim() || null,
      is_shared: isShared,
    };

    const query = editingId
      ? supabase.from("child_goals").update(payload).eq("id", editingId)
      : supabase.from("child_goals").insert(payload);

    const { error } = await query;

    setSaving(false);

    if (error) {
      console.error(error);
      setMessage(`저장에 실패했어요. (${error.message})`);
      return;
    }

    setMessage(editingId ? "내 목표를 수정했어요." : "내 목표를 추가했어요.");
    resetForm();
    router.refresh();
  };

  const handleEdit = (goal: ChildGoalRow) => {
    setEditingId(goal.id);
    setTitle(goal.title);
    setDescription(goal.description ?? "");
    setReason(goal.reason ?? "");
    setRewardNote(goal.reward_note ?? "");
    setIsShared(goal.is_shared);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStatusChange = async (goalId: string, status: ChildGoalRow["status"]) => {
    setProcessingId(goalId);
    setMessage("");

    const { error } = await supabase.from("child_goals").update({ status }).eq("id", goalId);

    setProcessingId(null);

    if (error) {
      console.error(error);
      setMessage(`상태 변경에 실패했어요. (${error.message})`);
      return;
    }

    setMessage("목표 상태를 바꿨어요.");
    router.refresh();
  };

  const handleDelete = async (goalId: string) => {
    const ok = window.confirm("이 목표를 삭제할까요?");
    if (!ok) return;

    const { error } = await supabase.from("child_goals").delete().eq("id", goalId);

    if (error) {
      console.error(error);
      setMessage(`삭제에 실패했어요. (${error.message})`);
      return;
    }

    if (editingId === goalId) {
      resetForm();
    }

    setMessage("목표를 삭제했어요.");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <ChildPageHeader
        title="내 목표"
        description="부모가 정해준 목표와 내가 이루고 싶은 목표를 확인해요."
        tone="goals"
      />

      {message ? (
        <section className="rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3 text-sm text-violet-700">
          {message}
        </section>
      ) : null}

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">부모가 정해준 목표</h2>
            <p className="mt-1 text-sm text-gray-500">포인트를 모아서 부모 목표를 달성해 보세요.</p>
          </div>
          <span className="rounded-full bg-sky-50 px-2 py-1 text-xs text-sky-700">
            {parentGoals.length}개
          </span>
        </div>

        {parentGoals.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">아직 부모가 정해준 목표가 없어요.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {parentGoals.map((goal) => (
              <div key={goal.id} className="rounded-2xl border border-sky-100 bg-sky-50/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-gray-900">{goal.title}</p>
                    <p className="mt-1 text-sm text-gray-600">
                      목표 {goal.target_points}P
                      {goal.reward ? ` · 보상 ${goal.reward}` : ""}
                    </p>
                  </div>
                  {goal.achieved ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                      달성했어!
                    </span>
                  ) : (
                    <span className="rounded-full bg-white px-2 py-1 text-xs text-gray-600">진행 중</span>
                  )}
                </div>

                {goal.achieved && goal.reward_given ? (
                  <p className="mt-3 text-sm text-sky-700">보상 지급까지 완료되었어요.</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">내가 정한 목표</h2>
            <p className="mt-1 text-sm text-gray-500">내가 하고 싶은 것을 직접 적고, 상태도 바꿀 수 있어요.</p>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="rounded-full bg-violet-50 px-2 py-1 text-violet-700">도전 중 {summary.active}</span>
            <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">완료 {summary.completed}</span>
            <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">보류 {summary.paused}</span>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">목표 제목</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 피아노 곡 끝까지 치기"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">이루면 좋은 것</label>
            <input
              value={rewardNote}
              onChange={(e) => setRewardNote(e.target.value)}
              placeholder="예: 가족에게 연주 들려주기"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-violet-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-gray-700">설명</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="어떤 목표인지 적어 보세요."
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-violet-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-gray-700">왜 하고 싶은지</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="예: 멋지게 한 곡을 완성해 보고 싶어요."
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-violet-500"
            />
          </div>

          <div className="md:col-span-2 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <label className="flex items-center gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={isShared}
                onChange={(e) => setIsShared(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              부모에게도 보이게 하기
            </label>
          </div>

          <div className="md:col-span-2 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleCreateOrUpdate}
              disabled={saving}
              className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
            >
              {saving ? "저장 중..." : editingId ? "내 목표 수정" : "내 목표 추가"}
            </button>

            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-gray-300 px-5 py-3 text-sm text-gray-700 hover:bg-gray-50"
              >
                수정 취소
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">내 목표 목록</h2>

        {childGoals.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">아직 내가 적은 목표가 없어요.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {childGoals.map((goal) => (
              <div key={goal.id} className="rounded-2xl border border-gray-200 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-gray-900">{goal.title}</p>
                      <span className={`rounded-full px-2 py-1 text-xs ${statusBadge(goal.status)}`}>
                        {statusLabel(goal.status)}
                      </span>
                      {!goal.is_shared ? (
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                          나만 보기
                        </span>
                      ) : null}
                    </div>

                    {goal.description ? (
                      <p className="mt-2 text-sm text-gray-700">{goal.description}</p>
                    ) : null}

                    {goal.reason ? (
                      <p className="mt-2 text-sm text-gray-600">이유: {goal.reason}</p>
                    ) : null}

                    {goal.reward_note ? (
                      <p className="mt-1 text-sm text-gray-600">이루면 좋은 것: {goal.reward_note}</p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(goal.id, "active")}
                      disabled={processingId === goal.id}
                      className="rounded-xl border border-violet-200 px-3 py-2 text-xs text-violet-700 hover:bg-violet-50"
                    >
                      도전 중
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(goal.id, "completed")}
                      disabled={processingId === goal.id}
                      className="rounded-xl border border-emerald-200 px-3 py-2 text-xs text-emerald-700 hover:bg-emerald-50"
                    >
                      완료
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(goal.id, "paused")}
                      disabled={processingId === goal.id}
                      className="rounded-xl border border-amber-200 px-3 py-2 text-xs text-amber-700 hover:bg-amber-50"
                    >
                      보류
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEdit(goal)}
                      className="rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(goal.id)}
                      className="rounded-xl border border-red-300 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
