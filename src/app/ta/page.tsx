import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Card, EmptyHint, Badge } from "@/components/Card";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function TaHomePage() {
  const session = await requireRole(["TA"]);
  const assignments = await prisma.tutorStudentAssignment.findMany({
    where: { taId: session.user.id },
    include: {
      student: {
        include: {
          tasks: { where: { status: { not: "DONE" } } },
        },
      },
    },
  });

  const pendingTasks = await prisma.task.count({
    where: {
      status: { not: "DONE" },
      student: { assignments: { some: { taId: session.user.id } } },
    },
  });

  return (
    <AppShell name={session.user.name} role={session.user.role}>
      <h1 className="mb-2 text-2xl font-bold">助教工作台</h1>
      <p className="mb-6 text-sm text-slate-500">整理资料、上传面试记录、跟进任务完成情况</p>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">负责学生</p>
          <p className="mt-1 text-2xl font-bold">{assignments.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">未完成任务</p>
          <p className="mt-1 text-2xl font-bold">{pendingTasks}</p>
        </Card>
        <Card>
          <div className="flex flex-col gap-2">
            <Link href="/ta/students" className="text-sm text-indigo-600 hover:underline">学生档案 →</Link>
            <Link href="/ta/records" className="text-sm text-indigo-600 hover:underline">上传面试记录 →</Link>
            <Link href="/ta/tasks" className="text-sm text-indigo-600 hover:underline">任务与外课 →</Link>
          </div>
        </Card>
      </div>

      <Card title="我跟进的学生">
        {!assignments.length ? (
          <EmptyHint>暂无分配</EmptyHint>
        ) : (
          <ul className="divide-y divide-slate-100">
            {assignments.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium">{a.student.chineseName}</p>
                  <p className="text-slate-500">{a.student.targetSchool}</p>
                </div>
                <Badge>待办 {a.student.tasks.length}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </AppShell>
  );
}
