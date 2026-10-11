import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/Card";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const session = await requireRole(["ADMIN"]);
  const [users, students, interviews] = await Promise.all([
    prisma.user.count(),
    prisma.studentProfile.count(),
    prisma.interviewSession.count(),
  ]);

  return (
    <AppShell name={session.user.name} role={session.user.role}>
      <h1 className="mb-6 text-2xl font-bold">管理后台</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><p className="text-sm text-slate-500">用户数</p><p className="text-2xl font-bold">{users}</p></Card>
        <Card><p className="text-sm text-slate-500">学生档案</p><p className="text-2xl font-bold">{students}</p></Card>
        <Card><p className="text-sm text-slate-500">面试场次</p><p className="text-2xl font-bold">{interviews}</p></Card>
      </div>
      <p className="mt-6 text-sm text-slate-500">账号管理、权限分配等将在后续版本完善。</p>
    </AppShell>
  );
}
