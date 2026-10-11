import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Card, EmptyHint, Badge } from "@/components/Card";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function TutorStudentsPage() {
  const session = await requireRole(["TUTOR"]);
  const assignments = await prisma.tutorStudentAssignment.findMany({
    where: { tutorId: session.user.id },
    include: { student: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <AppShell name={session.user.name} role={session.user.role}>
      <h1 className="mb-6 text-2xl font-bold">我的学生</h1>
      <Card>
        {!assignments.length ? (
          <EmptyHint>暂无学生</EmptyHint>
        ) : (
          <ul className="divide-y divide-slate-100">
            {assignments.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/tutor/students/${a.student.id}`}
                  className="flex items-center justify-between gap-3 py-3 hover:bg-slate-50"
                >
                  <div>
                    <p className="font-medium">{a.student.chineseName}</p>
                    <p className="text-sm text-slate-500">
                      {a.student.targetSchool} · {a.student.targetCourse}
                    </p>
                  </div>
                  {a.roleNote && <Badge>{a.roleNote}</Badge>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </AppShell>
  );
}
