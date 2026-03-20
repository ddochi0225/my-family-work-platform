import { redirect } from "next/navigation";
import { getCurrentProfile } from "./getCurrentProfile";

export async function requireChild() {
  const profile = await getCurrentProfile();

  if (profile.role !== "child") {
    redirect("/personal");
  }

  return profile;
}