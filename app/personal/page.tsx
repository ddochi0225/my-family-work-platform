import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";

export default async function PersonalPage() {
  const profile = await getCurrentProfile();

  if (profile.role === "parent") {
    redirect("/personal/parent");
  }

  if (profile.role === "child") {
    redirect("/personal/child");
  }

  redirect("/login");
}