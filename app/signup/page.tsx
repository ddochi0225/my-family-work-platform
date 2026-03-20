"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Role = "parent" | "child";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("parent");

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const trimmedName = name.trim();
      const trimmedEmail = email.trim().toLowerCase();

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
      });

      if (signUpError) {
        setErrorMessage(signUpError.message);
        return;
      }

      const user = signUpData.user;

      if (!user) {
        setErrorMessage("회원가입은 되었지만 사용자 정보를 확인하지 못했습니다.");
        return;
      }

      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        email: trimmedEmail,
        role,
        name: trimmedName || null,
      });

      if (profileError) {
        setErrorMessage(
          "회원가입은 되었지만 프로필 저장에 실패했습니다. profiles 테이블 정책을 확인해 주세요."
        );
        return;
      }

      setSuccessMessage("회원가입이 완료되었습니다. 로그인 화면으로 이동합니다.");

      setTimeout(() => {
        router.replace("/login");
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error("회원가입 오류:", error);
      setErrorMessage("회원가입 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">누누 회원가입</h1>
          <p className="mt-2 text-sm text-gray-600">
            부모 또는 자녀 계정을 새로 만들 수 있어요.
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              이름
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력하세요"
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
              disabled={submitting}
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              이메일
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@naver.com"
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
              disabled={submitting}
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
              disabled={submitting}
              required
              minLength={6}
            />
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium text-gray-700">
              계정 유형
            </span>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("parent")}
                disabled={submitting}
                className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                  role === "parent"
                    ? "border-sky-600 bg-sky-50 text-sky-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                부모
              </button>

              <button
                type="button"
                onClick={() => setRole("child")}
                disabled={submitting}
                className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                  role === "child"
                    ? "border-sky-600 bg-sky-50 text-sky-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                자녀
              </button>
            </div>
          </div>

          {errorMessage ? (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {errorMessage}
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-600">
              {successMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "가입 중..." : "회원가입"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">이미 계정이 있나요?</p>
          <Link
            href="/login"
            className="mt-3 inline-flex rounded-2xl border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            로그인 하러가기
          </Link>
        </div>
      </div>
    </main>
  );
}