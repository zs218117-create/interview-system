import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertTutorAssigned } from "@/lib/access";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "TUTOR" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }
  const body = await req.json();
  const studentId = String(body.studentId || "");
  const title = String(body.title || "").trim();
  const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
  const meetingUrl = body.meetingUrl ? String(body.meetingUrl).trim() : null;
  const durationMin = Number(body.durationMin) || 30;
  const notes = body.notes ? String(body.notes) : null;
  const questionIds: string[] = Array.isArray(body.questionIds)
    ? body.questionIds.map(String)
    : [];
  const tutorIds: string[] = Array.isArray(body.tutorIds)
    ? body.tutorIds.map(String)
    : [session.user.id];

  if (!studentId || !title || !scheduledAt || Number.isNaN(scheduledAt.getTime())) {
    return NextResponse.json({ error: "请填写学生、标题与面试时间" }, { status: 400 });
  }

  if (session.user.role === "TUTOR") {
    const ok = await assertTutorAssigned(session.user.id, studentId);
    if (!ok) return NextResponse.json({ error: "未分配该学生" }, { status: 403 });
  }

  const interview = await prisma.interviewSession.create({
    data: {
      studentId,
      title,
      scheduledAt,
      durationMin,
      meetingUrl,
      notes,
      status: "SCHEDULED",
      tutors: {
        create: Array.from(new Set(tutorIds)).map((tutorId) => ({ tutorId })),
      },
      questions: {
        create: questionIds.map((questionId, i) => ({
          questionId,
          orderIndex: i + 1,
        })),
      },
    },
  });

  return NextResponse.json({ ok: true, id: interview.id });
}
