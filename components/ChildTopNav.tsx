"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menus = [
  { href: "/personal/child-home", label: "홈" },
  { href: "/personal/child/schedule", label: "일정" },
  { href: "/personal/child/timetable", label: "시간표" },
  { href: "/personal/child/todo", label: "할 일" },
  { href: "/personal/child/allowance", label: "용돈" },
];

export default function ChildTopNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-2">
      {menus.map((menu) => {
        const active = pathname === menu.href;

        return (
          <Link
            key={menu.href}
            href={menu.href}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              active
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
            }`}
          >
            {menu.label}
          </Link>
        );
      })}
    </div>
  );
}