import { AppShell } from "@/components/AppShell";
import { Card, EmptyHint, Badge } from "@/components/Card";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { UploadForm } from "./UploadForm";

const TYPE_LABEL: Record<string, string> = {
  PERSONAL_STATEMENT: "个人陈述",
  EPQ: "EPQ",
  CV: "简历",
  TRANSCRIPT: "成绩单",
  OTHER: "其他",
};

export default async function StudentDocumentsPage() {
  const session = await requireRole(["STUDENT"]);
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
  });
  const docs = profile
    ? await prisma.document.findMany({
        where: { studentId: profile.id },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <AppShell name={session.user.name} role={session.user.role}>
      <h1 className="mb-6 text-2xl font-bold">资料上传</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="上传新文件">
          {profile ? <UploadForm /> : <EmptyHint>档案未建立，无法上传</EmptyHint>}
        </Card>
        <Card title="已上传列表">
          {!docs.length ? (
            <EmptyHint>暂无文件</EmptyHint>
          ) : (
            <ul className="divide-y divide-slate-100">
              {docs.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-medium">{d.title}</p>
                    <p className="text-xs text-slate-400">
                      {d.fileName} · {new Date(d.createdAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a className="text-sm text-indigo-600 hover:underline" href={`/api/documents/${d.id}/download`}>下载</a>
                    <Badge>{TYPE_LABEL[d.type] || d.type}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
