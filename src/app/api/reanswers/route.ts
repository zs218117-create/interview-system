import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }
  const body = await req.json();
  const evaluationId = String(body.evaluationId || "");
  const content = String(body.content || "").trim();
  if (!evaluationId || !content) {
    return NextResponse.json({ error: "评价与回答内容必填" }, { status: 400 });
  }

  const evaluation = await prisma.evaluation.findUnique({
    where: { id: evaluationId },
    include: { student: true },
  });
  if (!evaluation || !evaluation.assignReAnswer) {
    return NextResponse.json({ error: "无效的再次回答任务" }, { status: 400 });
  }
  if (evaluation.student.userId !== session.user.id) {
    return NextResponse.json({ error: "只能回答自己的任务" }, { status: 403 });
  }

  const existing = await prisma.reAnswer.findFirst({
    where: { evaluationId, studentId: session.user.id },
  });
  if (existing) {
    const updated = await prisma.reAnswer.update({
      where: { id: existing.id },
      data: { content, submittedAt: new Date() },
    });
    return NextResponse.json({ ok: true, id: updated.id, updated: true });
  }

  const re = await prisma.reAnswer.create({
    data: {
      evaluationId,
      questionId: evaluation.questionId,
      studentId: session.user.id,
      content,
    },
  });

  // 把对应待办标为完成（标题含「再次回答」的最近一条）
  await prisma.task.updateMany({
    where: {
      studentId: evaluation.studentId,
      assigneeId: session.user.id,
      status: { not: "DONE" },
      title: { contains: "再次回答" },
    },
    data: { status: "DONE" },
  });

  return NextResponse.json({ ok: true, id: re.id });
}
