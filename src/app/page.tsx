import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function IndexPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/home");
  } else {
    redirect("/sign-in");
  }
}
