import LogoutButton from "@/components/shared/LogoutButton";

type ChildTopbarProps = {
  profile: {
    email?: string | null;
    name?: string | null;
  };
};

export default function ChildTopbar({ profile }: ChildTopbarProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-sky-100 bg-white/95 px-4 py-4 backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-sky-600">NUNU</p>
          <h1 className="text-lg font-bold text-gray-900">
            {profile.name || "자녀 계정"}
          </h1>
          <p className="text-xs text-gray-500">
            오늘 해야 할 일을 확인해보자
          </p>
        </div>

        <LogoutButton />
      </div>
    </header>
  );
}