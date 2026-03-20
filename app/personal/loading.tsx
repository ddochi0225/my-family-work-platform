export default function PersonalLoading() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-indigo-50 px-6 py-12">
      <div className="mx-auto max-w-md">
        <div className="rounded-[32px] border border-sky-100 bg-white/90 p-8 shadow-[0_20px_60px_rgba(59,130,246,0.12)] backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-2xl">
              🏠
            </div>
            <div>
              <p className="text-sm font-bold tracking-wide text-sky-600">
                NUNU PLATFORM
              </p>
              <h1 className="text-2xl font-extrabold text-gray-900">
                홈으로 이동 중
              </h1>
            </div>
          </div>

          <p className="mt-4 text-base leading-7 text-gray-600">
            계정을 확인하고 있어요.
            <br />
            잠시만 기다리면 바로 들어갈게요.
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <span className="h-4 w-4 animate-bounce rounded-full bg-sky-400 [animation-delay:-0.2s]" />
            <span className="h-4 w-4 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.1s]" />
            <span className="h-4 w-4 animate-bounce rounded-full bg-pink-400" />
          </div>

          <div className="mt-8 rounded-3xl bg-gradient-to-r from-sky-50 to-indigo-50 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">
                이동 준비 중
              </span>
              <span className="text-lg">✨</span>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-sky-400 to-indigo-400" />
            </div>

            <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white">
                💙
              </span>
              <span>부모/자녀 홈 화면을 불러오고 있어요.</span>
            </div>
          </div>
        </div>

        <div className="pointer-events-none relative">
          <div className="absolute -left-2 top-4 text-2xl opacity-70 animate-pulse">
            ⭐
          </div>
          <div className="absolute right-2 top-0 text-2xl opacity-70 animate-bounce">
            🌈
          </div>
          <div className="absolute left-10 top-56 text-xl opacity-60 animate-pulse">
            💫
          </div>
        </div>
      </div>
    </main>
  );
}