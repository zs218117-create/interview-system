import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertTutorAssigned } from "@/lib/access";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "TUTOR") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }
  const body = await req.json();
  const compareNotes = String(body.compareNotes || "").trim();
  if (!compareNotes) {
    return NextResponse.json({ error: "请填写改进备注" }, { status: 400 });
  }

  const evaluation = await prisma.evaluation.findUnique({
    where: { id: params.id },
  });
  if (!evaluation) return NextResponse.json({ error: "评价不存在" }, { status: 404 });

  const ok = await assertTutorAssigned(session.user.id, evaluation.studentId);
  if (!ok) return NextResponse.json({ error: "未分配该学生" }, { status: 403 });

  await prisma.evaluation.update({
    where: { id: params.id },
    data: { compareNotes },
  });

  return NextResponse.json({ ok: true });
}
