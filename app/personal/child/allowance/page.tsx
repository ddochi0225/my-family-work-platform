import type { ReactNode } from "react";
import {
  Coins,
  PiggyBank,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock3,
} from "lucide-react";
import { requireChild } from "@/lib/auth/requireChild";
import { createServerSupabase } from "@/lib/supabase/server";
import ChildAllowanceRequestButton from "./ChildAllowanceRequestButton";
import {
  getAllowanceStatusLabel,
  getAllowanceStatusStyle,
} from "@/lib/utils/allowanceStatus";
import ChildPageHeader from "../ChildPageHeader";

export const dynamic = "force-dynamic";

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
  processed_at?: string | null;
};

function formatDate(dateString?: string | null) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("ko-KR");
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

export default async function ChildAllowancePage() {
  const profile = await requireChild();
  const supabase = await createServerSupabase();

  if (!profile.child_id) {
    return (
      <div className="space-y-4">
        <ChildPageHeader
          title="포인트 / 용돈"
          description="현재 포인트와 용돈 요청 내역을 확인해요."
          tone="allowance"
        />

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">
            아직 연결된 자녀 프로필이 없어요.
          </p>
        </section>
      </div>
    );
  }

  let pointItems: PointHistoryRow[] = [];
  let requestItems: AllowanceRequestRow[] = [];
  let pageMessage = "";

  const { data: pointHistories, error: pointError } = await supabase
    .from("point_histories")
    .select("id, child_id, type, points, description, created_at")
    .eq("child_id", profile.child_id)
    .order("created_at", { ascending: false });

  if (pointError) {
    pageMessage = `포인트 내역 조회 오류: ${pointError.message ?? "알 수 없는 오류"}`;
  } else {
    pointItems = (pointHistories as PointHistoryRow[]) ?? [];
  }

  const { data: allowanceRequests, error: requestError } = await supabase
    .from("allowance_requests")
    .select("id, child_id, points, amount, status, created_at, processed_at")
    .eq("child_id", profile.child_id)
    .order("created_at", { ascending: false });

  if (requestError) {
    pageMessage =
      pageMessage || `용돈 요청 조회 오류: ${requestError.message ?? "알 수 없는 오류"}`;
  } else {
    requestItems = (allowanceRequests as AllowanceRequestRow[]) ?? [];
  }

  const totalPoints = pointItems.reduce(
    (sum, item) => sum + Number(item.points ?? 0),
    0
  );

  const earnedPoints = pointItems
    .filter((item) => Number(item.points ?? 0) > 0)
    .reduce((sum, item) => sum + Number(item.points ?? 0), 0);

  const usedPoints = Math.abs(
    pointItems
      .filter((item) => Number(item.points ?? 0) < 0)
      .reduce((sum, item) => sum + Number(item.points ?? 0), 0)
  );

  const hasPendingRequest = requestItems.some((item) => item.status === "pending");

  const latestEarnItem =
    pointItems.find((item) => Number(item.points ?? 0) > 0) ?? null;

  const latestUseItem =
    pointItems.find((item) => Number(item.points ?? 0) < 0) ?? null;

  const latestProcessedRequest =
    requestItems.find(
      (item) =>
        (item.status === "approved" || item.status === "rejected") &&
        item.processed_at
    ) ?? null;

  return (
    <div className="space-y-6">
      <ChildPageHeader
        title="포인트 / 용돈"
        description="현재 포인트와 용돈 요청 내역을 확인해요."
        tone="allowance"
      />

      {pageMessage ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          {pageMessage}
        </section>
      ) : null}

      {latestProcessedRequest ? (
        <section
          className={`rounded-2xl border p-4 text-sm ${
            latestProcessedRequest.status === "approved"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          <p className="font-semibold">
            {latestProcessedRequest.status === "approved"
              ? "용돈 요청이 승인되었어요 🎉"
              : "이번 용돈 요청은 반려되었어요"}
          </p>
          <p className="mt-1">
            {latestProcessedRequest.amount
              ? `${latestProcessedRequest.amount.toLocaleString()}원`
              : `${latestProcessedRequest.points.toLocaleString()}P`}{" "}
            요청이{" "}
            {latestProcessedRequest.status === "approved"
              ? "처리되었어요."
              : "반려되었어요."}
          </p>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          icon={<Wallet className="h-5 w-5" />}
          title="현재 포인트"
          value={`${totalPoints.toLocaleString()}P`}
          desc="지금 사용할 수 있는 포인트"
        />
        <SummaryCard
          icon={<ArrowUpCircle className="h-5 w-5" />}
          title="누적 적립"
          value={`+${earnedPoints.toLocaleString()}P`}
          desc="지금까지 모은 포인트"
          valueClassName="text-sky-600"
        />
        <SummaryCard
          icon={<ArrowDownCircle className="h-5 w-5" />}
          title="누적 차감"
          value={`-${usedPoints.toLocaleString()}P`}
          desc="용돈 승인 등으로 차감된 포인트"
          valueClassName="text-rose-500"
        />
        <SummaryCard
          icon={<PiggyBank className="h-5 w-5" />}
          title="요청 가능 상태"
          value={totalPoints >= 1000 && !hasPendingRequest ? "가능" : "불가"}
          desc={
            hasPendingRequest
              ? "현재 요청 대기 중"
              : totalPoints >= 1000
              ? "지금 용돈 요청 가능"
              : "1000P부터 요청 가능"
          }
        />
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <PiggyBank className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">용돈 요청</h2>
            <p className="text-sm text-slate-500">
              1000P를 모르면 1000원 용돈을 요청할 수 있어요.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <MiniSummaryCard
            icon={<Coins className="h-4 w-4" />}
            title="현재 포인트"
            value={`${totalPoints.toLocaleString()}P`}
          />
          <MiniSummaryCard
            icon={<PiggyBank className="h-4 w-4" />}
            title="용돈 요청 가능"
            value={totalPoints >= 1000 && !hasPendingRequest ? "가능" : "불가"}
          />
          <MiniSummaryCard
            icon={<Clock3 className="h-4 w-4" />}
            title="대기 중 요청"
            value={
              hasPendingRequest
                ? `${requestItems.filter((item) => item.status === "pending").length}건`
                : "없음"
            }
          />
        </div>

        <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          예시) 1,100P가 있을 때 1,000P 용돈 요청이 승인되면 현재 포인트는 100P가 돼요.
        </div>

        <div className="mt-4">
          <ChildAllowanceRequestButton
            childId={profile.child_id}
            totalPoints={totalPoints}
            canRequest={totalPoints >= 1000 && !hasPendingRequest}
            hasPendingRequest={hasPendingRequest}
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <Panel
            title="최근 포인트 내역"
            icon={<Coins className="h-5 w-5" />}
            badge={`${pointItems.length}건`}
          >
            {pointItems.length === 0 ? (
              <EmptyState text="아직 포인트 내역이 없어요." />
            ) : (
              <div className="space-y-3">
                {pointItems.slice(0, 10).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {item.description || "포인트 내역"}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {formatDate(item.created_at)}
                      </p>
                    </div>

                    <div
                      className={`shrink-0 text-sm font-bold ${
                        item.points >= 0 ? "text-sky-600" : "text-rose-500"
                      }`}
                    >
                      {item.points > 0 ? `+${item.points}` : item.points}P
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel
            title="최근 용돈 요청 내역"
            icon={<PiggyBank className="h-5 w-5" />}
            badge={`${requestItems.length}건`}
          >
            {requestItems.length === 0 ? (
              <EmptyState text="아직 용돈 요청 내역이 없어요." />
            ) : (
              <div className="space-y-3">
                {requestItems.slice(0, 8).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                          {item.amount
                            ? `${item.amount.toLocaleString()}원 요청`
                            : `${item.points.toLocaleString()}P 요청`}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
                          <span>요청 {formatDateTime(item.created_at)}</span>
                          {item.processed_at ? (
                            <span>처리 {formatDateTime(item.processed_at)}</span>
                          ) : null}
                        </div>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${getAllowanceStatusStyle(
                          item.status
                        )}`}
                      >
                        {getAllowanceStatusLabel(item.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="최근 적립 / 차감" icon={<Wallet className="h-5 w-5" />}>
            <div className="grid gap-4">
              <InfoItem
                title="최근 적립"
                emptyText="최근 적립 내역이 없어요."
                tone="plus"
                item={
                  latestEarnItem
                    ? {
                        title: latestEarnItem.description || "포인트 적립",
                        value: `+${latestEarnItem.points.toLocaleString()}P`,
                        date: formatDate(latestEarnItem.created_at),
                      }
                    : null
                }
              />

              <InfoItem
                title="최근 차감"
                emptyText="최근 차감 내역이 없어요."
                tone="minus"
                item={
                  latestUseItem
                    ? {
                        title: latestUseItem.description || "포인트 차감",
                        value: `${latestUseItem.points.toLocaleString()}P`,
                        date: formatDate(latestUseItem.created_at),
                      }
                    : null
                }
              />
            </div>
          </Panel>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <Coins className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">도움말</h2>
                <p className="text-sm text-slate-500">
                  포인트와 용돈 요청 방식을 확인해요.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <HelpBox
                title="포인트는 할 일을 완료하면 적립돼요"
                desc="보상이 있는 할 일을 완료하면 포인트 내역에 바로 반영돼요."
              />
              <HelpBox
                title="1000P부터 용돈 요청이 가능해요"
                desc="현재 포인트가 1000P 이상이고 대기 중 요청이 없으면 요청할 수 있어요."
              />
              <HelpBox
                title="승인되면 포인트가 차감돼요"
                desc="부모가 용돈 요청을 승인하면 요청한 포인트만큼 현재 포인트에서 차감돼요."
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
  valueClassName,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  desc: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
        {icon}
      </div>
      <p className="mt-3 text-sm font-medium text-slate-500">{title}</p>
      <p
        className={`mt-1 text-3xl font-bold tracking-tight text-slate-900 ${
          valueClassName ?? ""
        }`}
      >
        {value}
      </p>
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
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
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

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
      {text}
    </div>
  );
}

function InfoItem({
  title,
  emptyText,
  tone,
  item,
}: {
  title: string;
  emptyText: string;
  tone: "plus" | "minus";
  item: { title: string; value: string; date: string } | null;
}) {
  if (!item) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-4 py-4">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-2 text-sm text-slate-500">{emptyText}</p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border px-4 py-4 ${
        tone === "plus"
          ? "border-sky-100 bg-sky-50/60"
          : "border-rose-100 bg-rose-50/60"
      }`}
    >
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-3 text-sm font-medium text-slate-900">{item.title}</p>
      <p
        className={`mt-2 text-lg font-bold ${
          tone === "plus" ? "text-sky-600" : "text-rose-500"
        }`}
      >
        {item.value}
      </p>
      <p className="mt-1 text-xs text-slate-400">{item.date}</p>
    </div>
  );
}

function HelpBox({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-gray-200 px-4 py-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{desc}</p>
    </div>
  );
}