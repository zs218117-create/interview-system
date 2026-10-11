import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertTaAssigned } from "@/lib/access";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "TA" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }
  const body = await req.json();
  const studentId = String(body.studentId || "");
  const title = String(body.title || "").trim();
  const content = String(body.content || "").trim();
  if (!studentId || !title || !content) {
    return NextResponse.json({ error: "学生、标题、内容必填" }, { status: 400 });
  }
  if (session.user.role === "TA") {
    const ok = await assertTaAssigned(session.user.id, studentId);
    if (!ok) return NextResponse.json({ error: "未分配该学生" }, { status: 403 });
  }

  const lesson = await prisma.externalLesson.create({
    data: {
      studentId,
      createdById: session.user.id,
      title,
      provider: body.provider ? String(body.provider) : null,
      date: body.date ? new Date(body.date) : null,
      content,
    },
  });
  return NextResponse.json({ ok: true, id: lesson.id });
}
