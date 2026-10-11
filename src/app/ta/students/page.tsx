import { AppShell } from "@/components/AppShell";
import { Card, EmptyHint, Badge } from "@/components/Card";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function TaStudentsPage() {
  const session = await requireRole(["TA"]);
  const assignments = await prisma.tutorStudentAssignment.findMany({
    where: { taId: session.user.id },
    include: {
      student: {
        include: {
          documents: true,
          externalLessons: { orderBy: { createdAt: "desc" }, take: 3 },
          tasks: { orderBy: { createdAt: "desc" }, take: 5 },
        },
      },
    },
  });

  return (
    <AppShell name={session.user.name} role={session.user.role}>
      <h1 className="mb-6 text-2xl font-bold">学生档案整理</h1>
      <div className="space-y-4">
        {!assignments.length ? (
          <Card><EmptyHint>暂无学生</EmptyHint></Card>
        ) : (
          assignments.map((a) => (
            <Card
              key={a.id}
              title={a.student.chineseName}
              action={<Badge>{a.student.documents.length} 份资料</Badge>}
            >
              <p className="mb-3 text-sm text-slate-500">
                {a.student.targetSchool} · {a.student.targetCourse}
              </p>
              <div className="grid gap-4 md:grid-cols-2 text-sm">
                <div>
                  <p className="mb-1 text-xs font-medium text-slate-500">外部补习（最近）</p>
                  {!a.student.externalLessons.length ? (
                    <EmptyHint>暂无（Phase 2 可在此录入）</EmptyHint>
                  ) : (
                    <ul className="space-y-1">
                      {a.student.externalLessons.map((l) => (
                        <li key={l.id}>{l.title}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-slate-500">任务跟进</p>
                  {!a.student.tasks.length ? (
                    <EmptyHint>暂无任务</EmptyHint>
                  ) : (
                    <ul className="space-y-1">
                      {a.student.tasks.map((t) => (
                        <li key={t.id} className="flex justify-between gap-2">
                          <span>{t.title}</span>
                          <Badge>{t.status}</Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </AppShell>
  );
}
