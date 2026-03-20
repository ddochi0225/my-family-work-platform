import { redirect } from "next/navigation";
import { getCurrentProfile } from "./getCurrentProfile";

export async function requireParent() {
  const profile = await getCurrentProfile();

  if (profile.role !== "parent") {
    redirect("/personal");
  }

  return profile;
}