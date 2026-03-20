import { redirect } from "next/navigation";

export default function ChildHomeRedirectPage() {
  redirect("/personal/child");
}