"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");

  const updatePassword = async () => {
    if (!password) {
      alert("새 비밀번호를 입력해주세요.");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      alert(`비밀번호 변경 오류: ${error.message}`);
      return;
    }

    alert("비밀번호가 변경되었어요. 다시 로그인해주세요.");
    window.location.href = "/login";
  };

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold">비밀번호 재설정</h1>
        <p className="mt-2 text-sm text-gray-600">
          새 비밀번호를 입력해주세요.
        </p>

        <div className="mt-8 space-y-4">
          <input
            type="password"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
            placeholder="새 비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="button"
            onClick={updatePassword}
            className="w-full rounded-xl bg-black px-4 py-3 text-white"
          >
            비밀번호 변경
          </button>
        </div>
      </div>
    </main>
  );
}