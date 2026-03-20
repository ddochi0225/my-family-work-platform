"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menus = [
  { href: "/personal/child", label: "홈", emoji: "🏠" },
  { href: "/personal/child/timetable", label: "시간표", emoji: "🗓️" },
  { href: "/personal/child/schedule", label: "일정", emoji: "📅" },
  { href: "/personal/child/todo", label: "할 일", emoji: "✅" },
  { href: "/personal/child/allowance", label: "포인트", emoji: "💰" },
];

export default function ChildBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="grid grid-cols-5 border-t border-sky-100 bg-white">
      {menus.map((menu) => {
        const active = pathname === menu.href;

        return (
          <Link
            key={menu.href}
            href={menu.href}
            className={`flex flex-col items-center gap-1 px-2 py-3 text-xs transition ${
              active ? "font-semibold text-sky-600" : "text-gray-400"
            }`}
          >
            <span className="text-base">{menu.emoji}</span>
            <span>{menu.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}