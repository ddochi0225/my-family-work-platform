import LogoutButton from "@/components/auth/LogoutButton";

type Props = {
  profile: {
    email?: string | null;
    role?: string | null;
  };
};

export default function ParentTopbar({ profile }: Props) {
  return (
    <header className="border-b bg-white">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <p className="text-lg font-semibold text-gray-900">부모 페이지</p>
          <p className="mt-1 text-sm text-gray-500">
            {profile.email ?? "로그인 사용자"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
            {profile.role === "parent" ? "부모 계정" : profile.role ?? "사용자"}
          </span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}