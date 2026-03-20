export default function MePage() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-bold">내 관리</h1>
      <p className="mt-3 text-gray-600">
        내 일정, 할 일, 메모, 생활비 등을 정리하는 화면입니다.
      </p>

      <div className="mt-8 rounded-2xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold">넣을 기능</h2>
        <div className="mt-4 space-y-2 text-gray-700">
          <p>• 내 일정 등록</p>
          <p>• 할 일 관리</p>
          <p>• 개인 메모</p>
          <p>• 생활비/개인 지출 관리</p>
        </div>
      </div>
    </main>
  );
}