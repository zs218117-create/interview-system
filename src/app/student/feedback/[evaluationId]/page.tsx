import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Card, EmptyHint } from "@/components/Card";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ReAnswerForm } from "./ReAnswerForm";

export default async function StudentFeedbackDetailPage({
  params,
}: {
  params: { evaluationId: string };
}) {
  const session = await requireRole(["STUDENT"]);
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) notFound();

  const evaluation = await prisma.evaluation.findUnique({
    where: { id: params.evaluationId },
    include: {
      tutor: true,
      question: true,
      interview: true,
      reAnswers: {
        where: { studentId: session.user.id },
        orderBy: { submittedAt: "desc" },
      },
    },
  });
  if (!evaluation || evaluation.studentId !== profile.id) notFound();

  const latest = evaluation.reAnswers[0];

  return (
    <AppShell name={session.user.name} role={session.user.role}>
      <Link href="/student/feedback" className="text-sm text-indigo-600 hover:underline">
        ← 返回反馈列表
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-bold">导师反馈详情</h1>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title={`${evaluation.tutor.name} 的评价`}>
          <p className="mb-2 text-xs text-slate-400">{evaluation.interview.title}</p>
          {evaluation.question && (
            <div className="mb-3 rounded-md bg-slate-50 p-3 text-sm">
              <p className="font-medium">{evaluation.question.title}</p>
              <p className="mt-1 whitespace-pre-wrap text-slate-600">{evaluation.question.content}</p>
            </div>
          )}
          <div className="space-y-2 text-sm">
            <p className="whitespace-pre-wrap">{evaluation.content}</p>
            {evaluation.strengths && (
              <p>
                <span className="text-slate-500">优点：</span>
                {evaluation.strengths}
              </p>
            )}
            {evaluation.improvements && (
              <p>
                <span className="text-slate-500">待改进：</span>
                {evaluation.improvements}
              </p>
            )}
          </div>
        </Card>

        <Card title="再次回答">
          {!evaluation.assignReAnswer ? (
            <EmptyHint>导师未布置再次回答</EmptyHint>
          ) : (
            <ReAnswerForm evaluationId={evaluation.id} initial={latest?.content} />
          )}
        </Card>
      </div>
    </AppShell>
  );
}
