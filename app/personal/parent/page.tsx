import Link from "next/link";
import { requireParent } from "@/lib/auth/requireParent";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ChildRow = {
  id: string;
  name: string;
  parent_id: string;
};

type TodoRow = {
  id: string;
  child_id: string;
  title: string;
  completed: boolean;
  created_at: string;
};

type GoalRow = {
  id: string;
  child_id: string;
  title: string;
  achieved: boolean;
  created_at: string;
};

type AllowanceRequestRow = {
  id: string;
  child_id: string;
  points: number;
  amount: number | null;
  status: string;
  created_at: string;
};

type PointHistoryRow = {
  id: string;
  child_id: string;
  type: string;
  points: number;
  description: string | null;
  created_at: string;
};

type ChildSummary = {
  child: ChildRow;
  totalTodos: number;
  doneTodos: number;
  totalGoals: number;
  activeGoals: number;
  pendingAllowanceCount: number;
  pendingAllowancePoints: number;
  currentPoints: number;
  recentActivity: string;
};

export default async function ParentHomePage() {
  const profile = await requireParent();
  const supabase = await createServerSupabase();

  const { data: childrenData, error: childrenError } = await supabase
    .from("children")
    .select("id, name, parent_id")
    .eq("parent_id", profile.id)
    .order("created_at", { ascending: true });

  if (childrenError) {
    console.error("부모 홈 자녀 조회 오류:", childrenError);
  }

  const children = (childrenData as ChildRow[]) ?? [];
  const childIds = children.map((child) => child.id);

  let todos: TodoRow[] = [];
  let goals: GoalRow[] = [];
  let allowanceRequests: AllowanceRequestRow[] = [];
  let pointHistories: PointHistoryRow[] = [];

  if (childIds.length > 0) {
    const [
      { data: todoData, error: todoError },
      { data: goalData, error: goalError },
      { data: allowanceData, error: allowanceError },
      { data: pointData, error: pointError },
    ] = await Promise.all([
      supabase
        .from("todos")
        .select("id, child_id, title, completed, created_at")
        .in("child_id", childIds),
      supabase
        .from("point_goals")
        .select("id, child_id, title, achieved, created_at")
        .in("child_id", childIds),
      supabase
        .from("allowance_requests")
        .select("id, child_id, points, amount, status, created_at")
        .in("child_id", childIds)
        .order("created_at", { ascending: false }),
      supabase
        .from("point_histories")
        .select("id, child_id, type, points, description, created_at")
        .in("child_id", childIds)
        .order("created_at", { ascending: false }),
    ]);

    if (todoError) {
      console.error("부모 홈 할 일 조회 오류:", todoError);
    }
    if (goalError) {
      console.error("부모 홈 목표 조회 오류:", goalError);
    }
    if (allowanceError) {
      console.error("부모 홈 용돈 요청 조회 오류:", allowanceError);
    }
    if (pointError) {
      console.error("부모 홈 포인트 내역 조회 오류:", pointError);
    }

    todos = (todoData as TodoRow[]) ?? [];
    goals = (goalData as GoalRow[]) ?? [];
    allowanceRequests = (allowanceData as AllowanceRequestRow[]) ?? [];
    pointHistories = (pointData as PointHistoryRow[]) ?? [];
  }

  const childSummaries: ChildSummary[] = children.map((child) => {
    const childTodos = todos.filter((item) => item.child_id === child.id);
    const childGoals = goals.filter((item) => item.child_id === child.id);
    const childAllowanceRequests = allowanceRequests.filter(
      (item) => item.child_id === child.id
    );
    const childPointHistories = pointHistories.filter(
      (item) => item.child_id === child.id
    );

    const doneTodos = childTodos.filter((item) => item.completed).length;
    const activeGoals = childGoals.filter((item) => !item.achieved).length;

    const pendingAllowance = childAllowanceRequests.filter(
      (item) => item.status === "pending"
    );

    const currentPoints = childPointHistories.reduce(
      (sum, item) => sum + Number(item.points ?? 0),
      0
    );

    const latestPointHistory = childPointHistories[0];
    const recentActivity = latestPointHistory
      ? `${latestPointHistory.description || getPointTypeLabel(latestPointHistory.type)} ${
          Number(latestPointHistory.points) > 0 ? "+" : ""
        }${Number(latestPointHistory.points).toLocaleString()}P`
      : "최근 활동이 아직 없어요.";

    return {
      child,
      totalTodos: childTodos.length,
      doneTodos,
      totalGoals: childGoals.length,
      activeGoals,
      pendingAllowanceCount: pendingAllowance.length,
      pendingAllowancePoints: pendingAllowance.reduce(
        (sum, item) => sum + Number(item.points ?? 0),
        0
      ),
      currentPoints,
      recentActivity,
    };
  });

  const totalTodoCount = todos.length;
  const totalDoneTodoCount = todos.filter((item) => item.completed).length;
  const totalGoalCount = goals.length;

  const totalCurrentPoints = pointHistories.reduce(
    (sum, item) => sum + Number(item.points ?? 0),
    0
  );

  const pendingAllowanceRequests = allowanceRequests.filter(
    (item) => item.status === "pending"
  );

  const totalPendingAllowanceCount = pendingAllowanceRequests.length;
  const totalPendingAllowancePoints = pendingAllowanceRequests.reduce(
    (sum, item) => sum + Number(item.points ?? 0),
    0
  );

  const activeGoalCount = goals.filter((item) => !item.achieved).length;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">부모 홈</h1>
            <p className="mt-2 text-sm text-gray-600">
              자녀의 오늘 할 일, 목표, 포인트, 용돈 요청 현황을 한눈에 확인할 수 있어요.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/personal/parent/children"
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              자녀 관리
            </Link>
            <Link
              href="/personal/parent/timetable"
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              시간표 관리
            </Link>
            <Link
              href="/personal/parent/allowance"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              용돈 요청 관리
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          title="전체 할 일"
          value={`${totalDoneTodoCount} / ${totalTodoCount}`}
          description="완료된 할 일 수"
          href="/personal/parent/todo"
        />
        <DashboardCard
          title="현재 포인트"
          value={`${totalCurrentPoints.toLocaleString()}P`}
          description="자녀 전체 누적 포인트"
          href="/personal/parent/allowance"
        />
        <DashboardCard
          title="진행 중 목표"
          value={`${activeGoalCount}개`}
          description={`전체 목표 ${totalGoalCount}개 중`}
          href="/personal/parent/goals"
        />
        <DashboardCard
          title="대기 중 용돈 요청"
          value={`${totalPendingAllowanceCount}건`}
          description={`${totalPendingAllowancePoints.toLocaleString()}P 요청 중`}
          href="/personal/parent/allowance"
          highlight={totalPendingAllowanceCount > 0}
        />
      </section>

      {totalPendingAllowanceCount > 0 ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-800">
                확인이 필요한 용돈 요청이 있어요.
              </p>
              <p className="mt-1 text-sm text-amber-700">
                현재 {totalPendingAllowanceCount}건, 총{" "}
                {totalPendingAllowancePoints.toLocaleString()}P가 대기 중이에요.
              </p>
            </div>
            <Link
              href="/personal/parent/allowance"
              className="inline-flex rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
            >
              바로 확인하기
            </Link>
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900">자녀별 현황</h2>
          <p className="mt-1 text-sm text-gray-500">
            자녀별 진행률과 포인트, 용돈 요청 상태를 확인해보세요.
          </p>
        </div>

        {children.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
            <p className="text-sm text-gray-500">아직 등록된 자녀가 없습니다.</p>
            <Link
              href="/personal/parent/children"
              className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              자녀 등록하러 가기
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {childSummaries.map((summary) => {
              const progress =
                summary.totalTodos > 0
                  ? Math.round((summary.doneTodos / summary.totalTodos) * 100)
                  : 0;

              return (
                <div
                  key={summary.child.id}
                  className={`rounded-2xl border p-5 transition hover:shadow-sm ${
                    summary.pendingAllowanceCount > 0
                      ? "border-amber-200 bg-amber-50/30"
                      : "border-gray-200 bg-white hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-2xl font-bold text-gray-900">
                          {summary.child.name}
                        </h3>
                        {summary.pendingAllowanceCount > 0 ? (
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                            요청 {summary.pendingAllowanceCount}건
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        최근 활동: {summary.recentActivity}
                      </p>
                    </div>

                    <Link
                      href="/personal/parent/children"
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      관리하기
                    </Link>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-3">
                    <MiniStat
                      label="현재 포인트"
                      value={`${summary.currentPoints.toLocaleString()}P`}
                      emphasis
                    />
                    <MiniStat
                      label="할 일 완료"
                      value={`${summary.doneTodos}/${summary.totalTodos}`}
                    />
                    <MiniStat
                      label="진행 중 목표"
                      value={`${summary.activeGoals}개`}
                    />
                    <MiniStat
                      label="대기 요청"
                      value={`${summary.pendingAllowanceCount}건`}
                      warning={summary.pendingAllowanceCount > 0}
                    />
                    <MiniStat
                      label="요청 포인트"
                      value={`${summary.pendingAllowancePoints.toLocaleString()}P`}
                      warning={summary.pendingAllowancePoints > 0}
                    />
                    <MiniStat
                      label="전체 목표"
                      value={`${summary.totalGoals}개`}
                    />
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
                      <span>할 일 진행률</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-gray-100">
                      <div
                        className={`h-2.5 rounded-full transition-all ${getProgressBarClass(
                          progress
                        )}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                      href="/personal/parent/todo"
                      className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200"
                    >
                      할 일 관리
                    </Link>
                    <Link
                      href="/personal/parent/goals"
                      className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200"
                    >
                      목표 관리
                    </Link>
                    <Link
                      href="/personal/parent/allowance"
                      className={`rounded-lg px-3 py-2 text-xs font-medium ${
                        summary.pendingAllowanceCount > 0
                          ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                          : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                      }`}
                    >
                      용돈 요청 보기
                    </Link>
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

function DashboardCard({
  title,
  value,
  description,
  href,
  highlight = false,
}: {
  title: string;
  value: string;
  description: string;
  href: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-3xl p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        highlight
          ? "border border-amber-200 bg-amber-50"
          : "bg-white"
      }`}
    >
      <p className={`text-sm font-medium ${highlight ? "text-amber-700" : "text-gray-500"}`}>
        {title}
      </p>
      <p className="mt-3 text-3xl font-bold text-gray-900">{value}</p>
      <p className={`mt-2 text-sm ${highlight ? "text-amber-700" : "text-gray-500"}`}>
        {description}
      </p>
    </Link>
  );
}

function MiniStat({
  label,
  value,
  warning = false,
  emphasis = false,
}: {
  label: string;
  value: string;
  warning?: boolean;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`rounded-xl px-4 py-3 ${
        warning
          ? "bg-amber-50"
          : emphasis
          ? "bg-blue-50"
          : "bg-gray-50"
      }`}
    >
      <p
        className={`text-xs ${
          warning ? "text-amber-700" : emphasis ? "text-blue-700" : "text-gray-500"
        }`}
      >
        {label}
      </p>
      <p className="mt-1 text-base font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function getProgressBarClass(progress: number) {
  if (progress < 30) return "bg-rose-400";
  if (progress < 70) return "bg-amber-400";
  return "bg-blue-500";
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
      return "포인트 변동";
  }
}