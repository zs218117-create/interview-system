import { redirect } from "next/navigation";
import { requireSession, roleHomePath } from "@/lib/session";

export default async function DashboardPage() {
  const session = await requireSession();
  redirect(roleHomePath(session.user.role));
}
