import { requireParent } from "@/lib/auth/requireParent";
import ParentSidebar from "./ParentSidebar";
import ParentTopbar from "./ParentTopbar";

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireParent();

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="hidden w-64 border-r bg-white md:block">
          <ParentSidebar />
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <ParentTopbar profile={profile} />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}