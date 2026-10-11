import { prisma } from "./prisma";
import type { Role } from "@/types/roles";

/** 当前用户是否有权访问该学生档案（分配关系或本人或管理员） */
export async function canAccessStudent(
  user: { id: string; role: Role },
  studentProfileId: string
): Promise<boolean> {
  if (user.role === "ADMIN") return true;

  const profile = await prisma.studentProfile.findUnique({
    where: { id: studentProfileId },
    select: { userId: true },
  });
  if (!profile) return false;

  if (user.role === "STUDENT") {
    return profile.userId === user.id;
  }

  if (user.role === "TUTOR") {
    const a = await prisma.tutorStudentAssignment.findFirst({
      where: { studentId: studentProfileId, tutorId: user.id },
    });
    return !!a;
  }

  if (user.role === "TA") {
    const a = await prisma.tutorStudentAssignment.findFirst({
      where: { studentId: studentProfileId, taId: user.id },
    });
    return !!a;
  }

  return false;
}

export async function assertTutorAssigned(tutorId: string, studentProfileId: string) {
  const a = await prisma.tutorStudentAssignment.findFirst({
    where: { tutorId, studentId: studentProfileId },
  });
  return !!a;
}

export async function assertTaAssigned(taId: string, studentProfileId: string) {
  const a = await prisma.tutorStudentAssignment.findFirst({
    where: { taId, studentId: studentProfileId },
  });
  return !!a;
}

/** 文档下载权限：学生本人、已分配导师/助教、管理员 */
export async function canDownloadDocument(
  user: { id: string; role: Role },
  documentId: string
) {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: { student: true },
  });
  if (!doc) return { ok: false as const, doc: null };
  const allowed = await canAccessStudent(user, doc.studentId);
  return { ok: allowed, doc };
}

export async function canDownloadRecord(
  user: { id: string; role: Role },
  recordId: string
) {
  const record = await prisma.interviewRecord.findUnique({
    where: { id: recordId },
    include: { interview: true },
  });
  if (!record) return { ok: false as const, record: null };
  const allowed = await canAccessStudent(user, record.interview.studentId);
  return { ok: allowed, record };
}
