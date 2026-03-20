"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");

  const getKoreanErrorMessage = (message: string) => {
    const lower = message.toLowerCase();

    if (lower.includes("invalid login credentials")) {
      return "이메일 또는 비밀번호가 올바르지 않습니다.";
    }

    if (lower.includes("email not confirmed")) {
      return "이메일 인증이 완료되지 않았습니다.";
    }

    if (lower.includes("too many requests")) {
      return "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
    }

    return "로그인 중 오류가 발생했습니다. 다시 시도해주세요.";
  };

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (loading) return;

    setErrorMessage("");
    setLoading(true);
    setProgressMessage("로그인 중입니다...");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setErrorMessage(getKoreanErrorMessage(error.message));
      setProgressMessage("");
      setLoading(false);
      return;
    }

    setProgressMessage("계정을 확인하고 이동 중입니다...");

    router.replace("/personal");
  };

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-md rounded-[28px] border border-gray-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-bold tracking-wide text-blue-600">
          NUNU PLATFORM
        </p>

        <h1 className="mt-3 text-5xl font-extrabold tracking-tight text-gray-900">
          로그인
        </h1>

        <p className="mt-3 text-base text-gray-500">
          부모 또는 자녀 계정으로 로그인해 주세요.
        </p>

        <form onSubmit={handleLogin} className="mt-10 space-y-6">
          <div>
            <label
              htmlFor="email"
              className="mb-3 block text-xl font-bold text-gray-800"
            >
              이메일
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full rounded-3xl border border-gray-300 px-5 py-4 text-lg outline-none transition focus:border-sky-500 disabled:bg-gray-100"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-3 block text-xl font-bold text-gray-800"
            >
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="비밀번호를 입력해 주세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full rounded-3xl border border-gray-300 px-5 py-4 text-lg outline-none transition focus:border-sky-500 disabled:bg-gray-100"
              required
            />
          </div>

          {errorMessage ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-base text-red-600">
              {errorMessage}
            </div>
          ) : null}

          {loading ? (
            <div className="rounded-3xl border border-blue-200 bg-blue-50 px-5 py-4 text-base text-blue-700">
              {progressMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-3xl bg-sky-600 px-5 py-4 text-lg font-bold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between gap-3 text-sm text-gray-500">
          <Link href="/signup" className="hover:text-gray-700">
            회원가입
          </Link>
          <Link href="/reset-password" className="hover:text-gray-700">
            비밀번호 재설정
          </Link>
        </div>
      </div>
    </main>
  );
}