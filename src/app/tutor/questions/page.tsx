import { AppShell } from "@/components/AppShell";
import { Card, EmptyHint, Badge } from "@/components/Card";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { QuestionForm } from "./QuestionForm";

export default async function TutorQuestionsPage() {
  const session = await requireRole(["TUTOR", "ADMIN"]);
  const questions = await prisma.question.findMany({
    orderBy: { createdAt: "desc" },
    include: { creator: { select: { name: true } } },
  });

  return (
    <AppShell name={session.user.name} role={session.user.role}>
      <h1 className="mb-6 text-2xl font-bold">题库</h1>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="创建新题">
          <QuestionForm />
        </Card>
        <Card title={`已有题目（${questions.length}）`}>
          {!questions.length ? (
            <EmptyHint>还没有题目</EmptyHint>
          ) : (
            <ul className="max-h-[32rem] space-y-3 overflow-y-auto">
              {questions.map((q) => (
                <li key={q.id} className="rounded-lg border border-slate-100 p-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{q.title}</p>
                    <div className="flex gap-1">
                      {q.subject && <Badge>{q.subject}</Badge>}
                      {q.difficulty && <Badge>{q.difficulty}</Badge>}
                    </div>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-slate-600">{q.content}</p>
                  <p className="mt-1 text-xs text-slate-400">创建人：{q.creator.name}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
