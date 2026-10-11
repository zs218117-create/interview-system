import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Card, EmptyHint, Badge } from "@/components/Card";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function StudentFeedbackPage() {
  const session = await requireRole(["STUDENT"]);
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
  });
  const evaluations = profile
    ? await prisma.evaluation.findMany({
        where: { studentId: profile.id },
        orderBy: { createdAt: "desc" },
        include: {
          tutor: true,
          question: true,
          interview: true,
          reAnswers: { where: { studentId: session.user.id } },
        },
      })
    : [];

  return (
    <AppShell name={session.user.name} role={session.user.role}>
      <h1 className="mb-6 text-2xl font-bold">反馈与再次回答</h1>
      <Card>
        {!evaluations.length ? (
          <EmptyHint>暂无导师评价</EmptyHint>
        ) : (
          <ul className="space-y-4">
            {evaluations.map((ev) => (
              <li key={ev.id} className="rounded-xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {ev.tutor.name}
                      {ev.question ? ` · ${ev.question.title}` : ""}
                    </p>
                    <p className="text-xs text-slate-400">{ev.interview.title}</p>
                  </div>
                  <div className="flex gap-2">
                    {ev.assignReAnswer && (
                      <Badge>{ev.reAnswers.length ? "已再答" : "待再答"}</Badge>
                    )}
                  </div>
                </div>
                <p className="mt-2 line-clamp-3 text-sm text-slate-600">{ev.content}</p>
                <Link
                  href={`/student/feedback/${ev.id}`}
                  className="mt-3 inline-block text-sm text-indigo-600 hover:underline"
                >
                  查看详情{ev.assignReAnswer && !ev.reAnswers.length ? "并提交再次回答" : ""} →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </AppShell>
  );
}
