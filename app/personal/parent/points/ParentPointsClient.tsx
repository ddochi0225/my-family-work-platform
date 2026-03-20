"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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

type PointFilter = "all" | "earn" | "use";

export default function ParentPointsClient({
  children,
  pointItems,
  requestItems,
}: Props) {
  const [selectedChildId, setSelectedChildId] = useState("all");
  const [pointFilter, setPointFilter] = useState<PointFilter>("all");

  const childNameMap = useMemo(() => {
    const map = new Map<string, string>();
    children.forEach((child) => map.set(child.id, child.name));
    return map;
  }, [children]);

  const pointTotals = useMemo(() => {
    const totals: Record<string, number> = {};

    children.forEach((child) => {
      totals[child.id] = 0;
    });

    pointItems.forEach((item) => {
      totals[item.child_id] = (totals[item.child_id] ?? 0) + Number(item.points ?? 0);
    });

    return totals;
  }, [children, pointItems]);

  const totalCurrentPoints = useMemo(() => {
    return Object.values(pointTotals).reduce((sum, value) => sum + value, 0);
  }, [pointTotals]);

  const totalEarnedPoints = useMemo(() => {
    return pointItems
      .filter((item) => Number(item.points) > 0)
      .reduce((sum, item) => sum + Number(item.points ?? 0), 0);
  }, [pointItems]);

  const totalUsedPoints = useMemo(() => {
    return Math.abs(
      pointItems
        .filter((item) => Number(item.points) < 0)
        .reduce((sum, item) => sum + Number(item.points ?? 0), 0)
    );
  }, [pointItems]);

  const filteredPointItems = useMemo(() => {
    return pointItems.filter((item) => {
      const childMatched =
        selectedChildId === "all" ? true : item.child_id === selectedChildId;

      const pointMatched =
        pointFilter === "all"
          ? true
          : pointFilter === "earn"
          ? Number(item.points) > 0
          : Number(item.points) < 0;

      return childMatched && pointMatched;
    });
  }, [pointItems, selectedChildId, pointFilter]);

  const filteredRequestItems = useMemo(() => {
    return requestItems.filter((item) =>
      selectedChildId === "all" ? true : item.child_id === selectedChildId
    );
  }, [requestItems, selectedChildId]);

  const pendingCount = useMemo(
    () => filteredRequestItems.filter((item) => item.status === "pending").length,
    [filteredRequestItems]
  );

  const approvedCount = useMemo(
    () => filteredRequestItems.filter((item) => item.status === "approved").length,
    [filteredRequestItems]
  );

  const rejectedCount = useMemo(
    () => filteredRequestItems.filter((item) => item.status === "rejected").length,
    [filteredRequestItems]
  );

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">포인트 내역</h1>
            <p className="mt-2 text-sm text-gray-600">
              자녀별 포인트 적립/차감 내역과 용돈 요청 이력을 한눈에 확인할 수 있어요.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/personal/parent"
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              부모 홈
            </Link>
            <Link
              href="/personal/parent/allowance"
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              포인트 / 용돈 관리
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard title="현재 총 포인트" value={`${totalCurrentPoints.toLocaleString()}P`} />
        <SummaryCard title="전체 적립" value={`+${totalEarnedPoints.toLocaleString()}P`} />
        <SummaryCard title="전체 사용" value={`-${totalUsedPoints.toLocaleString()}P`} />
      </section>

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
                {(pointTotals[child.id] ?? 0).toLocaleString()}P
              </p>
            </div>
          ))
        )}
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">필터</h2>
            <p className="mt-1 text-sm text-gray-500">
              자녀별, 유형별로 포인트 내역을 나눠 볼 수 있어요.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                자녀 선택
              </label>
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-sky-500"
              >
                <option value="all">전체 자녀</option>
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                내역 구분
              </label>
              <select
                value={pointFilter}
                onChange={(e) => setPointFilter(e.target.value as PointFilter)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-sky-500"
              >
                <option value="all">전체</option>
                <option value="earn">적립만</option>
                <option value="use">차감만</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">포인트 변동 내역</h2>

        {filteredPointItems.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">표시할 포인트 내역이 없어요.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {filteredPointItems.map((item) => {
              const childName = childNameMap.get(item.child_id) ?? "자녀";
              const point = Number(item.points ?? 0);

              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{childName}</p>
                    <p className="mt-1 text-sm text-gray-700">
                      {item.description || getPointTypeLabel(item.type)}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {formatDateTime(item.created_at)} · {getPointTypeLabel(item.type)}
                    </p>
                  </div>

                  <p
                    className={`text-sm font-semibold ${
                      point >= 0 ? "text-sky-600" : "text-rose-600"
                    }`}
                  >
                    {point > 0 ? `+${point.toLocaleString()}` : point.toLocaleString()}P
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-semibold text-gray-900">용돈 요청 이력</h2>
          <div className="flex flex-wrap gap-2 text-xs">
            <CountBadge label="대기" value={pendingCount} />
            <CountBadge label="승인" value={approvedCount} />
            <CountBadge label="반려" value={rejectedCount} />
          </div>
        </div>

        {filteredRequestItems.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">표시할 용돈 요청 내역이 없어요.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {filteredRequestItems.map((item) => {
              const childName = childNameMap.get(item.child_id) ?? "자녀";

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{childName}</p>
                      <p className="mt-1 text-sm text-gray-700">
                        {Number(item.points ?? 0).toLocaleString()}P 요청
                        {item.amount ? ` · ${Number(item.amount).toLocaleString()}원` : ""}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        요청일 {formatDateTime(item.created_at)}
                        {item.processed_at
                          ? ` · 처리일 ${formatDateTime(item.processed_at)}`
                          : ""}
                      </p>
                    </div>

                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getAllowanceStatusStyle(
                        item.status
                      )}`}
                    >
                      {getAllowanceStatusLabel(item.status)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function CountBadge({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">
      {label} {value}건
    </span>
  );
}

function getPointTypeLabel(type: string) {
  switch (type) {
    case "earn":
      return "포인트 적립";
    case "allowance_used":
      return "용돈 사용";
    case "todo_reward":
      return "할 일 보상";
    case "manual":
      return "수동 지급";
    default:
      return type || "포인트 내역";
  }
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}.${String(date.getDate()).padStart(2, "0")} ${String(
    date.getHours()
  ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}