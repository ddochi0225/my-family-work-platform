import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

export async function getCurrentProfile() {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, role, child_id")
    .eq("id", user.id)
    .single();

  if (error || !data) redirect("/login");

  return {
    ...data,
    name: null,
    role: String(data.role ?? "").trim().toLowerCase(),
  };
}