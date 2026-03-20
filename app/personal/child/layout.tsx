import type { ReactNode } from "react";
import { requireChild } from "@/lib/auth/requireChild";
import ChildSidebar from "./ChildSidebar";
import ChildBottomNav from "./ChildBottomNav";

export default async function ChildLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireChild();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-4 md:px-6 lg:px-8">
        <ChildSidebar />
        <div className="min-w-0 flex-1 pb-24 lg:pb-6">{children}</div>
      </div>

      <ChildBottomNav />
    </div>
  );
}