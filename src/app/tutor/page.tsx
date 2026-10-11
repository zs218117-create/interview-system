import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Card, EmptyHint, Badge } from "@/components/Card";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function TutorHomePage() {
  const session = await requireRole(["TUTOR"]);
  const assignments = await prisma.tutorStudentAssignment.findMany({
    where: { tutorId: session.user.id },
    include: {
      student: {
        include: {
          user: true,
          interviews: {
            where: { status: "SCHEDULED" },
            orderBy: { scheduledAt: "asc" },
            take: 1,
          },
        },
      },
    },
  });

  return (
    <AppShell name={session.user.name} role={session.user.role}>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">导师工作台</h1>
          <p className="mt-1 text-sm text-slate-500">点开学生即可查看背景、表现与待解决问题</p>
        </div>
        <Link href="/tutor/students" className="text-sm text-indigo-600 hover:underline">
          全部学生 →
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {!assignments.length ? (
          <Card><EmptyHint>暂无分配学生</EmptyHint></Card>
        ) : (
          assignments.map((a) => (
            <Link
              key={a.id}
              href={`/tutor/students/${a.student.id}`}
              className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-semibold">{a.student.chineseName}</h2>
                {a.roleNote && <Badge>{a.roleNote}</Badge>}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {a.student.targetSchool} · {a.student.targetCourse}
              </p>
              {a.student.interviews[0] ? (
                <p className="mt-3 text-xs text-slate-400">
                  下次面试：
                  {new Date(a.student.interviews[0].scheduledAt).toLocaleString("zh-CN", {
                    timeZone: "Asia/Shanghai",
                  })}
                </p>
              ) : (
                <p className="mt-3 text-xs text-slate-400">暂无待进行面试</p>
              )}
            </Link>
          ))
        )}
      </div>
    </AppShell>
  );
}
