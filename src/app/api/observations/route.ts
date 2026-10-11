import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertTutorAssigned } from "@/lib/access";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "TUTOR") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }
  const body = await req.json();
  const studentId = String(body.studentId || "");
  const content = String(body.content || "").trim();
  if (!studentId || !content) {
    return NextResponse.json({ error: "学生与内容必填" }, { status: 400 });
  }
  const ok = await assertTutorAssigned(session.user.id, studentId);
  if (!ok) return NextResponse.json({ error: "未分配该学生" }, { status: 403 });

  const obs = await prisma.observation.create({
    data: {
      studentId,
      tutorId: session.user.id,
      content,
    },
  });
  return NextResponse.json({ ok: true, id: obs.id });
}
