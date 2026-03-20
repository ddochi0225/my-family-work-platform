export default function PersonalLoading() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-md rounded-[28px] border border-gray-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-bold tracking-wide text-blue-600">
          NUNU PLATFORM
        </p>

        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900">
          이동 중
        </h1>

        <p className="mt-3 text-base text-gray-500">
          계정을 확인하고 홈으로 이동하고 있어요.
        </p>

        <div className="mt-8 space-y-3">
          <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    </main>
  );
}