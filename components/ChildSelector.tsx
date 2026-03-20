"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Child = {
  id: string;
  name: string;
  created_at?: string;
};

type Props = {
  value: string;
  onChange: (id: string) => void;
};

const STORAGE_KEY = "selectedChildId";

export default function ChildSelector({ value, onChange }: Props) {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChildren();
  }, []);

  async function fetchChildren() {
    setLoading(true);

    const { data, error } = await supabase
      .from("children")
      .select("id, name, created_at")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("ChildSelector children 조회 오류:", error);
      setChildren([]);
      setLoading(false);
      return;
    }

    const childList = (data as Child[]) ?? [];
    setChildren(childList);

    if (childList.length === 0) {
      setLoading(false);
      return;
    }

    const savedChildId =
      typeof window !== "undefined"
        ? localStorage.getItem(STORAGE_KEY)
        : null;

    const validSavedChild = childList.find((child) => child.id === savedChildId);

    if (!value) {
      if (validSavedChild) {
        onChange(validSavedChild.id);
      } else {
        onChange(childList[0].id);
      }
    }

    setLoading(false);
  }

  function handleSelectChange(id: string) {
    onChange(id);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, id);
    }
  }

  return (
    <div className="min-w-[220px]">
      <label className="mb-2 block text-sm font-medium text-gray-700">
        자녀 선택
      </label>

      <select
        value={value}
        onChange={(e) => handleSelectChange(e.target.value)}
        disabled={loading}
        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500 disabled:bg-gray-100"
      >
        {loading ? (
          <option value="">불러오는 중...</option>
        ) : children.length === 0 ? (
          <option value="">등록된 자녀가 없습니다</option>
        ) : (
          children.map((child) => (
            <option key={child.id} value={child.id}>
              {child.name}
            </option>
          ))
        )}
      </select>
    </div>
  );
}