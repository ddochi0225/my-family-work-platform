"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type ChildRow = {
  id: string;
  name: string;
};

type AllowanceRequestRow = {
  id: string;
  child_id: string;
  request_points: number;
  allowance_amount: number;
  status: "pending" | "approved" | "rejected" | "completed";
  created_at: string;
};

type RequestWithChildName = AllowanceRequestRow & {
  child_name: string;
};

export default function ParentAllowanceRequestsPage() {
  const [children, setChildren] = useState<ChildRow[]>([]);
  const [requests, setRequests] = useState<RequestWithChildName[]>([]);
  const [selectedChildId, setSelectedChildId] = useState("all");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const filteredRequests = useMemo(() => {
    if (selectedChildId === "all") return requests;
    return requests.filter((item) => item.child_id === selectedChildId);
  }, [requests, selectedChildId]);

  const pendingCount = useMemo(() => {
    return filteredRequests.filter((item) => item.status === "pending").length;
  }, [filteredRequests]);

  const approvedCount = useMemo(() => {
    return filteredRequests.filter((item) => item.status === "approved").length;
  }, [filteredRequests]);

  const rejectedCount = useMemo(() => {
    return filteredRequests.filter((item) => item.status === "rejected").length;
  }, [filteredRequests]);

  const fetchInitialData = async () => {
    setLoading(true);

    const [
      { data: childData, error: childError },
      { data: requestData, error: requestError },
    ] = await Promise.all([
      supabase.from("children").select("id, name").order("created_at", { ascending: true }),
      supabase
        .from("allowance_requests")
        .select("id, child_id, request_points, allowance_amount, status, created_at")
        .order("created_at", { ascending: false }),
    ]);

    if (childError) {
      console.error(childError);
      alert("자녀 정보를 불러오지 못했어요.");
      setLoading(false);
      return;
    }

    if (requestError) {
      console.error(requestError);
      alert("용돈 요청 내역을 불러오지 못했어요.");
      setLoading(false);
      return;
    }

    const childRows = (childData as ChildRow[]) ?? [];
    const requestRows = (requestData as AllowanceRequestRow[]) ?? [];

    setChildren(childRows);

    const childNameMap = new Map(childRows.map((child) => [child.id, child.name]));

    const merged = requestRows.map((item) => ({
      ...item,
      child_name: childNameMap.get(item.child_id) ?? "이름 없음",
    }));

    setRequests(merged);
    setLoading(false);
  };

  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId);

    const { error } = await supabase
      .from("allowance_requests")
      .update({ status: "approved" })
      .eq("id", requestId)
      .eq("status", "pending");

    if (error) {
      console.error(error);
      alert("승인 처리에 실패했어요.");
      setProcessingId(null);
      return;
    }

    setRequests((prev) =>
      prev.map((item) =>
        item.id === requestId && item.status === "pending"
          ? { ...item, status: "approved" }
          : item
      )
    );

    setProcessingId(null);
  };

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId);

    const request = requests.find((item) => item.id === requestId);

    if (!request) {
      alert("요청 정보를 찾지 못했어요.");
      setProcessingId(null);
      return;
    }

    const { data: childData, error: childError } = await supabase
      .from("children")
      .select("id, points")
      .eq("id", request.child_id)
      .single();

    if (childError || !childData) {
      console.error(childError);
      alert("자녀 포인트를 불러오지 못했어요.");
      setProcessingId(null);
      return;
    }

    const nextPoints = Number(childData.points ?? 0) + Number(request.request_points ?? 0);

    const { error: pointError } = await supabase
      .from("children")
      .update({ points: nextPoints })
      .eq("id", request.child_id);

    if (pointError) {
      console.error(pointError);
      alert("포인트 복원에 실패했어요.");
      setProcessingId(null);
      return;
    }

    const { error: rejectError } = await supabase
      .from("allowance_requests")
      .update({ status: "rejected" })
      .eq("id", requestId)
      .eq("status", "pending");

    if (rejectError) {
      console.error(rejectError);
      alert("반려 처리에 실패했어요.");
      setProcessingId(null);
      return;
    }

    setRequests((prev) =>
      prev.map((item) =>
        item.id === requestId && item.status === "pending"
          ? { ...item, status: "rejected" }
          : item
      )
    );

    setProcessingId(null);
  };

  const formatDateTime = (value: string) => {
    return new Date(value).toLocaleString("ko-KR");
  };

  const getStatusLabel = (status: RequestWithChildName["status"]) => {
    if (status === "pending") return "대기중";
    if (status === "approved") return "승인";
    if (status === "rejected") return "반려";
    return "완료";
  };

  const getStatusClass = (status: RequestWithChildName["status"]) => {
    if (status === "pending") return "bg-yellow-100 text-yellow-700";
    if (status === "approved") return "bg-emerald-100 text-emerald-700";
    if (status === "rejected") return "bg-rose-100 text-rose-700";
    return "bg-gray-100 text-gray-600";
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-12">
        <div className="mx-auto max-w-5xl">불러오는 중...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">용돈 요청 승인</h1>
            <p className="mt-2 text-sm text-gray-600">
              자녀의 용돈 요청을 승인하거나 반려할 수 있어요.
            </p>
          </div>

          <Link
            href="/personal"
            className="inline-flex rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50"
          >
            홈으로 이동
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <p className="text-sm text-gray-500">대기중</p>
            <p className="mt-2 text-3xl font-bold text-yellow-600">{pendingCount}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <p className="text-sm text-gray-500">승인</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">{approvedCount}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <p className="text-sm text-gray-500">반려</p>
            <p className="mt-2 text-3xl font-bold text-rose-600">{rejectedCount}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            자녀 필터
          </label>
          <select
            value={selectedChildId}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
          >
            <option value="all">전체 자녀</option>
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.name}
              </option>
            ))}
          </select>
        </div>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">요청 목록</h2>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
              {filteredRequests.length}건
            </span>
          </div>

          {filteredRequests.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">요청 내역이 없어요.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {filteredRequests.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-gray-200 p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-gray-900">
                          {item.child_name}
                        </p>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(item.status)}`}
                        >
                          {getStatusLabel(item.status)}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-gray-600">
                        {item.request_points}P → {item.allowance_amount.toLocaleString()}원
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        요청일시: {formatDateTime(item.created_at)}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(item.id)}
                        disabled={item.status !== "pending" || processingId === item.id}
                        className={`rounded-xl px-4 py-2 text-sm font-medium text-white ${
                          item.status === "pending" && processingId !== item.id
                            ? "bg-emerald-600 hover:bg-emerald-700"
                            : "cursor-not-allowed bg-gray-300"
                        }`}
                      >
                        승인
                      </button>

                      <button
                        onClick={() => handleReject(item.id)}
                        disabled={item.status !== "pending" || processingId === item.id}
                        className={`rounded-xl px-4 py-2 text-sm font-medium text-white ${
                          item.status === "pending" && processingId !== item.id
                            ? "bg-rose-500 hover:bg-rose-600"
                            : "cursor-not-allowed bg-gray-300"
                        }`}
                      >
                        반려
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}