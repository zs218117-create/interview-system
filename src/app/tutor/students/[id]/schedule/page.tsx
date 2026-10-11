import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/Card";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ScheduleForm } from "./ScheduleForm";

export default async function ScheduleInterviewPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await requireRole(["TUTOR"]);
  const assignment = await prisma.tutorStudentAssignment.findFirst({
    where: { tutorId: session.user.id, studentId: params.id },
    include: { student: true },
  });
  if (!assignment) notFound();

  const questions = await prisma.question.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, subject: true },
  });

  return (
    <AppShell name={session.user.name} role={session.user.role}>
      <Link href={`/tutor/students/${params.id}`} className="text-sm text-indigo-600 hover:underline">
        ← 返回 {assignment.student.chineseName}
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-bold">安排个性化面试</h1>
      <Card>
        <ScheduleForm
          studentId={params.id}
          studentName={assignment.student.chineseName}
          questions={questions}
          defaultTutorId={session.user.id}
        />
      </Card>
    </AppShell>
  );
}
