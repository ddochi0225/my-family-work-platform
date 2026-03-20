"use client";

import { Home, CheckSquare, Calendar, Clock3, Coins, Target } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/auth/LogoutButton";

const menuItems = [
  {
    href: "/personal/child",
    label: "홈",
    icon: Home,
    match: (pathname: string) => pathname === "/personal/child",
  },
  {
    href: "/personal/child/todo",
    label: "할 일",
    icon: CheckSquare,
    match: (pathname: string) => pathname.startsWith("/personal/child/todo"),
  },
  {
    href: "/personal/child/schedule",
    label: "일정",
    icon: Calendar,
    match: (pathname: string) => pathname.startsWith("/personal/child/schedule"),
  },
  {
    href: "/personal/child/timetable",
    label: "시간표",
    icon: Clock3,
    match: (pathname: string) => pathname.startsWith("/personal/child/timetable"),
  },
  {
    href: "/personal/child/goals",
    label: "목표",
    icon: Target,
    match: (pathname: string) => pathname.startsWith("/personal/child/goals"),
  },
  {
    href: "/personal/child/allowance",
    label: "포인트",
    icon: Coins,
    match: (pathname: string) => pathname.startsWith("/personal/child/allowance"),
  },
];

export default function ChildSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-64 shrink-0 flex-col rounded-3xl border border-slate-200 bg-white p-5 lg:flex">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-blue-500">
          Child Mode
        </p>
        <h2 className="mt-2 text-3xl font-extrabold text-slate-900">자녀 메뉴</h2>
        <p className="mt-2 text-sm text-slate-500">
          오늘 할 일과 시간표를 쉽게 확인해요.
        </p>
      </div>

      <nav className="mt-6 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = item.match(pathname);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                active
                  ? "bg-blue-50 text-blue-600 ring-1 ring-blue-200"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-slate-200 pt-4">
        <LogoutButton redirectTo="/personal" />
      </div>
    </aside>
  );
}
