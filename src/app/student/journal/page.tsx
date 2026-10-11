import { AppShell } from "@/components/AppShell";
import { Card, EmptyHint } from "@/components/Card";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { JournalForm } from "./JournalForm";

export default async function StudentJournalPage() {
  const session = await requireRole(["STUDENT"]);
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
  });
  const entries = profile
    ? await prisma.journalEntry.findMany({
        where: { studentId: profile.id },
        orderBy: { date: "desc" },
        take: 20,
      })
    : [];

  return (
    <AppShell name={session.user.name} role={session.user.role}>
      <h1 className="mb-6 text-2xl font-bold">每日收获</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="写一条">
          {profile ? <JournalForm /> : <EmptyHint>档案未建立</EmptyHint>}
        </Card>
        <Card title="最近记录">
          {!entries.length ? (
            <EmptyHint>还没有记录</EmptyHint>
          ) : (
            <ul className="space-y-3">
              {entries.map((e) => (
                <li key={e.id} className="rounded-lg border border-slate-100 p-3 text-sm">
                  <p className="text-xs text-slate-400">
                    {new Date(e.date).toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai" })}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">{e.content}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
