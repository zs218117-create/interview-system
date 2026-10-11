import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Card, EmptyHint, Badge } from "@/components/Card";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { CompareNotesForm } from "./CompareNotesForm";

export default async function ComparePage({
  params,
}: {
  params: { id: string; evaluationId: string };
}) {
  const session = await requireRole(["TUTOR"]);
  const assignment = await prisma.tutorStudentAssignment.findFirst({
    where: { tutorId: session.user.id, studentId: params.id },
  });
  if (!assignment) notFound();

  const evaluation = await prisma.evaluation.findUnique({
    where: { id: params.evaluationId },
    include: {
      tutor: true,
      question: true,
      interview: {
        include: {
          records: true,
          student: true,
        },
      },
      reAnswers: { orderBy: { submittedAt: "desc" } },
    },
  });
  if (!evaluation || evaluation.studentId !== params.id) notFound();

  const latestRe = evaluation.reAnswers[0];

  return (
    <AppShell name={session.user.name} role={session.user.role}>
      <Link href={`/tutor/students/${params.id}`} className="text-sm text-indigo-600 hover:underline">
        ← 返回 {evaluation.interview.student.chineseName}
      </Link>
      <h1 className="mt-2 mb-2 text-2xl font-bold">对比两次回答</h1>
      <p className="mb-6 text-sm text-slate-500">
        {evaluation.interview.title}
        {evaluation.question ? ` · ${evaluation.question.title}` : ""}
      </p>

      <div className="mb-4 grid gap-4 md:grid-cols-2" id="compare-view">
        <Card title="首次表现 / 材料">
          {evaluation.question && (
            <div className="mb-3 rounded-md bg-slate-50 p-2 text-sm">
              <p className="text-xs text-slate-400">题目</p>
              <p className="font-medium">{evaluation.question.title}</p>
              <p className="mt-1 whitespace-pre-wrap text-slate-600">{evaluation.question.content}</p>
            </div>
          )}
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-xs font-medium text-slate-500">现场摘要</p>
              <p className="whitespace-pre-wrap">{evaluation.originalAnswerNotes || "（未填写）"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">评价</p>
              <p className="whitespace-pre-wrap">{evaluation.content}</p>
            </div>
            {evaluation.strengths && (
              <div>
                <p className="text-xs font-medium text-slate-500">优点</p>
                <p className="whitespace-pre-wrap">{evaluation.strengths}</p>
              </div>
            )}
            {evaluation.improvements && (
              <div>
                <p className="text-xs font-medium text-slate-500">待改进要求</p>
                <p className="whitespace-pre-wrap">{evaluation.improvements}</p>
              </div>
            )}
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">关联面试记录</p>
              {!evaluation.interview.records.length ? (
                <EmptyHint>暂无上传记录</EmptyHint>
              ) : (
                <ul className="space-y-1">
                  {evaluation.interview.records.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-2">
                      <span>{r.title}</span>
                      <span className="flex items-center gap-2">
                        <Badge>{r.recordType}</Badge>
                        {r.filePath && (
                          <a
                            className="text-indigo-600 hover:underline"
                            href={`/api/records/${r.id}/download`}
                          >
                            下载
                          </a>
                        )}
                        {r.externalUrl && (
                          <a className="text-indigo-600 hover:underline" href={r.externalUrl} target="_blank" rel="noreferrer">
                            链接
                          </a>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Card>

        <Card title="学生再次回答">
          {!latestRe ? (
            <EmptyHint>学生尚未提交再次回答</EmptyHint>
          ) : (
            <div className="text-sm">
              <p className="mb-2 text-xs text-slate-400">
                提交于{" "}
                {new Date(latestRe.submittedAt).toLocaleString("zh-CN", {
                  timeZone: "Asia/Shanghai",
                })}
              </p>
              <p className="whitespace-pre-wrap leading-relaxed">{latestRe.content}</p>
            </div>
          )}
        </Card>
      </div>

      <Card title="保存改进判断">
        <CompareNotesForm
          evaluationId={evaluation.id}
          initial={evaluation.compareNotes || ""}
        />
        {evaluation.compareNotes && (
          <p className="mt-3 rounded-md bg-indigo-50 p-3 text-sm text-indigo-900">
            当前已存备注：{evaluation.compareNotes}
          </p>
        )}
      </Card>
    </AppShell>
  );
}
