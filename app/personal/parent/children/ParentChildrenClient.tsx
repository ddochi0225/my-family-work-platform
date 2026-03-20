"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Child = {
  id: string;
  name: string;
  parent_id: string;
  created_at?: string | null;
};

type ParentChildrenClientProps = {
  parentId: string;
  initialChildren: Child[];
};

export default function ParentChildrenClient({
  parentId,
  initialChildren,
}: ParentChildrenClientProps) {
  const [children, setChildren] = useState<Child[]>(initialChildren);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  async function fetchChildren() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("children")
      .select("id, name, parent_id, created_at")
      .eq("parent_id", parentId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("자녀 조회 오류:", error);
      setMessage(`자녀 목록을 불러오지 못했습니다: ${error.message}`);
      setLoading(false);
      return;
    }

    setChildren((data as Child[]) ?? []);
    setLoading(false);
  }

  function resetForm() {
    setName("");
    setEditingId(null);
  }

  async function handleSave() {
    setMessage("");

    const trimmedName = name.trim();

    if (!parentId) {
      setMessage("부모 계정 정보를 불러오지 못했어요.");
      return;
    }

    if (!trimmedName) {
      setMessage("자녀 이름을 입력해 주세요.");
      return;
    }

    const duplicated = children.find(
      (child) =>
        child.name.trim().toLowerCase() === trimmedName.toLowerCase() &&
        child.id !== editingId
    );

    if (duplicated) {
      setMessage("같은 이름의 자녀가 이미 등록되어 있습니다.");
      return;
    }

    setLoading(true);

    if (editingId) {
      const { error } = await supabase
        .from("children")
        .update({ name: trimmedName })
        .eq("id", editingId)
        .eq("parent_id", parentId);

      if (error) {
        console.error("자녀 수정 오류:", error);
        setMessage(`자녀 수정 실패: ${error.message}`);
        setLoading(false);
        return;
      }

      setMessage("자녀 이름이 수정되었습니다.");
    } else {
      const { error } = await supabase.from("children").insert([
        {
          name: trimmedName,
          parent_id: parentId,
        },
      ]);

      if (error) {
        console.error("자녀 등록 오류:", error);
        setMessage(`자녀 등록 실패: ${error.message}`);
        setLoading(false);
        return;
      }

      setMessage("자녀가 등록되었습니다.");
    }

    resetForm();
    await fetchChildren();
  }

  function handleEdit(child: Child) {
    setEditingId(child.id);
    setName(child.name);
    setMessage("이름을 수정한 뒤 저장해 주세요.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(child: Child) {
    const ok = window.confirm(
      `"${child.name}" 자녀를 삭제할까요?\n연결된 일정이 있으면 삭제되지 않을 수 있어요.`
    );
    if (!ok) return;

    setLoading(true);

    const { error } = await supabase
      .from("children")
      .delete()
      .eq("id", child.id)
      .eq("parent_id", parentId);

    if (error) {
      console.error("자녀 삭제 오류:", error);
      setMessage(`자녀 삭제 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    if (editingId === child.id) {
      resetForm();
    }

    setMessage("자녀가 삭제되었습니다.");
    await fetchChildren();
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">자녀 관리</h1>
            <p className="mt-2 text-sm text-gray-600">
              자녀별 프로필을 등록하고, 일정/시간표/용돈 기능과 연결할 수 있어요.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/personal/parent/timetable"
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
            >
              시간표
            </Link>
            <Link
              href="/personal/parent/allowance"
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
            >
              포인트 / 용돈
            </Link>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">
              {editingId ? "자녀 이름 수정" : "자녀 추가"}
            </h2>

            {editingId && (
              <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
                수정 중
              </span>
            )}
          </div>

          {message && <p className="mt-3 text-sm text-blue-600">{message}</p>}

          <div className="mt-4 grid gap-4">
            <input
              type="text"
              placeholder="자녀 이름을 입력하세요"
              className="rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
              >
                {loading ? "처리 중..." : editingId ? "수정 저장" : "자녀 추가"}
              </button>

              {editingId && (
                <button
                  onClick={resetForm}
                  disabled={loading}
                  className="rounded-xl border border-gray-300 px-4 py-3 text-sm hover:bg-gray-50 disabled:opacity-60"
                >
                  취소
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">등록된 자녀</h2>

          {loading && children.length === 0 ? (
            <p className="mt-6 text-sm text-gray-500">불러오는 중...</p>
          ) : children.length === 0 ? (
            <p className="mt-6 text-sm text-gray-500">등록된 자녀가 없습니다.</p>
          ) : (
            <div className="mt-6 space-y-3">
              {children.map((child) => (
                <div
                  key={child.id}
                  className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-4"
                >
                  <div>
                    <p className="font-medium text-gray-900">{child.name}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      ID: {child.id.slice(0, 8)}...
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(child)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(child)}
                      className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}