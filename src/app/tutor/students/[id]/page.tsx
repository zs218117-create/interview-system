import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Card, EmptyHint, Badge } from "@/components/Card";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { statusLabel } from "@/lib/labels";
import { ObservationForm } from "./ObservationForm";
import { InterviewGuidanceTips } from "@/components/guidance/InterviewGuidanceTips";

export default async function TutorStudentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await requireRole(["TUTOR"]);

  const assignment = await prisma.tutorStudentAssignment.findFirst({
    where: { tutorId: session.user.id, studentId: params.id },
  });
  if (!assignment) notFound();

  const student = await prisma.studentProfile.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      documents: { orderBy: { createdAt: "desc" } },
      assignments: { include: { tutor: true, ta: true } },
      interviews: {
        orderBy: { scheduledAt: "desc" },
        include: {
          tutors: { include: { tutor: true } },
          questions: { include: { question: true } },
          records: true,
          evaluations: {
            include: {
              tutor: true,
              question: true,
              reAnswers: { orderBy: { submittedAt: "desc" } },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      },
      observations: {
        include: { tutor: true },
        orderBy: { createdAt: "desc" },
      },
      journalEntries: { orderBy: { date: "desc" }, take: 5 },
      externalLessons: { orderBy: { createdAt: "desc" }, take: 5 },
      tasks: { orderBy: { createdAt: "desc" }, take: 8 },
    },
  });
  if (!student) notFound();

  return (
    <AppShell name={session.user.name} role={session.user.role}>
      <div className="mb-6">
        <Link href="/tutor/students" className="text-sm text-indigo-600 hover:underline">
          ← 返回学生列表
        </Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{student.chineseName}</h1>
            <p className="text-sm text-slate-500">
              {student.englishName} · {student.targetSchool} · {student.targetCourse}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/tutor/students/${student.id}/schedule`}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700"
            >
              安排面试
            </Link>
            <Link
              href={`/tutor/students/${student.id}/evaluate`}
              className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm text-indigo-700"
            >
              填写评价
            </Link>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <InterviewGuidanceTips variant="detail" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="背景档案">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">邮箱</dt><dd>{student.user.email}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">年级</dt><dd>{student.grade || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">电话</dt><dd>{student.phone || "—"}</dd></div>
            <div><dt className="text-slate-500">备注</dt><dd className="mt-1">{student.notes || "—"}</dd></div>
          </dl>
        </Card>

        <Card title="指导团队">
          <ul className="space-y-2 text-sm">
            {student.assignments.map((a) => (
              <li key={a.id} className="flex justify-between">
                <span>{a.tutor?.name || a.ta?.name}</span>
                <span className="text-slate-400">{a.roleNote || "—"}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="已上传资料">
          {!student.documents.length ? (
            <EmptyHint>暂无资料</EmptyHint>
          ) : (
            <ul className="space-y-2 text-sm">
              {student.documents.map((d) => (
                <li key={d.id} className="flex justify-between gap-2">
                  <span>{d.title}</span>
                  <a className="text-indigo-600 hover:underline" href={`/api/documents/${d.id}/download`}>
                    下载
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="导师观察（可多人并行）">
          <div className="mb-4">
            <ObservationForm studentId={student.id} />
          </div>
          {!student.observations.length ? (
            <EmptyHint>暂无观察记录</EmptyHint>
          ) : (
            <ul className="space-y-3">
              {student.observations.map((o) => (
                <li key={o.id} className="rounded-lg border border-slate-100 p-3 text-sm">
                  <p className="text-xs text-slate-400">
                    {o.tutor.name} ·{" "}
                    {new Date(o.createdAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">{o.content}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="面试安排与记录">
          {!student.interviews.length ? (
            <EmptyHint>暂无面试，点击上方「安排面试」</EmptyHint>
          ) : (
            <ul className="space-y-4">
              {student.interviews.map((iv) => (
                <li key={iv.id} className="rounded-lg border border-slate-100 p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{iv.title}</p>
                    <Badge>{statusLabel(iv.status)}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(iv.scheduledAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}
                  </p>
                  {iv.meetingUrl && (
                    <a href={iv.meetingUrl} className="text-indigo-600 hover:underline" target="_blank" rel="noreferrer">
                      腾讯会议链接
                    </a>
                  )}
                  {iv.questions.length > 0 && (
                    <p className="mt-2 text-slate-600">
                      题目：{iv.questions.map((q) => q.question.title).join("；")}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Link
                      href={`/tutor/students/${student.id}/evaluate?interviewId=${iv.id}`}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      针对此场写评价
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="评价与再次回答对比">
          {student.interviews.every((iv) => !iv.evaluations.length) ? (
            <EmptyHint>暂无评价。点击「填写评价」开始。</EmptyHint>
          ) : (
            <ul className="space-y-3">
              {student.interviews.flatMap((iv) =>
                iv.evaluations.map((ev) => (
                  <li key={ev.id} className="rounded-lg border border-slate-100 p-3 text-sm">
                    <p className="font-medium">
                      {ev.tutor.name}
                      {ev.question ? ` · ${ev.question.title}` : ""}
                    </p>
                    <p className="mt-1 text-slate-600 line-clamp-3">{ev.content}</p>
                    {ev.assignReAnswer && (
                      <p className="mt-2 text-xs text-amber-600">
                        已布置再次回答
                        {ev.reAnswers.length ? ` · 学生已提交 ${ev.reAnswers.length} 次` : " · 等待学生提交"}
                      </p>
                    )}
                    {ev.compareNotes && (
                      <p className="mt-1 text-xs text-indigo-700">改进备注：{ev.compareNotes}</p>
                    )}
                    <Link
                      href={`/tutor/students/${student.id}/compare/${ev.id}`}
                      className="mt-2 inline-block text-xs font-medium text-indigo-600 hover:underline"
                    >
                      打开对比视图 →
                    </Link>
                  </li>
                ))
              )}
            </ul>
          )}
        </Card>

        <Card title="每日收获（最近）">
          {!student.journalEntries.length ? (
            <EmptyHint>暂无</EmptyHint>
          ) : (
            <ul className="space-y-2 text-sm">
              {student.journalEntries.map((j) => (
                <li key={j.id}>
                  <span className="text-xs text-slate-400">
                    {new Date(j.date).toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai" })}
                  </span>
                  <p>{j.content}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="外部补习与任务">
          <div className="space-y-3 text-sm">
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">外部补习</p>
              {!student.externalLessons.length ? (
                <EmptyHint>暂无</EmptyHint>
              ) : (
                student.externalLessons.map((l) => (
                  <p key={l.id}>
                    {l.title}
                    {l.provider ? `（${l.provider}）` : ""}
                  </p>
                ))
              )}
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">任务状态</p>
              {!student.tasks.length ? (
                <EmptyHint>暂无任务</EmptyHint>
              ) : (
                student.tasks.map((t) => (
                  <p key={t.id} className="flex justify-between gap-2">
                    <span>{t.title}</span>
                    <Badge>{statusLabel(t.status)}</Badge>
                  </p>
                ))
              )}
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
