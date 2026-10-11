import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/Card";
import { InterviewGuidanceTips } from "@/components/guidance/InterviewGuidanceTips";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { EvaluateForm } from "./EvaluateForm";

export default async function EvaluatePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { interviewId?: string };
}) {
  const session = await requireRole(["TUTOR"]);
  const assignment = await prisma.tutorStudentAssignment.findFirst({
    where: { tutorId: session.user.id, studentId: params.id },
    include: { student: true },
  });
  if (!assignment) notFound();

  const interviews = await prisma.interviewSession.findMany({
    where: { studentId: params.id },
    orderBy: { scheduledAt: "desc" },
    include: {
      questions: { include: { question: true }, orderBy: { orderIndex: "asc" } },
    },
  });

  return (
    <AppShell name={session.user.name} role={session.user.role}>
      <Link href={`/tutor/students/${params.id}`} className="text-sm text-indigo-600 hover:underline">
        ← 返回 {assignment.student.chineseName}
      </Link>
      <h1 className="mt-2 mb-4 text-2xl font-bold">填写评价</h1>
      <div className="mb-4" id="guidance-tips">
        <InterviewGuidanceTips variant="evaluate" defaultOpen />
      </div>
      <Card title={`学生：${assignment.student.chineseName}`}>
        <EvaluateForm
          studentId={params.id}
          interviews={interviews.map((iv) => ({
            id: iv.id,
            title: iv.title,
            questions: iv.questions.map((q) => ({
              questionId: q.questionId,
              question: { id: q.question.id, title: q.question.title },
            })),
          }))}
          defaultInterviewId={searchParams.interviewId}
        />
      </Card>
    </AppShell>
  );
}
