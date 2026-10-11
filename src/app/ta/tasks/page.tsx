import { AppShell } from "@/components/AppShell";
import { Card, EmptyHint, Badge } from "@/components/Card";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { statusLabel } from "@/lib/labels";
import { CreateTaskForm, ExternalLessonForm, TaskStatusButtons } from "./TaskForms";

export default async function TaTasksPage() {
  const session = await requireRole(["TA"]);
  const assignments = await prisma.tutorStudentAssignment.findMany({
    where: { taId: session.user.id },
    include: {
      student: {
        include: {
          user: true,
          tasks: { orderBy: { createdAt: "desc" } },
          externalLessons: { orderBy: { createdAt: "desc" }, take: 5 },
        },
      },
    },
  });

  const students = assignments.map((a) => ({
    id: a.student.id,
    name: a.student.chineseName,
    userId: a.student.userId,
  }));

  const allTasks = assignments.flatMap((a) =>
    a.student.tasks.map((t) => ({
      ...t,
      studentName: a.student.chineseName,
    }))
  );

  return (
    <AppShell name={session.user.name} role={session.user.role}>
      <h1 className="mb-6 text-2xl font-bold">任务跟进与外部补习</h1>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="创建任务">
          <CreateTaskForm students={students} />
        </Card>
        <Card title="录入外部补习">
          <ExternalLessonForm students={students} />
        </Card>
        <Card title="任务列表" action={<span className="text-xs text-slate-400">{allTasks.length} 条</span>}>
          {!allTasks.length ? (
            <EmptyHint>暂无任务</EmptyHint>
          ) : (
            <ul className="space-y-3" id="ta-task-list">
              {allTasks.map((t) => (
                <li key={t.id} className="rounded-lg border border-slate-100 p-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{t.title}</p>
                      <p className="text-xs text-slate-400">
                        {t.studentName}
                        {t.dueDate
                          ? ` · 截止 ${new Date(t.dueDate).toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai" })}`
                          : ""}
                      </p>
                      {t.description && <p className="mt-1 text-slate-600">{t.description}</p>}
                    </div>
                    <Badge>{statusLabel(t.status)}</Badge>
                  </div>
                  <div className="mt-2">
                    <TaskStatusButtons taskId={t.id} status={t.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="最近外部补习">
          {assignments.every((a) => !a.student.externalLessons.length) ? (
            <EmptyHint>暂无记录</EmptyHint>
          ) : (
            <ul className="space-y-2 text-sm">
              {assignments.flatMap((a) =>
                a.student.externalLessons.map((l) => (
                  <li key={l.id} className="rounded-lg border border-slate-100 p-2">
                    <p className="font-medium">
                      {a.student.chineseName} · {l.title}
                    </p>
                    <p className="text-slate-500">{l.content}</p>
                  </li>
                ))
              )}
            </ul>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
