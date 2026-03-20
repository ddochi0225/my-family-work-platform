"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Props = {
  childId: string;
  totalPoints: number;
  canRequest: boolean;
  hasPendingRequest: boolean;
};

export default function ChildAllowanceRequestButton({
  childId,
  totalPoints,
  canRequest,
  hasPendingRequest,
}: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const remaining = Math.max(0, 1000 - totalPoints);

  const handleRequest = async () => {
    if (!canRequest || submitting) return;

    const confirmed = window.confirm("1000P를 용돈 1000원으로 요청할까요?");
    if (!confirmed) return;

    setSubmitting(true);
    setMessage("");

    const { error } = await supabase.from("allowance_requests").insert({
      child_id: childId,
      points: 1000,
      amount: 1000,
      status: "pending",
    });

    if (error) {
      console.error("용돈 요청 오류:", error);
      setMessage(`용돈 요청에 실패했어요. (${error.message})`);
      setSubmitting(false);
      return;
    }

    setMessage("용돈을 요청했어요. 부모가 확인하면 결과가 반영돼요.");
    setSubmitting(false);
    router.refresh();
  };

  let buttonText = "용돈 요청하기";
  let helpText = "1000P를 1000원 용돈으로 요청할 수 있어요.";

  if (hasPendingRequest) {
    buttonText = "이미 요청 대기 중이에요";
    helpText = "부모가 현재 요청을 확인 중이에요.";
  } else if (totalPoints < 1000) {
    buttonText = `${remaining}P 더 모아야 해요`;
    helpText = "현재 포인트가 1000P 이상이면 요청할 수 있어요.";
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleRequest}
        disabled={!canRequest || submitting}
        className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
          canRequest
            ? "bg-sky-600 text-white hover:bg-sky-700"
            : "bg-slate-200 text-slate-500"
        } disabled:cursor-not-allowed disabled:opacity-70`}
      >
        {submitting ? "요청 중..." : buttonText}
      </button>

      <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
        {helpText}
      </div>

      {message ? <p className="text-sm text-sky-700">{message}</p> : null}
    </div>
  );
}