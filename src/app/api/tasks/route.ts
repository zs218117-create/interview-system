import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertTaAssigned, assertTutorAssigned } from "@/lib/access";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["TA", "TUTOR", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }
  const body = await req.json();
  const studentId = String(body.studentId || "");
  const title = String(body.title || "").trim();
  if (!studentId || !title) {
    return NextResponse.json({ error: "学生与标题必填" }, { status: 400 });
  }

  if (session.user.role === "TA") {
    const ok = await assertTaAssigned(session.user.id, studentId);
    if (!ok) return NextResponse.json({ error: "未分配该学生" }, { status: 403 });
  }
  if (session.user.role === "TUTOR") {
    const ok = await assertTutorAssigned(session.user.id, studentId);
    if (!ok) return NextResponse.json({ error: "未分配该学生" }, { status: 403 });
  }

  const profile = await prisma.studentProfile.findUnique({ where: { id: studentId } });
  if (!profile) return NextResponse.json({ error: "学生不存在" }, { status: 404 });

  const task = await prisma.task.create({
    data: {
      studentId,
      createdById: session.user.id,
      assigneeId: body.assigneeId ? String(body.assigneeId) : profile.userId,
      title,
      description: body.description ? String(body.description) : null,
      status: "PENDING",
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
    },
  });
  return NextResponse.json({ ok: true, id: task.id });
}
