"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CheckSquare,
  Coins,
  Home,
  Target,
  TimerReset,
} from "lucide-react";

const menus = [
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
    icon: CalendarDays,
    match: (pathname: string) =>
      pathname.startsWith("/personal/child/schedule"),
  },
  {
    href: "/personal/child/timetable",
    label: "시간표",
    icon: TimerReset,
    match: (pathname: string) =>
      pathname.startsWith("/personal/child/timetable"),
  },
  {
    href: "/personal/child/goals",
    label: "목표",
    icon: Target,
    match: (pathname: string) =>
      pathname.startsWith("/personal/child/goals"),
  },
  {
    href: "/personal/child/allowance",
    label: "포인트",
    icon: Coins,
    match: (pathname: string) =>
      pathname.startsWith("/personal/child/allowance"),
  },
];

export default function ChildBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-3xl grid-cols-6">
        {menus.map((menu) => {
          const active = menu.match(pathname);
          const Icon = menu.icon;

          return (
            <Link
              key={menu.href}
              href={menu.href}
              className={`flex min-h-[68px] flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-medium ${
                active ? "text-sky-600" : "text-slate-500"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{menu.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
