import { AppShell } from "@/components/AppShell";
import { Card, EmptyHint, Badge } from "@/components/Card";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { RecordUploadForm } from "./RecordUploadForm";

export default async function TaRecordsPage() {
  const session = await requireRole(["TA"]);

  const studentIds = (
    await prisma.tutorStudentAssignment.findMany({
      where: { taId: session.user.id },
      select: { studentId: true },
    })
  ).map((a) => a.studentId);

  const interviews = await prisma.interviewSession.findMany({
    where: { studentId: { in: studentIds } },
    orderBy: { scheduledAt: "desc" },
    include: {
      student: true,
      records: { orderBy: { createdAt: "desc" } },
    },
  });

  return (
    <AppShell name={session.user.name} role={session.user.role}>
      <h1 className="mb-6 text-2xl font-bold">面试记录上传</h1>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="上传记录（文件或链接）">
          <RecordUploadForm
            interviews={interviews.map((iv) => ({
              id: iv.id,
              label: `${iv.student.chineseName} · ${iv.title}`,
            }))}
          />
        </Card>
        <Card title="已有记录">
          {!interviews.length ? (
            <EmptyHint>暂无面试场次</EmptyHint>
          ) : (
            <ul className="space-y-4">
              {interviews.map((iv) => (
                <li key={iv.id} className="rounded-lg border border-slate-100 p-3 text-sm">
                  <p className="font-medium">
                    {iv.student.chineseName} · {iv.title}
                  </p>
                  {!iv.records.length ? (
                    <p className="mt-1 text-slate-400">尚无记录</p>
                  ) : (
                    <ul className="mt-2 space-y-1">
                      {iv.records.map((r) => (
                        <li key={r.id} className="flex items-center justify-between gap-2">
                          <span>{r.title}</span>
                          <Badge>{r.recordType}</Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
