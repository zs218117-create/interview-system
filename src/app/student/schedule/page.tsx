import { AppShell } from "@/components/AppShell";
import { Card, EmptyHint, Badge } from "@/components/Card";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function StudentSchedulePage() {
  const session = await requireRole(["STUDENT"]);
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
  });
  const interviews = profile
    ? await prisma.interviewSession.findMany({
        where: { studentId: profile.id },
        orderBy: { scheduledAt: "asc" },
        include: {
          tutors: { include: { tutor: true } },
          questions: { include: { question: true }, orderBy: { orderIndex: "asc" } },
        },
      })
    : [];

  return (
    <AppShell name={session.user.name} role={session.user.role}>
      <h1 className="mb-6 text-2xl font-bold">课表与面试安排</h1>
      <Card>
        {!interviews.length ? (
          <EmptyHint>暂无面试安排。安排后会显示腾讯会议入口。</EmptyHint>
        ) : (
          <ul className="space-y-4">
            {interviews.map((iv) => (
              <li key={iv.id} className="rounded-xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold">{iv.title}</h3>
                  <Badge>{iv.status === "SCHEDULED" ? "已安排" : iv.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {new Date(iv.scheduledAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })} · {iv.durationMin} 分钟
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  导师：{iv.tutors.map((t) => t.tutor.name).join("、") || "—"}
                </p>
                {iv.questions.length > 0 && (
                  <p className="mt-1 text-sm text-slate-600">
                    题目：{iv.questions.map((q) => q.question.title).join("；")}
                  </p>
                )}
                {iv.meetingUrl && (
                  <a
                    href={iv.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700"
                  >
                    进入腾讯会议
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </AppShell>
  );
}
