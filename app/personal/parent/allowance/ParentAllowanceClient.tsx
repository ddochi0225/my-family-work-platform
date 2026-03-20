"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import {
  getAllowanceStatusLabel,
  getAllowanceStatusStyle,
} from "@/lib/utils/allowanceStatus";

type ChildRow = {
  id: string;
  name: string;
};

type PointHistoryRow = {
  id: string;
  child_id: string;
  type: string;
  points: number;
  description: string | null;
  created_at: string;
};

type AllowanceRequestRow = {
  id: string;
  child_id: string;
  points: number;
  amount: number | null;
  status: string;
  created_at: string;
  processed_at: string | null;
};

type Props = {
  children: ChildRow[];
  pointItems: PointHistoryRow[];
  requestItems: AllowanceRequestRow[];
};

export default function ParentAllowanceClient({
  children,
  pointItems,
  requestItems,
}: Props) {
  const router = useRouter();

  const [selectedChildId, setSelectedChildId] = useState(children[0]?.id ?? "");
  const [rewardPoints, setRewardPoints] = useState("100");
  const [description, setDescription] = useState("수동 포인트 적립");
  const [savingPoint, setSavingPoint] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const childPointMap = useMemo(() => {
    const map = new Map<string, number>();

    for (const child of children) {
      map.set(child.id, 0);
    }

    for (const item of pointItems) {
      map.set(item.child_id, (map.get(item.child_id) ?? 0) + Number(item.points ?? 0));
    }

    return map;
  }, [children, pointItems]);

  const selectedChild = useMemo(
    () => children.find((child) => child.id === selectedChildId) ?? null,
    [children, selectedChildId]
  );

  const pendingRequests = useMemo(
    () => requestItems.filter((item) => item.status === "pending"),
    [requestItems]
  );

  const recentPointItems = useMemo(() => pointItems.slice(0, 20), [pointItems]);

  const handleAddPoints = async () => {
    setMessage("");

    if (!selectedChildId) {
      setMessage("자녀를 먼저 선택해 주세요.");
      return;
    }

    const pointsNumber = Number(rewardPoints);

    if (!Number.isFinite(pointsNumber) || pointsNumber <= 0) {
      setMessage("적립 포인트를 올바르게 입력해 주세요.");
      return;
    }

    setSavingPoint(true);

    const { error } = await supabase.from("point_histories").insert({
      child_id: selectedChildId,
      type: "earn",
      points: pointsNumber,
      description: description.trim() || "수동 포인트 적립",
    });

    if (error) {
      console.error(error);
      setMessage(`포인트 적립에 실패했어요. (${error.message})`);
      setSavingPoint(false);
      return;
    }

    setMessage("포인트를 적립했어요.");
    setRewardPoints("100");
    setDescription("수동 포인트 적립");
    setSavingPoint(false);
    router.refresh();
  };

  const handleUpdateStatus = async (
    requestId: string,
    childId: string,
    points: number,
    nextStatus: "approved" | "rejected"
  ) => {
    setMessage("");
    setProcessingId(requestId);

    const processedAt = new Date().toISOString();

    const { data: updatedRows, error: updateError } = await supabase
      .from("allowance_requests")
      .update({
        status: nextStatus,
        processed_at: processedAt,
      })
      .eq("id", requestId)
      .eq("status", "pending")
      .select("id, status");

    if (updateError) {
      console.error(updateError);
      setMessage(`요청 처리에 실패했어요. (${updateError.message})`);
      setProcessingId(null);
      return;
    }

    if (!updatedRows || updatedRows.length === 0) {
      setMessage("이미 처리된 요청이거나 대기 중 요청이 아니에요.");
      setProcessingId(null);
      router.refresh();
      return;
    }

    if (nextStatus === "approved") {
      const { error: pointError } = await supabase.from("point_histories").insert({
        child_id: childId,
        type: "allowance_used",
        points: -points,
        description: "용돈 요청 승인으로 차감",
      });

      if (pointError) {
        console.error(pointError);

        // 승인 상태는 바뀌었지만 차감 기록이 실패했을 때 롤백
        const { error: rollbackError } = await supabase
          .from("allowance_requests")
          .update({
            status: "pending",
            processed_at: null,
          })
          .eq("id", requestId)
          .eq("status", "approved");

        if (rollbackError) {
          console.error("롤백 실패:", rollbackError);
          setMessage(
            `포인트 차감 기록 저장에 실패했고 요청 상태 복구도 실패했어요. (${pointError.message})`
          );
        } else {
          setMessage(
            `포인트 차감 기록 저장에 실패해서 요청을 다시 대기 상태로 돌렸어요. (${pointError.message})`
          );
        }

        setProcessingId(null);
        router.refresh();
        return;
      }
    }

    setMessage(nextStatus === "approved" ? "요청을 승인했어요." : "요청을 반려했어요.");
    setProcessingId(null);
    router.refresh();
  };

  const getChildName = (childId: string) =>
    children.find((child) => child.id === childId)?.name ?? "자녀";

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">포인트 / 용돈 관리</h1>
        <p className="mt-2 text-sm text-gray-600">
          자녀별 포인트를 적립하고 용돈 요청을 승인하거나 반려할 수 있어요.
        </p>
      </section>

      {message ? (
        <section className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-700">
          {message}
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        {children.length === 0 ? (
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">등록된 자녀가 없어요.</p>
          </div>
        ) : (
          children.map((child) => (
            <div key={child.id} className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">{child.name}</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {childPointMap.get(child.id) ?? 0}P
              </p>
            </div>
          ))
        )}
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">포인트 수동 적립</h2>
        <p className="mt-1 text-sm text-gray-500">
          테스트용 또는 수동 보상용으로 포인트를 바로 적립할 수 있어요.
        </p>

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
                적립 포인트
              </label>
              <input
                type="number"
                min={1}
                value={rewardPoints}
                onChange={(e) => setRewardPoints(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-sky-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                설명
              </label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="예: 심부름 완료 보상"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-sky-500"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="button"
                onClick={handleAddPoints}
                disabled={savingPoint}
                className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
              >
                {savingPoint
                  ? "적립 중..."
                  : `${selectedChild?.name ?? "선택한 자녀"}에게 포인트 적립`}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">용돈 요청 현황</h2>
          <span className="text-sm text-gray-500">
            대기 중 {pendingRequests.length}건
          </span>
        </div>

        {requestItems.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">아직 용돈 요청 내역이 없어요.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {requestItems.map((item) => {
              const isPending = item.status === "pending";
              const isProcessing = processingId === item.id;

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {getChildName(item.child_id)}
                      </p>
                      <p className="mt-1 text-sm text-gray-700">
                        {item.points}P 요청
                      </p>
                      {item.amount ? (
                        <p className="mt-1 text-xs text-gray-500">
                          금액: {item.amount.toLocaleString()}원
                        </p>
                      ) : null}
                      <p
                        className={`mt-1 inline-block rounded-full px-2 py-1 text-xs font-medium ${getAllowanceStatusStyle(
                          item.status
                        )}`}
                      >
                        {getAllowanceStatusLabel(item.status)}
                      </p>
                    </div>

                    {isPending ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const ok = window.confirm(
                              `${getChildName(item.child_id)}의 ${item.points}P 요청을 승인할까요?`
                            );
                            if (!ok) return;
                            handleUpdateStatus(item.id, item.child_id, item.points, "approved");
                          }}
                          disabled={isProcessing}
                          className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
                        >
                          승인
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const ok = window.confirm(
                              `${getChildName(item.child_id)}의 ${item.points}P 요청을 반려할까요?`
                            );
                            if (!ok) return;
                            handleUpdateStatus(item.id, item.child_id, item.points, "rejected");
                          }}
                          disabled={isProcessing}
                          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                        >
                          반려
                        </button>
                      </div>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                        처리 완료
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">최근 포인트 내역</h2>

        {recentPointItems.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">아직 포인트 내역이 없어요.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {recentPointItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-gray-200 p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {getChildName(item.child_id)}
                  </p>
                  <p className="mt-1 text-sm text-gray-700">
                    {item.description || "포인트 내역"}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">{item.type}</p>
                </div>

                <p
                  className={`text-sm font-semibold ${
                    item.points >= 0 ? "text-sky-600" : "text-rose-600"
                  }`}
                >
                  {item.points > 0 ? `+${item.points}` : item.points}P
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}