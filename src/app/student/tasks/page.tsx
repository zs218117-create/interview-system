import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Card, EmptyHint, Badge } from "@/components/Card";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { statusLabel } from "@/lib/labels";
import { TaskDoneButton } from "./TaskDoneButton";

export default async function StudentTasksPage() {
  const session = await requireRole(["STUDENT"]);
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
  });
  const tasks = profile
    ? await prisma.task.findMany({
        where: { studentId: profile.id },
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      })
    : [];

  return (
    <AppShell name={session.user.name} role={session.user.role}>
      <h1 className="mb-6 text-2xl font-bold">我的任务</h1>
      <Card>
        {!tasks.length ? (
          <EmptyHint>暂无任务</EmptyHint>
        ) : (
          <ul className="space-y-3">
            {tasks.map((t) => (
              <li key={t.id} className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-slate-100 p-3 text-sm">
                <div>
                  <p className="font-medium">{t.title}</p>
                  {t.description && <p className="mt-1 text-slate-600">{t.description}</p>}
                  {t.title.includes("再次回答") && (
                    <Link href="/student/feedback" className="mt-1 inline-block text-indigo-600 hover:underline">
                      去反馈页提交 →
                    </Link>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{statusLabel(t.status)}</Badge>
                  <TaskDoneButton taskId={t.id} status={t.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </AppShell>
  );
}
