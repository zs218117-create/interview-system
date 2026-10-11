import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Card, EmptyHint, Badge } from "@/components/Card";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { QuestionForm } from "./QuestionForm";

export default async function TutorQuestionsPage() {
  const session = await requireRole(["TUTOR", "ADMIN"]);
  const questions = await prisma.question.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      creator: { select: { name: true } },
      _count: { select: { attachments: true } },
    },
  });

  return (
    <AppShell name={session.user.name} role={session.user.role}>
      <h1 className="mb-6 text-2xl font-bold">题库</h1>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="创建新题">
          <QuestionForm />
          <p className="mt-3 text-xs text-slate-500">
            创建后可进入题目详情上传 PDF / Word / 图片 / 压缩包，并自动提取或 OCR 文字。
          </p>
        </Card>
        <Card title={`已有题目（${questions.length}）`}>
          {!questions.length ? (
            <EmptyHint>还没有题目</EmptyHint>
          ) : (
            <ul className="max-h-[32rem] space-y-3 overflow-y-auto">
              {questions.map((q) => (
                <li key={q.id} className="rounded-lg border border-slate-100 p-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/tutor/questions/${q.id}`}
                      className="font-medium text-indigo-700 hover:underline"
                    >
                      {q.title}
                    </Link>
                    <div className="flex gap-1">
                      {q.subject && <Badge>{q.subject}</Badge>}
                      {q.difficulty && <Badge>{q.difficulty}</Badge>}
                      {q._count.attachments > 0 && (
                        <Badge>附件 {q._count.attachments}</Badge>
                      )}
                    </div>
                  </div>
                  <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-slate-600">{q.content}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    创建人：{q.creator.name} ·{" "}
                    <Link href={`/tutor/questions/${q.id}`} className="text-indigo-600 hover:underline">
                      上传/识别附件 →
                    </Link>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
