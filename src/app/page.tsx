import { redirect } from "next/navigation";
import { getSession, roleHomePath } from "@/lib/session";

export default async function HomePage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  redirect(roleHomePath(session.user.role));
}
