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
  const interviewId = String(body.interviewId || "");
  const content = String(body.content || "").trim();
  const questionId = body.questionId ? String(body.questionId) : null;
  const strengths = body.strengths ? String(body.strengths) : null;
  const improvements = body.improvements ? String(body.improvements) : null;
  const scoreHint = body.scoreHint ? String(body.scoreHint) : null;
  const originalAnswerNotes = body.originalAnswerNotes
    ? String(body.originalAnswerNotes)
    : null;
  const assignReAnswer = !!body.assignReAnswer;

  if (!interviewId || !content) {
    return NextResponse.json({ error: "面试场次与评价内容必填" }, { status: 400 });
  }

  const interview = await prisma.interviewSession.findUnique({
    where: { id: interviewId },
    include: { student: true },
  });
  if (!interview) return NextResponse.json({ error: "面试不存在" }, { status: 404 });

  const ok = await assertTutorAssigned(session.user.id, interview.studentId);
  if (!ok) return NextResponse.json({ error: "未分配该学生" }, { status: 403 });

  const evaluation = await prisma.evaluation.create({
    data: {
      interviewId,
      studentId: interview.studentId,
      tutorId: session.user.id,
      questionId,
      content,
      strengths,
      improvements,
      scoreHint,
      originalAnswerNotes,
      assignReAnswer,
    },
  });

  // 布置再次回答时同步创建学生任务
  if (assignReAnswer) {
    await prisma.task.create({
      data: {
        studentId: interview.studentId,
        createdById: session.user.id,
        assigneeId: interview.student.userId,
        title: `再次回答：${questionId ? "指定题目" : interview.title}`,
        description: improvements || content,
        status: "PENDING",
      },
    });
  }

  return NextResponse.json({ ok: true, id: evaluation.id });
}
