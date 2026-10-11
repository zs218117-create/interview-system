import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Card, EmptyHint, Badge } from "@/components/Card";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function StudentHomePage() {
  const session = await requireRole(["STUDENT"]);
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      interviews: {
        orderBy: { scheduledAt: "asc" },
        take: 5,
        include: { tutors: { include: { tutor: true } } },
      },
      tasks: { where: { status: { not: "DONE" } }, take: 5, orderBy: { dueDate: "asc" } },
    },
  });

  return (
    <AppShell name={session.user.name} role={session.user.role}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">你好，{profile?.chineseName || session.user.name}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {profile?.targetSchool} · {profile?.targetCourse}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="即将到来的面试" action={<Link href="/student/schedule" className="text-sm text-indigo-600">全部</Link>}>
          {!profile?.interviews.length ? (
            <EmptyHint>暂无面试安排</EmptyHint>
          ) : (
            <ul className="space-y-3">
              {profile.interviews.map((iv) => (
                <li key={iv.id} className="rounded-lg border border-slate-100 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm">{iv.title}</p>
                    <Badge>{iv.status === "SCHEDULED" ? "已安排" : iv.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(iv.scheduledAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })} · {iv.durationMin} 分钟
                  </p>
                  {iv.meetingUrl && (
                    <a href={iv.meetingUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-indigo-600 hover:underline">
                      进入腾讯会议
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="待办任务">
          {!profile?.tasks.length ? (
            <EmptyHint>暂无待办</EmptyHint>
          ) : (
            <ul className="space-y-2">
              {profile.tasks.map((t) => (
                <li key={t.id} className="flex items-start justify-between gap-2 text-sm">
                  <span>{t.title}</span>
                  <Badge>{t.status === "PENDING" ? "待完成" : "进行中"}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="快捷入口">
          <div className="flex flex-wrap gap-2">
            <Link href="/student/documents" className="rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-700">上传资料</Link>
            <Link href="/student/feedback" className="rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-700">反馈与再答</Link>
            <Link href="/student/tasks" className="rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-700">我的任务</Link>
            <Link href="/student/journal" className="rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-700">写每日收获</Link>
            <Link href="/student/profile" className="rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-700">查看档案</Link>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
