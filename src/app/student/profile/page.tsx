import { AppShell } from "@/components/AppShell";
import { Card, EmptyHint } from "@/components/Card";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function StudentProfilePage() {
  const session = await requireRole(["STUDENT"]);
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      assignments: {
        include: {
          tutor: true,
          ta: true,
        },
      },
      documents: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  return (
    <AppShell name={session.user.name} role={session.user.role}>
      <h1 className="mb-6 text-2xl font-bold">我的档案</h1>
      {!profile ? (
        <EmptyHint>档案尚未建立，请联系助教。</EmptyHint>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Card title="基本信息">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-slate-500">中文名</dt><dd>{profile.chineseName}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">英文名</dt><dd>{profile.englishName || "—"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">目标学校</dt><dd>{profile.targetSchool || "—"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">目标专业</dt><dd>{profile.targetCourse || "—"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">年级</dt><dd>{profile.grade || "—"}</dd></div>
            </dl>
          </Card>
          <Card title="指导老师">
            <ul className="space-y-2 text-sm">
              {profile.assignments.map((a) => (
                <li key={a.id} className="flex justify-between">
                  <span>{a.tutor?.name || a.ta?.name}</span>
                  <span className="text-slate-400">{a.roleNote || (a.tutorId ? "导师" : "助教")}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="已上传资料">
            {!profile.documents.length ? (
              <EmptyHint>还没有上传文件</EmptyHint>
            ) : (
              <ul className="space-y-2 text-sm">
                {profile.documents.map((d) => (
                  <li key={d.id} className="flex justify-between gap-2">
                    <span>{d.title}</span>
                    <span className="text-slate-400">{d.type}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </AppShell>
  );
}
