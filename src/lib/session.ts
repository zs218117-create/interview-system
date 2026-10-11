import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { redirect } from "next/navigation";
import type { Role } from "@/types/roles";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireSession() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  return session;
}

export async function requireRole(roles: Role[]) {
  const session = await requireSession();
  if (!roles.includes(session.user.role)) {
    redirect("/dashboard");
  }
  return session;
}

export function roleHomePath(role: Role): string {
  switch (role) {
    case "STUDENT":
      return "/student";
    case "TUTOR":
      return "/tutor";
    case "TA":
      return "/ta";
    case "ADMIN":
      return "/admin";
    default:
      return "/dashboard";
  }
}
