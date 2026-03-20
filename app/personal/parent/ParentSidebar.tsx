"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menus = [
  { name: "홈", href: "/personal/parent" },
  { name: "자녀 관리", href: "/personal/parent/children" },
  { name: "시간표", href: "/personal/parent/timetable" },
  { name: "할 일 / 보상", href: "/personal/parent/todo" },
  { name: "포인트 / 용돈", href: "/personal/parent/allowance" },
  { name: "목표", href: "/personal/parent/goals" },
];

export default function ParentSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex h-full flex-col gap-2 p-4">
      <p className="mb-4 text-lg font-bold text-gray-900">부모 메뉴</p>

      {menus.map((menu) => {
        const isHome = menu.href === "/personal/parent";
        const isActive = isHome
          ? pathname === menu.href
          : pathname === menu.href || pathname.startsWith(menu.href + "/");

        return (
          <Link
            key={menu.href}
            href={menu.href}
            className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
              isActive
                ? "bg-sky-600 text-white shadow"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {menu.name}
          </Link>
        );
      })}
    </nav>
  );
}