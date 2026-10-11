import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Card, Badge } from "@/components/Card";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AttachmentPanel } from "../AttachmentPanel";

export default async function TutorQuestionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await requireRole(["TUTOR", "ADMIN"]);
  const q = await prisma.question.findUnique({
    where: { id: params.id },
    include: {
      creator: { select: { name: true } },
      attachments: {
        where: { parentId: null },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!q) notFound();

  return (
    <AppShell name={session.user.name} role={session.user.role}>
      <Link href="/tutor/questions" className="text-sm text-indigo-600 hover:underline">
        ← 返回题库
      </Link>
      <div className="mt-2 mb-4 flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold">{q.title}</h1>
        {q.subject && <Badge>{q.subject}</Badge>}
        {q.difficulty && <Badge>{q.difficulty}</Badge>}
      </div>
      <p className="mb-4 text-xs text-slate-400">创建人：{q.creator.name}</p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="题目内容">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{q.content}</p>
        </Card>
        <Card title="附件与文字提取" action={<Badge>{q.attachments.length} 个</Badge>}>
          <AttachmentPanel questionId={q.id} />
        </Card>
      </div>
    </AppShell>
  );
}
